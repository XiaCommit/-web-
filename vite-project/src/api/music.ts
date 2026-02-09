import { del, get, post} from '@/utils/http'
const Api = {
  getMusicListCategory: '/playlist/tags',
  getEverydayList: '/everyday/recommend',
  searchMusic: '/search',
  getMusicUrl:'/song/url/new',
  getCategoryList: '/top/playlist',
  getSpecialMusicList: '/playlist/track/all',
  saveMusic: '/api/saveMusic',
  getMusic: '/api/getMusic',
  deleteMusic: '/api/deleteMusic/',
}
function getMusicListCategoryApi() {
  return get(Api.getMusicListCategory)
}
function getEverydayListApi() {
  return get(Api.getEverydayList)
}
function searchMusicApi(data: any) {
  return get(Api.searchMusic, data)
}
function getMusicUrlApi(data: any) {
  return get(Api.getMusicUrl, data)
}
function getCategoryListApi(data: any) {
  return get(Api.getCategoryList, data)
}
function getSpecialMusicListApi(data: any) {
  return get(Api.getSpecialMusicList, data)
}
function saveMusicApi(data: any) {
  return post(Api.saveMusic, data)
}
function getMusicApi() {
  return get(Api.getMusic)
}
function deleteMusicApi(id: string) {
  const url = `${Api.deleteMusic}${id}`;
  return del(url)
}
export {
  getMusicListCategoryApi,
  getEverydayListApi,
  searchMusicApi,
  getMusicUrlApi,
  getCategoryListApi,
  getSpecialMusicListApi,
  saveMusicApi,
  getMusicApi,
  deleteMusicApi
}