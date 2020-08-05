<template>
  <div class="container">
    <span class="l-t" />
    <span class="r-t" />
    <span class="l-b" />
    <span class="r-b" />
    <h5 class="title">
      <slot name="title" />
    </h5>
    <div class="box">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'Container'
};
</script>

<style lang="scss" scoped>
.container {
  height: 100%;
  border: 1px solid #002c5b;
  position: relative;
  background-color: rgba(0, 8, 56, 0.6);
  .l-t {
    position: absolute;
    left: -1px;
    top: -1px;
    z-index: 2;
    &::before {
      content: ' ';
      position: absolute;
      left: 0;
      top: 0;
      width: 2px;
      height: 13px;
      background-color: #2f8cf5;
    }
    &::after {
      content: ' ';
      position: absolute;
      left: 0;
      top: 0;
      width: 13px;
      height: 2px;
      background-color: #2f8cf5;
    }
  }
  .r-t {
    position: absolute;
    right: -1px;
    top: -1px;
    z-index: 2;
    &::before {
      content: ' ';
      position: absolute;
      right: 0;
      top: 0;
      width: 2px;
      height: 13px;
      background-color: #2f8cf5;
    }
    &::after {
      content: ' ';
      position: absolute;
      right: 0;
      top: 0;
      width: 13px;
      height: 2px;
      background-color: #2f8cf5;
    }
  }
  .l-b {
    position: absolute;
    left: -1px;
    bottom: -1px;
    z-index: 2;
    &::before {
      content: ' ';
      position: absolute;
      left: 0;
      bottom: 0;
      width: 2px;
      height: 13px;
      background-color: #2f8cf5;
    }
    &::after {
      content: ' ';
      position: absolute;
      left: 0;
      bottom: 0;
      width: 13px;
      height: 2px;
      background-color: #2f8cf5;
    }
  }
  .r-b {
    position: absolute;
    right: -1px;
    bottom: -1px;
    z-index: 2;
    &::before {
      content: ' ';
      position: absolute;
      right: 0;
      bottom: 0;
      width: 2px;
      height: 13px;
      background-color: #2f8cf5;
    }
    &::after {
      content: ' ';
      position: absolute;
      right: 0;
      bottom: 0;
      width: 13px;
      height: 2px;
      background-color: #2f8cf5;
    }
  }
  .title {
    // margin: -1px -1px 0;
    height: 40px;
    background: linear-gradient(to right, rgba(0, 8, 56, 0.9), rgba(0, 8, 56, 0.2));
    position: relative;
    display: flex;
    align-items: center;
    padding-left: 22px;
    color: #a0cfff;
    &::before {
      content: ' ';
      position: absolute;
      left: 10px;
      width: 4px;
      height: 18px;
      background-color: #00f7a1;
    }
  }
  .box {
    padding: 8px;
  }
}
</style>
