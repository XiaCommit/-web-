<template>
  <div class="bill-container">
    <!-- 标题与新增按钮行布局 -->
    <el-row :gutter="20" class="bill-header-row">
      <el-col :span="20">
        <h2 class="bill-title">共同账单</h2>
      </el-col>
      <el-col :span="4" class="text-right">
        <el-button type="primary" round class="add-btn" @click="openAddDialog">
          新增账单
        </el-button>
      </el-col>
    </el-row>

    <!-- 统计卡片区域 - 栅格布局 -->
    <el-row :gutter="20" class="bill-stats-row">
      <!-- 本月总支出卡片 -->
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-label">本月总支出</div>
            <div class="stat-amount">¥2,850.00</div>
            <div class="stat-change">
              <el-icon class="trend-icon"><arrow-down /></el-icon>
              8.2% 较上月
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 你的支出卡片 -->
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-label">你的支出</div>
            <div class="stat-amount your-amount">¥1,520.00</div>
            <div class="progress-bar">
              <div class="progress-fill your-fill"></div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- TA的支出卡片 -->
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-label">TA的支出</div>
            <div class="stat-amount ta-amount">¥1,330.00</div>
            <div class="progress-bar">
              <div class="progress-fill ta-fill"></div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="mt">
      <h2 class="account-category">支出分类</h2>
      <div ref="chartRef" style="width: 100%; height: 400px"></div>
    </el-card>

    <!-- 最近账单列表 -->
    <div class="expense-recent-list mt-4">
      <div class="expense-recent-header">
        <h2 class="expense-recent-title">最近账单</h2>
        <el-link
          type="primary"
          class="expense-view-all"
          @click="router.push('/account/allaccount')"
          >查看全部</el-link
        >
      </div>

      <el-card
        class="expense-recent-item"
        v-for="(item, index) in recentBillList"
        :key="index"
      >
        <div class="expense-recent-content">
          <div class="expense-recent-left">
            <div class="expense-recent-info">
              <div class="expense-recent-name">{{ item.name }}</div>
              <div class="expense-recent-date">{{ item.date }}</div>
              <div class="expense-recent-remark">
                {{ item.remark ? "备注：" + item.remark : "" }}
              </div>
            </div>
          </div>
          <div class="expense-recent-right">
            <div class="expense-recent-amount">
              ¥{{ item.account.toFixed(2) }}
            </div>
            <el-tag
              size="small"
              :type="
                item.accountType === 2
                  ? 'primary'
                  : item.accountType === 3
                  ? 'success'
                  : item.accountType === 4
                  ? 'warning'
                  : 'info'
              "
            >
              <span v-if="item.accountType === 1">购物</span>
              <span v-else-if="item.accountType === 2">饮食</span>
              <span v-else-if="item.accountType === 3">娱乐</span>
              <span v-else-if="item.accountType === 4">交通</span>
              <span v-else-if="item.accountType === 5">其他</span>
            </el-tag>
            <el-tag
              :type="item.payerType === '你支付' ? 'danger' : 'primary'"
              size="small"
            >
              {{ item.payerType }}
            </el-tag>
            <el-button
              :round="true"
              class="ml"
              color="#ff6b9b"
              style="color: white"
              @click="edit(item)"
              >编辑</el-button
            >
            <el-popconfirm width="220" title="确定要删除吗" ref="popconfirmRef">
              <template #reference>
                <el-button
                  ><el-icon><Delete /></el-icon
                ></el-button>
              </template>
              <template #actions="{ cancel }">
                <el-button size="small" @click="cancel">取消</el-button>
                <el-button type="danger" size="small" @click="deleteday(item)"
                  >确定</el-button
                >
              </template>
            </el-popconfirm>
          </div>
        </div>
      </el-card>
    </div>
  </div>

  <AccountDialog
    :dialog-visible="visible"
    @close="visible = false"
    :isadd="isAdd"
    @reload="getaccountDate"
  />
</template>

<script setup>
import { ref, onMounted, reactive, onBeforeUnmount } from "vue";
import * as echarts from "echarts";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import AccountDialog from "./components/AccountDialog.vue";
import { useAccountDateStore } from "@/store/accountDate";
import { useUserStore } from "@/store/user";
import { getAccountApi,deleteAccountApi } from "@/api/account";
import { formatDate } from "@/utils/dayUtil";
const accountDateStore = useAccountDateStore();
const { setAccountDate } = accountDateStore;
const userStore = useUserStore();
const router = useRouter();
const chartRef = ref(null);
let mychart = null;

const initEchart = () => {
  if (chartRef.value) {
    mychart = echarts.init(chartRef.value);
    const options = setChartData();
    mychart.setOption(options);
  }
};
const resizeHandler = () => {
  if (mychart) {
    mychart.resize();
  }
};

function setChartData() {
  const charOption = reactive({
    tooltip: {
      trigger: "item",
    },
    legend: {
      bottom: "5%",
      left: "center",
    },
    series: [
      {
        name: "Access From",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: true,
          position: "top",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 25,
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          { value: 1048, name: "饮食" },
          { value: 735, name: "娱乐" },
          { value: 580, name: "购物" },
          { value: 484, name: "交通" },
          { value: 300, name: "其他" },
        ],
      },
    ],
  });
  return charOption;
}

onMounted(() => {
  initEchart();
  window.addEventListener("resize", resizeHandler);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeHandler);
  if (mychart) {
    mychart.dispose();
  }
});

const recentBillList = ref([]);

const visible = ref(false);
const isAdd = ref(false);

const openAddDialog = () => {
  setAccountDate({
    name: "",
    date: "",
    account: null,
    accountType: null,
    remark: "",
    id: "",
  });
  visible.value = true;
  isAdd.value = true;
};

const edit = (item) => {
  setAccountDate({
    name: item.name,
    date: item.date,
    account: item.account,
    accountType: item.accountType,
    remark: item.remark,
    id: item._id,
  });
  console.log(item);
  visible.value = true;
  isAdd.value = false;
};

const deleteday = async(item) => {
  const res = await deleteAccountApi(item._id);
  if (res.code == "0000") {
    ElMessage({
      message: res.message,
      type: "success",
    });
    getaccountDate()
  }
};

const getaccountDate = async () => {
  const res = await getAccountApi();
  if (res.code === "0000") {
    const currentUserId = userStore.id;
    let formattedDate = res.data.map((item) => {
      const payerType = item.createdBy?.toString() === currentUserId ? "你支付" : "TA支付";
      return {
        ...item,
        date: formatDate(item.date),
        account: Number(item.account), 
        accountType: item.accountType,
        remark: item.remark,
        id: item._id,
        payerType: payerType,
      };
    });
    recentBillList.value = formattedDate;
    console.log(recentBillList.value);
 
  }
};
onMounted(() => {
  getaccountDate();
});
</script>

<style lang="less" scoped>
.bill-container {
  .bill-header-row {
    margin-bottom: 24px;

    .bill-title {
      font-size: 25px;
      font-weight: 700;
      color: #333;
      margin: 0;
      line-height: 40px; // 与按钮行高对齐
    }

    .add-btn {
      padding: 20px;
      font-size: 18px;
      color: white;
      font-weight: 700;
      background-color: #ff6b9b;
      border-color: #ff6b9b;
      &:hover {
        background-color: #f5225e;
        border-color: #f5225e;
      }
    }
  }

  .bill-stats-row {
    width: 100%;
  }
  .stat-card {
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    height: 160px;

    .stat-content {
      padding: 0;

      .stat-label {
        font-size: 18px;
        color: #999;
        margin-bottom: 12px;
      }

      .stat-amount {
        font-size: 30px;
        font-weight: 700;
        margin-bottom: 12px;
      }

      .your-amount {
        color: #ff4d4f;
      }

      .ta-amount {
        color: #1890ff;
      }

      .stat-change {
        display: flex;
        align-items: center;
        font-size: 16px;
        color: #52c41a;

        .trend-icon {
          margin-right: 4px;
        }
      }

      .progress-bar {
        height: 8px;
        background-color: #e8e8e8;
        border-radius: 4px;
        overflow: hidden;

        .progress-fill {
          height: 100%;
          border-radius: 4px;
        }

        .your-fill {
          width: 53%;
          background-color: #ff4d4f;
        }

        .ta-fill {
          width: 47%;
          background-color: #1890ff;
        }
      }
    }
  }

  .expense-recent-list {
    margin-top: 24px;

    .expense-recent-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .expense-recent-title {
        font-size: 25px;
        font-weight: 600;
        color: #333;
        margin: 0;
      }

      .expense-view-all {
        color: #ff6b9b;
        font-size: 14px;
      }
    }

    .expense-recent-item {
      margin-bottom: 12px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      border: none;

      .expense-recent-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;

        .expense-recent-left {
          display: flex;
          align-items: center;
          gap: 12px;

          .expense-recent-info {
            .expense-recent-name {
              font-size: 20px;
              font-weight: 500;
              color: #333;
              margin-bottom: 4px;
            }

            .expense-recent-date {
              font-size: 16px;
              color: #9ca3af;
            }
            .expense-recent-remark {
              font-size: 14px;
              color: #9ca3af;
            }
          }
        }

        .expense-recent-right {
          display: flex;
          align-items: center;
          gap: 12px;

          .expense-recent-amount {
            font-size: 20px;
            font-weight: 500;
            color: #333;
          }
        }
      }
    }
  }
}
</style>
