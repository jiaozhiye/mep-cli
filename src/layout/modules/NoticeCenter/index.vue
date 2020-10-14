<template>
  <div class="notice-center">
    <el-popover v-model="visible" trigger="click" :offset="20" placement="bottom-end" transition="el-zoom-in-top">
      <el-badge slot="reference" class="badge" :value="msgNumber || null">
        <i class="icon el-icon-message-solid" />
      </el-badge>
      <InsideLetter :visible="visible" @change="changeHandle" @close="closeHandle" />
    </el-popover>
  </div>
</template>

<script>
/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-10-13 15:05:57
 **/
import InsideLetter from '@/pages/insideLetter/index';

export default {
  name: 'NoticeCenter',
  components: {
    InsideLetter
  },
  data() {
    return {
      msgNumber: 0,
      visible: false
    };
  },
  methods: {
    changeHandle(val) {
      this.msgNumber = val;
    },
    closeHandle() {
      this.visible = !1;
    }
  }
};
</script>

<style lang="scss" scoped>
.notice-center {
  display: flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  .badge {
    /deep/ .el-badge__content {
      right: 10px;
      top: 2px;
      transform: translateY(-50%) translateX(100%) scale(0.9);
    }
  }
  .icon {
    font-size: 22px;
    cursor: pointer;
  }
}
</style>
