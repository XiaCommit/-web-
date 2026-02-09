import {get,post} from '../utils/http'
const Api={
    saveMeetDate:'/api/meetDate',
    getMeetDate:'/api/meetDate'
}
function saveMeetDateApi(data:any){
    return post(Api.saveMeetDate,data)

}
function getMeetDateApi(){
    return get(Api.getMeetDate)
}
export {saveMeetDateApi,getMeetDateApi}