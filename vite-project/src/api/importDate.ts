import { post, get, del, put } from "../utils/http";
const Api = {
  creatImportDate: "/api/importDate", 
  getImportantDate: "/api/importDate",
  deleteImportantDate: "/api/importDate/",
  updateImportantDate: "/api/importDate/",
};
function creatImportDateApi(data: any) {
  return post(Api.creatImportDate, data);
}
function getImportantDateApi() {
  return get(Api.getImportantDate);
}
function deleteImportantDateApi(id: string) {
  const url = `${Api.deleteImportantDate}${id}`;
  return del(url);
}
function updateImportantDateApi(id: string, data: any) {
  const url = `${Api.deleteImportantDate}${id}`;
  return put(url, data);
}
export {
  creatImportDateApi,
  getImportantDateApi,
  deleteImportantDateApi,
  updateImportantDateApi,
};
