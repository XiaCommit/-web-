import { post ,get,del,put} from "../utils/http";
const Api = {
  createAccount: "/api/account",
  getAccount: "/api/account",
  deleteAccount: "/api/account/",
  updateAccount: "/api/account/",
};
function createAccountApi(data: any) {
  return post(Api.createAccount, data);
}
function getAccountApi() {
  return get(Api.getAccount);
}
function deleteAccountApi(id: string) {
  const url = `${Api.deleteAccount}${id}`;
  return del(url);
}
function updateAccountApi(id: string, data: any) {
  const url = `${Api.updateAccount}${id}`;
  return put(url, data);
}
export { createAccountApi ,getAccountApi,deleteAccountApi,updateAccountApi};
