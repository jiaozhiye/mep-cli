<template>
  <div class="setting">
    <el-popover v-model="visible" placement="bottom-end" width="260" transition="el-zoom-in-top">
      <div :class="userCenterCls">
        <div class="user-avatar">
          <span class="avatar">
            <img class="img" :src="info.profileUrl || avatarImg" />
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
              <span class="text_overflow_cut" :title="info.vLogin"><i class="iconfont icon-user" /> {{ info.vLogin }}</span>
              <span class="text_overflow_cut" :title="info.vOrgName"><i class="iconfont icon-apartment" /> {{ info.vOrgName }}</span>
            </div>
            <span class="text_overflow_cut" :title="info.vEmail"><i class="iconfont icon-mail" /> {{ info.vEmail }}</span>
          </div>
        </div>
        <div class="user-box">
          <div class="title">
            <span class="text">系统角色</span>
          </div>
          <div class="content">
            <li v-for="text in info.vRoles" :key="text" class="text_overflow_cut" :title="text">{{ text }}</li>
          </div>
        </div>
        <div class="user-action">
          <span class="button" @click="clearCacheHandle">清理缓存</span>
          <span class="button" @click="logoutHandle">退出登录</span>
        </div>
      </div>
      <span slot="reference" class="avatar">
        <img class="img" :src="info.profileUrl || avatarImg" />
      </span>
    </el-popover>
  </div>
</template>

<script>
/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-09-03 09:42:06
 **/
import { mapActions } from 'vuex';
import { getUser } from '@/utils/cookies';
import { getUserInfo } from '@/api/login';

import { size } from '@/mixins/sizeMixin';

export default {
  name: 'UserCenter',
  mixins: [size],
  data() {
    this.avatarImg = require('@/assets/img/avatar.jpg');
    return {
      username: getUser() || '管理员',
      info: {
        profileUrl: '', // 头像
        vEmail: '', // Email
        vLogin: '', // P 码
        vOrgName: '', // 部门
        vPersonName: '', // 姓名
        vRoles: [] // 角色列表
      },
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
  created() {
    this.getUserData();
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
    async getUserData() {
      if (process.env.MOCK_DATA === 'true') {
        const res = require('@/mock/userInfo').default;
        this.info = res;
      } else {
        const res = await getUserInfo();
        if (res.code === 200) {
          for (let key in this.info) {
            this.info[key] = res.data[key];
          }
        }
      }
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
