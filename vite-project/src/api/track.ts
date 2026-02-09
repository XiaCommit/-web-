import { del, get, post } from "../utils/http";
const Api = {
  createTrack: "/api/track/createTrack",
  getTrack: "/api/track/getTrack",
  deleteTrack: "/api/track/deleteTrack",
};
interface CreateTrackParam {
  images: string[];
  description: string;
}
function createTrackApi(data: CreateTrackParam) {
  return post(Api.createTrack, data);
}
function getTrackApi() {
  return get(Api.getTrack);
}
function deleteTrackApi(id: string) {
  return del(`${Api.deleteTrack}/${id}`);
}
export { createTrackApi,getTrackApi,deleteTrackApi };