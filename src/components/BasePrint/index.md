## API

### BasePrint

| 参数        | 说明                                          | 类型                   | 默认值   |
| ----------- | --------------------------------------------- | ---------------------- | -------- |
| data        | 打印的数据                                    | array \| object        | -        |
| template    | 打印模板路径，默认前缀 @/pages/printTemplate/ | string                 | -        |
| render      | 打印模板的导入方法(Vue 异步加载组件的方法)    | func                   | -        |
| printerType | 打印机类型，激光 或 针式                      | laser \| stylus        | laser    |
| printCopies | 打印的份数                                    | number                 | -        |
| direction   | 打印方向                                      | vertical \| horizontal | vertical |
| alwaysPrint | 是否按内容走纸(连续无分页打印)                | boolean                | false    |
| directPrint | 是否直接打印（需要购买版权才能直接打印）      | boolean                | false    |
| exportExcel | 导出表格数据，[配置项](#exportExcel)          | object                 | -        |
| isFixedLogo | 是否固定打印 logo                             | boolean                | false    |
| isPreview   | 是否显示浏览器预览，开发调试时使用            | boolean                | false    |

### 方法

| 方法名称     | 说明         | 参数 | 返回值 |
| ------------ | ------------ | ---- | ------ |
| EXCUTE_PRINT | 开始执行打印 | -    | -      |

### exportExcel

| 参数     | 说明                                      | 类型   | 默认值 |
| -------- | ----------------------------------------- | ------ | ------ |
| fileName | 导出的文件名，需包含扩展名 xlsx，必要参数 | string | -      |

### 打印模板，标签支持的类属型

- .bor: 全边框
- .bor-hor: 水平边框
- .bor-through: 贯穿边框（水平边框 - 上下边框）
- .fs12: 字体的大小为 12px
- .fs14: 字体的大小为 14px
- .fs16: 字体的大小为 16px
- .tc: 文本居中对齐
- .tr: 文本居右对齐

### 打印分页符

在打印模板文件中，需要分页的位置插入分页符，示例

```bash
<div style="page-break-after: always">&nbsp;</div>
```

### 连续打印说明

针式打印机，连续无分页打印，需要设置打印机的打印选项：

1. 用户自定义纸张，宽度 24.10 厘米，高度 55.88 厘米(最大高度即可)
2. 设置纸张规格为 上一步自定义纸张的名称

### 示例

## 注意

1. 画打印模板时，建议使用 table 技术，不要设置标签固定宽度，来适应不同的纸张尺寸。

2. 打印单需要导出时，打印模板必须是一个完整的 table 组成，并且使用传统的方式控制格式和样式。

3. 画可导出的打印模板，处理打印 logo 的部分代码 如下：
   colspan -> 单元格所跨的列数

```bash
<tr>
  <td colspan="xxx" class="no-bor">
    <img src="/static/img/logo_l.png" border="0" height="26" class="fl" style="padding: 15px 0 15px 10px;" />
    <img src="/static/img/logo_r.png" border="0" height="36" class="fr" style="padding: 10px;" />
  </td>
</tr>

```

```bash
# template
<template>
  <el-button @click="printHandler">打印</el-button>
  <base-print ref="print" :data="printList" :render="() => import(`@service/pages/printTemplate/xxx.vue`)" />
</template>

# js
export default {
  data() {
    return {
      printList: {}
    };
  },
  methods: {
    printHandler() {
      this.$refs.print.EXCUTE_PRINT();
    }
  }
};
```
