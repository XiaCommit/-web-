import { get } from "../utils/http";
const Api = {
  getMessage: "/api/getMessage",
};
function getMessageApi(data: {page: number, size: number}) {
  return get(Api.getMessage, data);
}
function getLatestMessagesApi(limit: number) {
  return get(Api.getMessage, {page: 1, size: limit});
}
export { getMessageApi, getLatestMessagesApi };