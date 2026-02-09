declare module "*.vue" {
  import { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module 'vue3-emoji-picker' {
  import { DefineComponent } from 'vue';
  
  // 定义 emoji 数据类型
  export interface EmojiData {
    i: string; // emoji 字符
    n?: string[]; // 名称数组
    r?: string; // 原生 emoji
    t?: string; // 文本表示
    emoji?: string; // 备用 emoji 字段
    [key: string]: any;
  }
  
  const EmojiPicker: DefineComponent<{
    native?: boolean;
    'hide-search'?: boolean;
    'display-recent'?: boolean;
    theme?: 'light' | 'dark' | 'auto';
  }, {}, any, {}, {}, any, any, {
    select: (emoji: EmojiData) => void;
  }>;
  export default EmojiPicker;
}

// 声明 CSS 模块导入
declare module '*.css' {
  const content: string;
  export default content;
}

declare module 'vue3-emoji-picker/css' {
  const content: string;
  export default content;
}
