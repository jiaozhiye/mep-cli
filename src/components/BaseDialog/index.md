## API

### BaseDialog

| 参数           | 说明                                           | 类型              | 默认值 |
| -------------- | ---------------------------------------------- | ----------------- | ------ |
| visible        | 是否显示 Dialog，支持 .sync 修饰符             | boolean           | false  |
| title          | 标题名称                                       | string            | -      |
| width          | Dialog 的宽度，单位是 %                        | string            | 60%    |
| destroyOnClose | 关闭时销毁 Dialog 里的子元素                   | boolean           | false  |
| dragable       | 是否可拖拽                                     | boolean           | true   |
| closable       | 是否显示右上角的关闭按钮                       | boolean           | true   |
| maskClosable   | 是否可以通过点击 modal 关闭 Dialog             | boolean           | false  |
| showFullScreen | 是否显示全屏按钮                               | boolean           | true   |
| containerStyle | 对话框外层容器的 css 样式                      | object            | -      |
| beforeClose    | 关闭前的回调，关闭组件，执行形参 cb 函数的调用 | Function(cb:func) | -      |

### 事件

| 事件名称           | 说明                          | 回调参数                  |
| ------------------ | ----------------------------- | ------------------------- |
| open               | 打开时触发                    | -                         |
| opened             | 打开动画结束时触发            | -                         |
| close              | 关闭时触发                    | -                         |
| closed             | 关闭动画结束时触发            | -                         |
| viewportChange     | Dialog 组件视口大小变化时触发 | Function(state:string)    |
| afterVisibleChange | 切换时，动画结束后的事件      | Function(visible:boolean) |

### 插槽

| 插槽名称 | 说明            |
| -------- | --------------- |
| default  | Dialog 中的内容 |

### 示例

```bash
# template
<template>
  <base-dialog :visible.sync="visible" title="标题" destroyOnClose>
    <子组件 />
  </base-dialog>
</template>

# js
export default {
  data() {
    return {
      visible: false
    };
  }
};
```
