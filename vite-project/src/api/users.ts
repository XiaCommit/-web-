import { post } from "../utils/http";

const Api = {
    register: "/api/register",
  login: "/api/login",
  updatepassword: "/api/updatepassword",
  updateUserInfo: "/api/updateUserInfo",
};
interface RegisterParam {
  username: string;
  password: string;
  gender: string;
  birthday: Date | null;
}
interface LoginParam {
  username: string;
  password: string;
  code: string;
}
interface UpdatepasswordParam {
  oldPassword: string;
  newPassword: string;
}
function registerApi(data: RegisterParam): Promise<any> {
  return post(Api.register, data);
}
function loginApi(data: LoginParam): Promise<any> {
  return post(Api.login, data);
}
function updatepasswordApi(data: UpdatepasswordParam): Promise<any> {
  return post(Api.updatepassword, data);
}
function updateUserInfoApi(data: any): Promise<any> {
  return post(Api.updateUserInfo, data);
}
export { registerApi, loginApi, updatepasswordApi, updateUserInfoApi };
