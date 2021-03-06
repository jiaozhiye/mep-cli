<template>
  <div :class="noticeCls">
    <SuperTabs v-show="visible" v-model="currentKey" :tabNavOffsetLeft="15" tabClassName="notice-tab" size="large" animated>
      <div slot="extraContent">
        <el-button type="text" class="more-link" @click="closePopperHandle">查看更多</el-button>
      </div>
      <tab-panel key="1" :label="messageList.title">
        <div class="list">
          <ul v-if="messageList.list.length">
            <li v-for="item in messageList.list" :key="item.uid" @click="doRouteHandle(item.uid)">{{ item.title }}</li>
          </ul>
          <dl v-else class="no-info">
            <span>{{ $t('app.emptyText') }}</span>
          </dl>
        </div>
      </tab-panel>
      <tab-panel key="2" :label="todoList.title">
        <div class="list">
          <ul v-if="todoList.list.length">
            <li v-for="item in todoList.list" :key="item.uid" @click="doRouteHandle(item.uid)">{{ item.title }}</li>
          </ul>
          <dl v-else class="no-info">
            <span>{{ $t('app.emptyText') }}</span>
          </dl>
        </div>
      </tab-panel>
    </SuperTabs>
  </div>
</template>

<script>
import { w3cwebsocket } from 'websocket';
import { getUserInfo, getMessageList, getTodoList } from '@/api/login';

import { size } from '@/mixins/sizeMixin';
import dataList from '@/mock/noticeData';

export default {
  name: 'InsideLetter',
  mixins: [size],
  props: ['visible'],
  data() {
    this.socket = null;
    this.connecting = false;
    return {
      currentKey: '1',
      messageList: {
        title: this.$t('insideLetter.message'),
        list: []
      },
      todoList: {
        title: this.$t('insideLetter.waiting'),
        list: []
      }
    };
  },
  computed: {
    noticeCls() {
      return {
        [`notice-wrapper`]: !0,
        [`notice-wrapper-sm`]: this.currentSize === 'small',
        [`notice-wrapper-lg`]: this.currentSize === 'large'
      };
    }
  },
  mounted() {
    this.getMessageInfo();
    this.getTodoInfo();
    this.createWebsocket();
  },
  beforeDestroy() {
    this.closeWebsocket();
  },
  methods: {
    async getMessageInfo() {
      if (process.env.MOCK_DATA === 'true') {
        this.messageList.list = dataList.data;
        this.messageList.title = `${this.$t('insideLetter.notice')}(${dataList.data.length})`;
        this.$emit('change', dataList.data.length);
      } else {
        const res = await getMessageList();
        if (res.code === 200) {
          this.messageList.list = res.data.records || [];
          if (res.data.total > 0) {
            this.messageList.title = `${this.$t('insideLetter.notice')}(${res.data.total})`;
            this.$emit('change', res.data.total);
          }
        }
      }
    },
    async getTodoInfo() {
      if (process.env.MOCK_DATA === 'true') return;
    },
    async createWebsocket() {
      if (process.env.MOCK_DATA === 'true') return;
      let proto = document.location.protocol == 'http:' ? 'ws:' : 'wss:';
      let address = document.location.port ? document.location.hostname + ':' + document.location.port : document.location.hostname;
      const { code, data } = await getUserInfo();
      if (code !== 200) return;
      let nDid = data.nDID ?? '';
      let userId = data.id ?? '';
      if (!nDid || !userId) return;
      this.connecting = false;
      this.closeWebsocket();
      this.socket = new w3cwebsocket(`${proto}//${address}/ws/socket/websocket/${nDid}/${userId}/pc`);
      // onerror 和 onclose 可能会连续执行，通过防抖控制重连次数
      this.socket.onerror = () => {
        console.log('WebSocket Connection Error');
        if (this.connecting) return;
        setTimeout(() => this.createWebsocket(), 10 * 1000);
        this.connecting = true;
      };
      this.socket.onclose = function() {
        console.log('WebSocket Client Closed');
        if (this.connecting) return;
        setTimeout(() => this.createWebsocket(), 10 * 1000);
        this.connecting = true;
      };
      this.socket.onopen = () => {
        console.log('WebSocket Client Connected');
        const sendNumber = () => {
          if (this.socket.readyState === this.socket.OPEN) {
            let number = Math.round(Math.random() * 0xffffff);
            this.socket.send(number.toString());
            setTimeout(sendNumber, 1000 * 30);
          }
        };
        sendNumber();
      };
      this.socket.onmessage = ev => {
        if (typeof ev.data === 'string') {
          // console.log(`Received: `, JSON.parse(ev.data));
          const data = ev.data ? JSON.parse(ev.data) : {};
          // 消息有更新
          if (Object.keys(data).includes('message')) {
            this.getMessageInfo();
          }
          // 待办有更新
          if (Object.keys(data).includes('todo')) {
            this.getTodoInfo();
          }
        }
      };
    },
    closeWebsocket() {
      this.socket && this.socket.close();
    },
    doRouteHandle(uid) {
      this.$emit('close');
      setTimeout(
        () =>
          this.redirect({
            query: {
              id: uid,
              _: Math.random()
                .toString()
                .slice(8)
            }
          }),
        200
      );
    },
    closePopperHandle() {
      this.$emit('close');
      setTimeout(() => this.redirect(), 200);
    },
    redirect(params) {
      this.$router.push({ path: `/notice-center/${this.currentKey}`, ...params }).catch(() => {});
    }
  }
};
</script>

<style lang="scss" scoped>
.notice-wrapper {
  margin: -12px;
  width: 300px;
  .more-link {
    margin-right: 15px;
  }
  /deep/ .notice-tab {
    .el-tabs__header {
      margin-bottom: 0 !important;
    }
  }
  .list {
    ul > li {
      padding: 8px 15px;
      font-size: $textSize;
      border-bottom: 1px solid $borderColorSecondary;
      cursor: pointer;
      &:hover {
        background-color: $backgroundColorSecondary;
      }
    }
    .no-info {
      text-align: center;
      padding: 40px 0;
      color: $disabledColor;
      span {
        display: inline-block;
        width: 100%;
        font-size: $textSize;
      }
    }
  }
  &-sm {
    .list {
      ul > li {
        font-size: $textSizeSecondary;
      }
      .no-info {
        span {
          font-size: $textSizeSecondary;
        }
      }
    }
  }
}
</style>
