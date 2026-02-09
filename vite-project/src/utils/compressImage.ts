/**
 * 生产级图片压缩工具
 * 支持多输出格式、图片方向校正、透明背景处理、最小压缩阈值等
 */

// 压缩输出格式类型
export type CompressOutputFormat = 'base64' | 'blob' | 'file';

// 压缩配置选项
export interface CompressOptions {
  /** 最大宽度，默认 800 */
  maxWidth?: number;
  /** 最大高度，默认 800 */
  maxHeight?: number;
  /** 压缩质量 (0-1)，默认 0.8 */
  quality?: number;
  /** 最小压缩体积（字节），小于此值不压缩，默认 50KB */
  minCompressSize?: number;
  /** 输出格式，默认 'base64' */
  outputFormat?: CompressOutputFormat;
  /** 压缩进度回调 (0-100) */
  onProgress?: (progress: number) => void;
  /** 是否校正图片方向（EXIF），默认 true */
  correctOrientation?: boolean;
}

// 压缩结果类型
export interface CompressResult {
  /** 压缩后的数据（根据 outputFormat 返回不同类型） */
  data: string | Blob | File;
  /** 原始文件大小（字节） */
  originalSize: number;
  /** 压缩后大小（字节） */
  compressedSize: number;
  /** 压缩率 (0-1) */
  compressionRatio: number;
}

// 错误类型常量
export const CompressErrorType = {
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  IMAGE_LOAD_ERROR: 'IMAGE_LOAD_ERROR',
  CANVAS_ERROR: 'CANVAS_ERROR',
  COMPRESS_ERROR: 'COMPRESS_ERROR',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
} as const;

export type CompressErrorType = typeof CompressErrorType[keyof typeof CompressErrorType];

// 自定义错误类
export class CompressError extends Error {
  public type: CompressErrorType;
  public originalError?: Error;

  constructor(type: CompressErrorType, message: string, originalError?: Error) {
    super(message);
    this.name = 'CompressError';
    this.type = type;
    this.originalError = originalError;
  }
}

/**
 * 获取图片的 EXIF 方向信息
 * @param file 图片文件
 * @returns Promise<number> EXIF 方向值 (1-8)
 */
function getImageOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const target = e.target as FileReader;
      if (!target || !target.result) {
        resolve(1);
        return;
      }
      const view = new DataView(target.result as ArrayBuffer);
      if (view.getUint16(0, false) !== 0xffd8) {
        // 不是 JPEG 格式，返回默认方向
        resolve(1);
        return;
      }
      const length = view.byteLength;
      let offset = 2;
      while (offset < length) {
        if (view.getUint16(offset, false) === 0xffe1) {
          // 找到 APP1 标记（EXIF）
          const exifLength = view.getUint16(offset + 2, false);
          if (view.getUint32(offset + 4, false) === 0x45786966) {
            // 找到 "Exif" 字符串
            const tiffOffset = offset + 10;
            const isLittleEndian = view.getUint16(tiffOffset, false) === 0x4949;
            const ifdOffset = view.getUint32(tiffOffset + 4, isLittleEndian);
            const ifdPointer = tiffOffset + ifdOffset;
            const numEntries = view.getUint16(ifdPointer, isLittleEndian);
            for (let i = 0; i < numEntries; i++) {
              const entryOffset = ifdPointer + 2 + i * 12;
              const tag = view.getUint16(entryOffset, isLittleEndian);
              if (tag === 0x0112) {
                // Orientation tag
                const orientation = view.getUint16(entryOffset + 8, isLittleEndian);
                resolve(orientation || 1);
                return;
              }
            }
          }
          offset += exifLength + 2;
        } else {
          offset += 2;
        }
      }
      resolve(1); // 默认方向
    };
    reader.onerror = () => resolve(1);
    reader.readAsArrayBuffer(file.slice(0, 64 * 1024)); // 只读取前 64KB
  });
}

/**
 * 根据 EXIF 方向校正图片
 * @param ctx Canvas 2D 上下文
 * @param width 图片宽度
 * @param height 图片高度
 * @param orientation EXIF 方向值
 */
function correctImageOrientation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  orientation: number
): { width: number; height: number } {
  switch (orientation) {
    case 2:
      // 水平翻转
      ctx.transform(-1, 0, 0, 1, width, 0);
      return { width, height };
    case 3:
      // 旋转 180 度
      ctx.transform(-1, 0, 0, -1, width, height);
      return { width, height };
    case 4:
      // 垂直翻转
      ctx.transform(1, 0, 0, -1, 0, height);
      return { width, height };
    case 5:
      // 顺时针 90 度 + 水平翻转
      ctx.transform(0, 1, 1, 0, 0, 0);
      return { width: height, height: width };
    case 6:
      // 顺时针 90 度
      ctx.transform(0, 1, -1, 0, height, 0);
      return { width: height, height: width };
    case 7:
      // 逆时针 90 度 + 水平翻转
      ctx.transform(0, -1, -1, 0, height, width);
      return { width: height, height: width };
    case 8:
      // 逆时针 90 度
      ctx.transform(0, -1, 1, 0, 0, width);
      return { width: height, height: width };
    default:
      return { width, height };
  }
}

/**
 * 检测图片是否为透明格式（PNG、WebP 等）
 * @param file 图片文件
 * @returns boolean
 */
function isTransparentFormat(file: File): boolean {
  return file.type === 'image/png' || file.type === 'image/webp';
}

/**
 * 主压缩函数
 * @param file 原始图片文件
 * @param options 压缩配置选项
 * @returns Promise<CompressResult> 压缩结果
 */
export default async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<CompressResult> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    minCompressSize = 50 * 1024, // 50KB
    outputFormat = 'base64',
    onProgress,
    correctOrientation = true,
  } = options;

  // 更新进度：开始读取文件
  onProgress?.(10);

  // 1. 读取文件
  const fileData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onProgress?.(30);
      const target = e.target as FileReader;
      if (!target || !target.result) {
        reject(
          new CompressError(
            CompressErrorType.FILE_READ_ERROR,
            '文件读取失败，无法获取文件数据'
          )
        );
        return;
      }
      resolve(target.result as string);
    };
    reader.onerror = () => {
      reject(
        new CompressError(
          CompressErrorType.FILE_READ_ERROR,
          '文件读取失败，请检查文件是否损坏',
          reader.error || undefined
        )
      );
    };
    reader.readAsDataURL(file);
  });

  // 2. 加载图片
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      onProgress?.(50);
      resolve(image);
    };
    image.onerror = () => {
      reject(
        new CompressError(
          CompressErrorType.IMAGE_LOAD_ERROR,
          '图片加载失败，请确认文件格式是否正确',
          new Error('Image load failed')
        )
      );
    };
    image.src = fileData;
  });

  // 3. 获取图片方向（如果需要校正）
  let orientation = 1;
  if (correctOrientation) {
    try {
      orientation = await getImageOrientation(file);
      onProgress?.(60);
    } catch (error) {
      // 方向获取失败不影响压缩，使用默认值
      console.warn('获取图片方向失败，使用默认方向:', error);
    }
  }

  // 4. 计算压缩尺寸
  let width = img.width;
  let height = img.height;

  // 根据方向调整宽高（如果方向需要交换）
  if (orientation >= 5 && orientation <= 8) {
    [width, height] = [height, width];
  }

  // 按比例缩放
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  onProgress?.(70);

  // 5. 创建 Canvas 并绘制
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  let ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new CompressError(
      CompressErrorType.CANVAS_ERROR,
      '无法创建 Canvas 上下文，浏览器可能不支持',
      new Error('Canvas context is null')
    );
  }

  // 处理透明背景：如果是透明格式，保持透明；否则填充白色背景
  const isTransparent = isTransparentFormat(file);
  
  // 校正图片方向（如果需要）
  let finalWidth = width;
  let finalHeight = height;
  if (correctOrientation && orientation !== 1) {
    // 根据方向确定最终尺寸（某些方向需要交换宽高）
    if (orientation >= 5 && orientation <= 8) {
      finalWidth = height;
      finalHeight = width;
    }
  }

  // 如果尺寸发生变化，需要重新创建 canvas 和上下文
  if (finalWidth !== width || finalHeight !== height) {
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    // 重新获取上下文（canvas 尺寸改变后上下文可能失效）
    const newCtx = canvas.getContext('2d');
    if (!newCtx) {
      throw new CompressError(
        CompressErrorType.CANVAS_ERROR,
        '无法创建 Canvas 上下文，浏览器可能不支持',
        new Error('Canvas context is null after resize')
      );
    }
    // 更新 ctx 引用
    ctx = newCtx;
    // 同步更新 width/height 变量
    width = finalWidth;
    height = finalHeight;
  }

  // 填充背景（如果需要）
  if (!isTransparent) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  // 校正图片方向并绘制
  ctx.save();
  if (correctOrientation && orientation !== 1) {
    // 传入 canvas 的宽高（已根据方向调整），transform 会基于此进行变换
    correctImageOrientation(ctx, width, height, orientation);
    // 绘制时使用原始图片尺寸，transform 会处理方向
    ctx.drawImage(img, 0, 0, img.width, img.height);
  } else {
    // 无需校正方向，直接绘制到 canvas 尺寸
    ctx.drawImage(img, 0, 0, width, height);
  }
  ctx.restore();

  onProgress?.(85);

  // 6. 转换为目标格式
  const originalSize = file.size;
  let compressedData: string | Blob | File;
  let compressedSize: number;

  try {
    // 根据输出格式和图片类型选择输出格式
    const outputMimeType = isTransparent ? 'image/png' : 'image/jpeg';
    const outputQuality = isTransparent ? undefined : quality;

    if (outputFormat === 'base64') {
      compressedData = canvas.toDataURL(outputMimeType, outputQuality);
      // Base64 体积精确计算：去除前缀后使用 atob 计算真实字节数
      const base64Str = (compressedData as string).split(',')[1]; // 去除 data:image/xxx;base64, 前缀
      if (base64Str) {
        try {
          const binaryString = atob(base64Str);
          compressedSize = binaryString.length;
        } catch (error) {
          // 如果 atob 失败，使用估算值
          compressedSize = Math.round((compressedData as string).length * 0.75);
        }
      } else {
        compressedSize = Math.round((compressedData as string).length * 0.75);
      }
    } else if (outputFormat === 'blob') {
      compressedData = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(
                new CompressError(
                  CompressErrorType.COMPRESS_ERROR,
                  '图片压缩失败，无法生成 Blob 对象'
                )
              );
              return;
            }
            resolve(blob);
          },
          outputMimeType,
          outputQuality
        );
      });
      compressedSize = (compressedData as Blob).size;
    } else {
      // File 格式
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(
                new CompressError(
                  CompressErrorType.COMPRESS_ERROR,
                  '图片压缩失败，无法生成 Blob 对象'
                )
              );
              return;
            }
            resolve(blob);
          },
          outputMimeType,
          outputQuality
        );
      });
      compressedSize = blob.size;
      compressedData = new File([blob], file.name, {
        type: outputMimeType,
        lastModified: Date.now(),
      });
    }

    onProgress?.(100);
  } catch (error) {
    throw new CompressError(
      CompressErrorType.COMPRESS_ERROR,
      '图片压缩失败：' + (error instanceof Error ? error.message : '未知错误'),
      error instanceof Error ? error : undefined
    );
  }

  // 7. 检查最小压缩阈值
  // 如果压缩率>0.9（压缩效果不明显）或原文件<最小阈值，返回原始文件
  const compressionRatio = compressedSize / originalSize;
  if (compressionRatio > 0.9 || originalSize < minCompressSize) {
    // 压缩无效或文件太小，返回原始文件
    if (outputFormat === 'base64') {
      compressedData = fileData;
      compressedSize = originalSize;
    } else if (outputFormat === 'blob') {
      // Blob 格式需要将 File 转换为 Blob
      compressedData = new Blob([file], { type: file.type });
      compressedSize = originalSize;
    } else {
      compressedData = file;
      compressedSize = originalSize;
    }
  }

  // 计算最终压缩率
  const finalCompressionRatio = compressedSize / originalSize;

  return {
    data: compressedData,
    originalSize,
    compressedSize,
    compressionRatio: finalCompressionRatio,
  };
}

/**
 * 便捷方法：压缩为 Base64（向后兼容）
 */
export async function compressImageToBase64(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.8
): Promise<string> {
  const result = await compressImage(file, {
    maxWidth,
    maxHeight,
    quality,
    outputFormat: 'base64',
  });
  return result.data as string;
}
