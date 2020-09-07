<template>
  <div class="app-download">
    <span><i class="iconfont icon-mobile"></i> 移动办公</span>
    <div>
      <el-button v-for="(item, index) in list" :key="item.vAppName" type="text" size="medium" @click="clickHandle(index)">{{ item.vAppName }}</el-button>
    </div>
    <BaseDialog :visible.sync="visible" title="移动办公" width="400px" :showFullScreen="false" destroy-on-close>
      <Qrcode :text="qrUrl" />
    </BaseDialog>
  </div>
</template>

<script>
import { getAppDownload } from '@common/api/login';

export default {
  data() {
    return {
      list: [],
      qrUrl: '',
      visible: false
    };
  },
  mounted() {
    this.getAppList();
  },
  methods: {
    async getAppList() {
      const res = await getAppDownload({ hostName: window.location.hostname });
      if (res.code === 200) {
        this.list = res.data ?? [];
      }
    },
    clickHandle(index) {
      this.qrUrl = this.list[index].vUrl;
    }
  }
};
</script>

<style lang="scss" scoped>
.app-download {
  display: flex;
  height: 60px;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  border-top: 1px solid $borderColor;
}
</style>
