<template>
    <div class="header">
        <h3 class="headerTitle">共同歌单</h3>
        <el-button type="primary" class="headerButton" @click="gotomusic">点击返回拾光音悦台</el-button>
    </div>
        
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

<el-card  class="everydayList mt" v-for="item in musiclist" :key="item.songid">
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
                <button class="collectButton" @click="deleteMusic(item._id)">删除</button>
            </el-col>
        </el-row>
    </el-card>
</template>
<script setup> 
import { getMusicApi, deleteMusicApi } from '@/api/music'
import { ref, onMounted, nextTick } from 'vue'
import image from '../music/imags/image.png'
import { getMusicUrlApi } from '@/api/music'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
const router = useRouter()
const musiclist = ref([])
const musicPlayer=ref({
    image:image,
    songname:'',
    author_name:'',
    time_length:'',
    url:'',
    id:''
  })
const isPlaying = ref(false)
const audioPlayer = ref(null)
const getMusicList = async () => {
    const res = await getMusicApi()
    if (res.data) {
        musiclist.value = res.data
    }
}
onMounted(() => {
    getMusicList()
})
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
        console.log(musicPlayer.value)
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
      function formatSecondsToMMSS(totalSeconds) {

if (typeof totalSeconds !== 'number' || isNaN(totalSeconds) || totalSeconds < 0) {
  return '0:00'; 
}
const minutes = Math.floor(totalSeconds / 60);
const seconds = Math.floor(totalSeconds % 60);
const formattedSeconds = seconds.toString().padStart(2, '0');
return `${minutes}:${formattedSeconds}`;
}
const gotomusic = () => {
    router.push('/music')
}
const deleteMusic = async (id) => {
    const res = await deleteMusicApi(id)
    if (res.code === "0000") {
        ElMessage({
        message: res.message,
        type: "success",
    })
    getMusicList()
}
}
</script>
<style scoped lang="less">
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
</style>