<template>
  <el-dropdown class="size-select" trigger="click" placement="bottom-start" @command="languageChangeHandle">
    <i class="iconfont icon-font-size" />
    <el-dropdown-menu slot="dropdown" class="size-select-dropdown">
      <el-dropdown-item class="large" :disabled="size === 'large'" command="large"> {{ $t('sizeSelect.large') }}&nbsp;&nbsp;</el-dropdown-item>
      <el-dropdown-item class="default" :disabled="size === 'default'" command="default"> {{ $t('sizeSelect.default') }}&nbsp;&nbsp;</el-dropdown-item>
      <el-dropdown-item class="small" :disabled="size === 'small'" command="small"> {{ $t('sizeSelect.small') }}&nbsp;&nbsp;</el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
/*
 * @Author: 焦质晔
 * @Date: 2020-04-30 15:17:48
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-09-12 16:06:30
 */
import { mapState, mapActions } from 'vuex';

export default {
  name: 'SizeSelect',
  computed: {
    ...mapState('app', ['size'])
  },
  methods: {
    ...mapActions('app', ['setSize', 'createElementSize', 'clearKeepAliveCache', 'refreshView']),
    languageChangeHandle(size) {
      this.setSize(size);
      this.createElementSize(size);
      localStorage.setItem('size', size);
      // 浏览器刷新，重新获取数据
      // window.history.go(0);
      // 重新加载路由页面
      this.clearKeepAliveCache();
      this.refreshView({ path: this.$route.path });
    }
  }
};
</script>

<style lang="scss" scoped>
.size-select {
  display: flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  .icon-font-size {
    font-size: 20px;
    cursor: pointer;
  }
}
.size-select-dropdown {
  .large {
    font-size: $textSize + 2px;
  }
  .default {
    font-size: $textSize;
  }
  .small {
    font-size: $textSize - 2px;
  }
}
</style>
