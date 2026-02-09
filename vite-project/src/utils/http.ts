import service from "./axios";
interface ResponseData {
  code: string;
  data: any;
  message: string;
}

function get(url: string, params?: any): Promise<ResponseData> {
  return service.get(url, { params });
}

function post(url: string, data?: any): Promise<ResponseData> {
  return service.post(url, data);
}
function del(url: string): Promise<ResponseData> {
  return service.delete(url);
}
function put(url: string, data?: any): Promise<ResponseData> {
  return service.put(url, data);
}
export { get, post, del, put };
