<template>
    <div class="header">
      <h3 class="headerTitle">拾光音悦台</h3>
      <el-button type="primary" class="headerButton" @click="goToCommonMusic">点击查看共同歌单</el-button>
    </div>
    <div class="searchMusic">
      <el-input
        size="large"
        placeholder="搜素你想找的音乐"
        suffix-icon="Search"
        class="searchMusicInput"
        v-model="searchMusic"
      />
      <el-button type="primary" size="large" class="searchMusicButton" @click="searchMusicData">搜索</el-button>
    </div>
    <el-row :gutter="10" class="listcategory">
      <!-- 给每个分类项加外层容器，用于相对定位 -->
      <el-col :span="3" v-for="item in categorylist" :key="item.id" class="categoryItemWrapper">
        <span class="listItem">{{ item.tag_name }}</span>
        <div class="listItemSonContainer">
          <ul class="listItemSon">
            <li v-for="son in item.son" :key="son.tag_id" @click="getCategoryListData(son.tag_id)">{{ son.tag_name }}</li>
          </ul>
        </div>
      </el-col>
    </el-row>
    <el-card class="musicPlayer mt">
      <el-row :gutter="20">
        <el-col :span="6" class="musicPlayerInfo">
          <img :src="musicPlayer.image" alt="" />
          <span>{{ musicPlayer.songname||'--' }}</span>
        </el-col>
        <el-col :span="10">
            <audio ref="audioPlayer" controls class="musicPlayerAudio">
  <source :src="musicPlayer.url" type="audio/mp3">
</audio>

        </el-col>
        <el-col :span="8" class="mt musicPlayerButtonContainer">
          <el-button type="primary" class="musicPlayerButton"><el-icon><ArrowLeftBold /></el-icon></el-button>
          <el-button type="primary" class="musicPlayerButton">
            <el-icon v-if="isPlaying">
              <VideoPause />
            </el-icon>
            <el-icon v-else>
              <VideoPlay />
            </el-icon>
          </el-button>
          <el-button type="primary" class="musicPlayerButton"><el-icon><ArrowRightBold /></el-icon></el-button>
        </el-col>
      </el-row>
    </el-card>
    <el-card v-if="!isShowSpecialMusicList" class="everydayList mt" v-for="item in musiclist" :key="item.songid">
        <el-row :gutter="20" >
            <el-col :span="6" >
                <img :src="item.sizable_cover" alt="每日推荐"  />
            </el-col>
            <el-col :span="8">
                <span class="songname"> {{ item.songname }} </span>
                <span class="author_name">
                    {{ item.author_name }}
                </span>
            </el-col>
            <el-col :span="4">
                <span class="publish_date">{{ item.publish_date }}</span>
                
            </el-col>
            <el-col :span="6">
                <el-button type="primary" class="playButton" @click="playMusic(item.hash)"><el-icon><VideoPlay /></el-icon></el-button>
                <span class="time_length">{{ formatSecondsToMMSS(item.time_length) }}</span>
                <button class="collectButton" @click="saveMusic(item)">添加</button>
            </el-col>
        </el-row>
    </el-card>
    <div  v-if="isShowSpecialMusicList" class="specialMusicList">
      <ul>
        <li v-for="item in specialMusicList" :key="item.id" @click="getSpecialMusicListData(item.global_collection_id)">
          <h3>{{ item.nickname }}</h3>
          <img :src="item.image" alt="">
          <span class="play_count">播放数：<span>{{ item.play_count }}</span></span>
          <p>{{ item.intro }}</p>
        </li>
      </ul>
    </div>
  </template>
  
  <script setup>
  import { getMusicListCategoryApi ,getEverydayListApi,searchMusicApi,getMusicUrlApi,getCategoryListApi,getSpecialMusicListApi,saveMusicApi} from '@/api/music'
  import { onMounted, ref, nextTick } from 'vue'
  import image from '../music/imags/image.png'
  import { ElMessage } from 'element-plus'
  import { useRouter } from 'vue-router'
  const router = useRouter()
  const categorylist = ref([])
  const musiclist = ref([])
  const isPlaying = ref(true)
  const searchMusic = ref('')
  const specialMusicList = ref([])
  const isShowSpecialMusicList = ref(false)
  const musicPlayer=ref({
    image:image,
    songname:'',
    author_name:'',
    time_length:'',
    url:'',
    id:''
  })
  const audioPlayer = ref(null)

  function formatSecondsToMMSS(totalSeconds) {

if (typeof totalSeconds !== 'number' || isNaN(totalSeconds) || totalSeconds < 0) {
  return '0:00'; 
}
const minutes = Math.floor(totalSeconds / 60);
const seconds = Math.floor(totalSeconds % 60);
const formattedSeconds = seconds.toString().padStart(2, '0');
return `${minutes}:${formattedSeconds}`;
}
  const getMusicListCategoryData = async () => {
    const res = await getMusicListCategoryApi()
    if (res.data) {
      categorylist.value = res.data
    }
  }
  const getEverydayListData = async () => {
    const res = await getEverydayListApi()
    if (res.data) {
      musiclist.value = res.data.song_list
    }
    isShowSpecialMusicList.value = false
  }
  const searchMusicData = async () => {
    const res = await searchMusicApi({keywords: searchMusic.value})
    if (res.data) {
        const newData = res.data.lists.map(item=>{
            return {
                songid:item.Scid,
                sizable_cover:item.Image,
                songname:item.OriSongName,
                author_name:item.SingerName,
                publish_date:item.PublishDate,
                time_length:item.Duration,
                hash:item.FileHash,
            }
        })
        musiclist.value = newData
        isShowSpecialMusicList.value = false
    }
  }
  const playMusic = async (hash) => {
    const res = await getMusicUrlApi({hash: hash})
    if (res.data && res.data.length > 0) {
        const item = res.data[0]
        musicPlayer.value = {
            image: item.info.image,                
            songname: item.name,
            url: item.info.tracker_url[0],                
            id: item.id,
        }
        // 等待 DOM 更新后自动播放
        await nextTick()
        if (audioPlayer.value) {
          const audio = audioPlayer.value
          audio.pause()
          
          // 直接设置音频源并播放
          audio.src = musicPlayer.value.url
          audio.load()
          
          // 等待音频可以播放后立即播放
          const playAudio = () => {
            audio.play().catch(err => {
              if (err.name !== 'AbortError') {
                console.error('自动播放失败:', err)
              }
            })
          }
          
          // 如果已经可以播放，立即播放
          if (audio.readyState >= 3) {
            playAudio()
          } else {
            // 等待可以播放
            audio.addEventListener('canplay', playAudio, { once: true })
            audio.addEventListener('error', () => {
              console.error('音频加载失败')
            }, { once: true })
          }
        }
    }
  }
  const getCategoryListData = async (tag_id) => {
    const res = await getCategoryListApi({tag_id: tag_id})
    if (res.data) {
      const newData = res.data.special_list.map(item=>{
        return{
          image:item.imgurl,
          intro:item.intro,
          show:item.show,
          nickname:item.nickname,
          id:item.specialid,
          collectcount:item.collectcount,
          play_count:item.play_count,
          global_collection_id:item.global_collection_id,
        }
      })
      specialMusicList.value = newData
      isShowSpecialMusicList.value = true
    }
  }
  const getSpecialMusicListData = async (global_collection_id) => {
    const res = await getSpecialMusicListApi({id: global_collection_id})
    if(res.data) {
      console.log(res.data.songs)
      const newData = res.data.songs.map(item=>{
        return{
          songid:item.mixsongid,
          sizable_cover:item.cover,
          songname:item.name,
          author_name:item.albuminfo?.name || '未知',
          publish_date:item.publish_date,
          time_length:item.timelen,
          hash:item.hash,
        }
      })
      musiclist.value = newData
      isShowSpecialMusicList.value = false
    }
  }
  const saveMusic = async (item) => {
    console.log(item)
    const res = await saveMusicApi({songid: item.songid, sizable_cover: item.sizable_cover, songname: item.songname, author_name: item.author_name, publish_date: item.publish_date, time_length: item.time_length, hash: item.hash})
    if (res.data) {
      ElMessage({
        message: res.message,
        type: "success",
      })
    }
  }
  const goToCommonMusic = () => {
    router.push('/commonMusic')
  }
  onMounted(() => {
    getMusicListCategoryData()
    getEverydayListData()
  })
  </script>
  
  <style lang="less" scoped>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  
    .headerTitle {
      font-size: 20px;
      font-weight: 600;
      color: #333;
    }
  
    .headerButton {
      width: 150px;
      padding: 0 10px;
      background-color: rgb(128, 166, 227);
      border: none;
      border-radius: 10px;
      color: white;
      font-size: 16px;
      font-weight: 600;
      height: 40px;
    }
  }
  
  .searchMusic {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  
    .searchMusicInput {
      width: 500px;
    }
  
    .searchMusicButton {
      width: 100px;
      margin-left: 10px;
      background-color: rgb(241, 131, 168);
      border: none;
      border-radius: 10px;
      color: white;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
    }
  
    .searchMusicButton:hover {
      background-color: rgb(253, 107, 156);
    }
  }

  .musicPlayer {
    background: linear-gradient(to right, #ff6b9b, #6495ed);
    border-radius: 10px;
    padding: 10px;
    color: white;
    .musicPlayerInfo {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    img {
      width: 100px;
      height: 100px;
      object-fit: cover;
      flex-shrink: 0;
    }
    
    span {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      flex: 1;
    }
    
    .musicPlayerAudio {
      width: 100%;
      margin-top: 20px;
    }
  }

  
  .listcategory {
    display: flex;
    justify-content: center;
    position: relative;
    z-index: 10;
  
    .categoryItemWrapper {
      position: relative;
      width: 150px;
      margin-left: 20px;
    }
  
    .listItem {
      display: block;
      width: 150px;
      height: 50px;
      background-color: rgb(241, 131, 168);
      border-radius: 10px;
      text-align: center;
      font-size: 16px;
      font-weight: 600;
      color: white;
      line-height: 50px;
      cursor: pointer;
    }
    
    .listItemSonContainer {
      position: absolute;
      border-radius: 0 0 10px 10px;
      top: 100%;
      left: 5px;
      z-index: 11;
      display: none;
      background-color: rgb(241, 131, 168);
     
      width: 150px;
  
      ul {
  
        li {
          list-style: none;
          font-size: 14px;
          font-weight: 400;
          color: white;
          margin-bottom: 10px;
          text-align: center;
          padding: 5px 0;
        }
  
        li:hover {
          cursor: pointer;
          color: #333;
        }
      }
    }
    .categoryItemWrapper:hover .listItem {
      border-radius: 10px 10px 0 0;
    }

    .categoryItemWrapper:hover .listItemSonContainer {
      display: block;
    }
    .listItemSonContainer:hover {
      display: block;
    }
  }
  
  .musicPlayer {
    /* 播放器层级低于分类菜单，避免遮挡子菜单 */
    position: relative;
    z-index: 1;
  
    .musicPlayerButtonContainer {
      margin-top: 20px;
    }
  
    .musicPlayerButton {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-left: 20px;
      background-color: rgb(241, 131, 168);
      font-size: 18px;
      border: none;
    }
  
    .musicPlayerButton:hover {
      background-color: rgb(253, 107, 156);
    }
  }
  .everydayList {

    .el-col {
      display: flex;
      align-items: center;
    }
    img {
      width: 80px;
      height: 80px;
      object-fit: cover;
    }
    .songname {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin-right: 10px;
    }
    .author_name {
      font-size: 14px;
      color: #999;
      margin-left: 10px;
    }
  }
  .publish_date {
    font-size: 14px;
    color: #999;
  }
  .time_length {
    font-size: 14px;
    color: #999;
    margin-left: 50px
  }
  .playButton {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-left: 20px;
    background-color: rgb(241, 131, 168);
    font-size: 18px;
    border: none;
  }
  .collectButton {
    width: 50px;
    height: 40px;
    text-align: center;
    font-size: 16px;
    margin-left: 20px;
    font-weight: 600;
    border: none;
    color: rgb(241, 131, 168);
  }
  .specialMusicList {
    margin-bottom: 20px;
    margin-top: 20px;
    
    ul {
      li {
        float: left;
        margin-right: 20px;
        width: 400px;
        height: 400px;
        background-color: #fff;
        text-align: center;
        border-radius: 10px;
        box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
        padding: 10px;
        flex-shrink: 0;
        margin-bottom: 20px;
      }
      img {
        width: 100%;
        height: 250px;
        object-fit: cover;
      }
      h3 {
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }
      p {
        font-size: 14px;
        color: #999;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        word-break: break-word;
        line-height: 1.5;
        margin-top: 20px;
      }
      span {
        font-size: 14px;
        color: #999;
        margin-left: 10px;
      }
      .play_count {
        color: rgb(28, 36, 75);
        font-weight: 600;
      }
    }
    
  }
  </style>