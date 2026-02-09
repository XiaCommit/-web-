<template>
  <div class="bill-filter-container">
    <h3 class="filter-title">账单筛选</h3>

    <!-- 分类筛选 -->
    <div class="filter-item">
      <span class="filter-label">分类：</span>
      <el-button-group class="filter-buttons">
        <el-button type="primary" class="filter-btn active">购物</el-button>
        <el-button type="default" class="filter-btn">饮食</el-button>
        <el-button type="default" class="filter-btn">娱乐</el-button>
        <el-button type="default" class="filter-btn">交通</el-button>
        <el-button type="default" class="filter-btn">其他</el-button>
      </el-button-group>
    </div>

    <!-- 支付方筛选 -->
    <div class="filter-item">
      <span class="filter-label">支付方：</span>
      <el-button-group class="filter-buttons">
        <el-button type="default" class="filter-btn active">共同支出</el-button>
        <el-button type="primary" class="filter-btn">我的支出</el-button>
        <el-button type="default" class="filter-btn">TA的支出</el-button>
      </el-button-group>
    </div>

    <!-- 时间筛选 -->
    <div class="filter-item">
      <span class="filter-label">时间：</span>
      <el-button-group class="filter-buttons">
        <el-button type="primary" class="filter-btn active">本月</el-button>
        <el-button type="default" class="filter-btn">近3月</el-button>
        <el-button type="default" class="filter-btn">自定义</el-button>
      </el-button-group>
    </div>
  </div>

  <div class="bill-page mt">
    <!-- 页面容器 -->
    <div class="bill-container">
      <!-- 头部区域 -->
      <div class="bill-header">
        <h2 class="bill-title">全部账单（共8条）</h2>
        <el-button type="primary" class="export-btn">导出账单</el-button>
      </div>

      <!-- 账单列表 -->
      <div class="bill-list">
        <!-- 账单项循环（这里直接写死8条数据） -->
        <div class="bill-item" v-for="(item, index) in billList" :key="index">
          <div class="bill-info">
            <div class="bill-name">{{ item.name }}</div>
            <div class="bill-time">{{ item.date }}</div>
            <div class="bill-remark">
              {{ item.remark ? "备注：" + item.remark : "" }}
            </div>
          </div>
          <div class="bill-amount">
            <span class="amount">¥ {{ item.account }}</span>
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

// 账单数据
const billList = ref([
  {
    name: "晚餐约会",
    date: "2023年9月15日",
    account: 380.0,
    payerType: "你支付",
    accountType: 1,
    remark: "约会",
  },
  {
    name: "晚餐约会",
    date: "2023年9月15日",
    account: 380.0,
    payerType: "你支付",
    accountType: 1,
  },
  {
    name: "晚餐约会",
    date: "2023年9月15日",
    account: 380.0,
    payerType: "你支付",
    accountType: 1,
  },
  {
    name: "晚餐约会",
    date: "2023年9月15日",
    account: 380.0,
    payerType: "你支付",
    accountType: 1,
  },
  {
    name: "晚餐约会",
    date: "2023年9月15日",
    account: 380.0,
    payerType: "你支付",
    accountType: 1,
  },
  {
    name: "晚餐约会",
    date: "2023年9月15日",
    account: 380.0,
    payerType: "你支付",
    accountType: 1,
  },
  {
    name: "晚餐约会",
    date: "2023年9月15日",
    account: 380.0,
    payerType: "你支付",
    accountType: 1,
  },
  {
    name: "晚餐约会",
    date: "2023年9月15日",
    account: 380.0,
    payerType: "你支付",
    accountType: 1,
  },
]);
</script>

<style lang="less" scoped>
.bill-filter-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

  .filter-title {
    font-size: 18px;
    color: #333;
    margin-bottom: 20px;
    font-weight: 500;
  }

  .filter-item {
    margin-bottom: 18px;
    display: flex;
    align-items: center;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .filter-label {
    font-size: 16px;
    color: #666;
    width: 65px;
    text-align: right;
    display: inline-block;
    margin-right: 10px;
  }

  .filter-buttons {
    .filter-btn {
      border-radius: 20px;
      margin-right: 12px;
      padding: 6px 16px;
      font-size: 14px;

      &.active {
        background-color: #d3b1f0; /* 对应示例中的紫色 */
        border-color: #d3b1f0;
        color: #fff;
      }

      &:not(.active) {
        background-color: #f5f5f5;
        border-color: #f5f5f5;
        color: #666;

        &:hover {
          background-color: #eee;
          border-color: #eee;
        }
      }
    }
  }
}
.bill-page {
  padding: 20px;
  background-color: #fff;
  box-sizing: border-box;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

.bill-container {
  margin: 0 auto;
}

.bill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;

  .bill-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }

  .export-btn {
    font-size: 14px;
    padding: 6px 12px;
  }
}

.bill-list {
  .bill-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 0;
    border-bottom: 1px solid #f5f5f5;

    .bill-info {
      .bill-name {
        font-size: 16px;
        color: #333;
        margin-bottom: 5px;
      }

      .bill-time {
        font-size: 14px;
        color: #999;
      }
      .bill-remark {
        margin-top: 10px;
        font-size: 12px;
        color: #999;
      }
    }

    .bill-amount {
      display: flex;
      align-items: center;
      gap: 10px;

      .amount {
        font-size: 16px;
        color: #333;
        font-weight: 500;
      }

      .pay-type {
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 12px;

        &.me {
          background-color: #ffe6ea;
          color: #ff4d6d;
        }

        &.ta {
          background-color: #e6f7ff;
          color: #1890ff;
        }

        &.common {
          background-color: #e6fffb;
          color: #00b42a;
        }
      }
    }
  }
}
</style>
