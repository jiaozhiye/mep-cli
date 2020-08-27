<template>
  <div class="setting">
    <el-popover v-model="visible" placement="bottom-end" width="260" transition="el-zoom-in-top">
      <div :class="userCenterCls">
        <div class="user-avatar">
          <span class="avatar">
            <img class="img" src="@/assets/img/avatar.jpg" />
          </span>
          <span class="name">{{ username }}</span>
        </div>
        <div class="user-box">
          <div class="title">
            <span class="text">个人信息</span>
            <router-link to="/user-center" class="more" @click.native="closePopperHandle">详细</router-link>
          </div>
          <div class="content">
            <div>
              <span class="text_overflow_cut" title="客户服务部"><i class="iconfont icon-user" /> 客户服务部</span>
              <span class="text_overflow_cut" title="客户服务部"><i class="iconfont icon-apartment" /> 客户服务部</span>
            </div>
            <span class="text_overflow_cut" title="xxxxxxxxx@163.com"><i class="iconfont icon-mail" /> xxxxxxxxx@163.com</span>
          </div>
        </div>
        <div class="user-box">
          <div class="title">
            <span class="text">系统角色</span>
          </div>
          <div class="content">
            <li class="text_overflow_cut" title="客客服总监客服总监客服总监服总监">客客服总监客服总监客服总监服总监</li>
            <li class="text_overflow_cut" title="销售顾问">销售顾问</li>
            <li class="text_overflow_cut" title="整车订单计划员">整车订单计划员</li>
          </div>
        </div>
        <div class="user-action">
          <span class="button" @click="clearCacheHandle">清理缓存</span>
          <span class="button" @click="logoutHandle">退出登录</span>
        </div>
      </div>
      <span slot="reference" class="avatar">
        <img class="img" src="@/assets/img/avatar.jpg" />
      </span>
    </el-popover>
  </div>
</template>

<script>
/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-08-24 11:16:37
 **/
import { mapActions } from 'vuex';
import { getUser } from '@/utils/cookies';

import { size } from '@/mixins/sizeMixin';

export default {
  name: 'UserCenter',
  mixins: [size],
  data() {
    return {
      username: getUser() || '管理员',
      visible: false
    };
  },
  computed: {
    userCenterCls() {
      return {
        [`user-center`]: !0,
        [`user-center-sm`]: this.currentSize === 'small',
        [`user-center-lg`]: this.currentSize === 'large'
      };
    }
  },
  methods: {
    ...mapActions('app', ['clearKeepAliveCache', 'createLogout']),
    closePopperHandle() {
      this.visible = !1;
    },
    clearCacheHandle() {
      this.clearKeepAliveCache();
      setTimeout(() => window.history.go(0), 0);
    },
    logoutHandle() {
      // 需要走后台推出接口
      this.createLogout();
    }
  }
};
</script>

<style lang="scss" scoped>
.setting {
  display: flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  margin-left: $moduleMargin;
  .avatar {
    display: block;
    overflow: hidden;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    .img {
      object-fit: cover;
      height: 100%;
    }
  }
}
.user-center {
  color: $textColor;
  .user-avatar {
    display: flex;
    flex-direction: column;
    align-items: center;
    .avatar {
      display: block;
      overflow: hidden;
      width: 70px;
      height: 70px;
      border-radius: 50%;
      img {
        object-fit: cover;
        height: 100%;
      }
    }
    .name {
      margin-top: 6px;
    }
  }
  .user-box {
    .title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 40px;
      border-bottom: 1px solid $borderColor;
      box-sizing: border-box;
      .text {
        color: #1a1a1a;
        font-weight: 600;
      }
      .more {
        color: $primaryColor;
      }
    }
    .content {
      display: flex;
      flex-wrap: wrap;
      padding-top: 6px;
      line-height: 1.75;
      & > div {
        width: 100%;
        display: flex;
        span {
          width: 50%;
        }
      }
      .iconfont {
        font-size: inherit;
      }
      li {
        width: 50%;
        list-style: none;
      }
    }
  }
  .user-action {
    height: 40px;
    margin: 10px -12px -12px;
    display: flex;
    border-top: 1px solid $borderColor;
    border-bottom-left-radius: $borderRadius;
    border-bottom-right-radius: $borderRadius;
    box-sizing: border-box;
    .button {
      width: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: all 0.3s ease;
      &:hover {
        background-color: $backgroundColorSecondary;
      }
      + .button {
        border-left: 1px solid $borderColor;
      }
    }
  }
  &-sm {
    .content {
      font-size: $textSizeSecondary;
    }
  }
}
</style>
