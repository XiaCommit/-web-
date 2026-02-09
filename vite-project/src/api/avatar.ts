import { post, get } from "../utils/http";
const Api = {
  getAvatar: "/api/avatar",
  uploadAvatar: "/api/uploadAvatar",
};
function getAvatarApi() {
  return get(Api.getAvatar);
}
function uploadAvatarApi(data: any) {
  return post(Api.uploadAvatar, data);
}
export { getAvatarApi, uploadAvatarApi };