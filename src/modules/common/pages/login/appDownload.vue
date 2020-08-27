<template>
  <div class="app-download">
    <span><i class="iconfont icon-mobile"></i> 移动办公</span>
    <div>
      <el-button type="text" size="medium">销售App</el-button>
      <el-button type="text" size="medium">售后App</el-button>
      <el-button type="text" size="medium">销售iPad</el-button>
      <el-button type="text" size="medium">售后iPad</el-button>
    </div>
  </div>
</template>

<script>
export default {};
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
