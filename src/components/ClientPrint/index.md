## API

### ClientPrint

| 参数           | 说明                                                         | 类型            | 默认值 |
| -------------- | ------------------------------------------------------------ | --------------- | ------ |
| templateRender | 打印模板组件，必要参数                                       | object          | -      |
| dataSource     | 打印数据，必要参数                                           | array \| object | -      |
| uniqueKey      | 设置打印各种配置信息的本地缓存，不能重复                     | string          | -      |
| defaultConfig  | 默认的打印参数设置，[配置项](#config)                        | object          | -      |
| preview        | 是否开启打印预览                                             | boolean         | true   |
| closeOnPrinted | 打印后是否关闭预览窗口                                       | boolean         | false  |
| type           | 打印按钮的类型                                               | string          | -      |
| disabled       | 打印按钮的禁用状态                                           | boolean         | false  |
| click          | 点击事件(异步方法)，用于获取接口打印数据，给 dataSource 赋值 | func            | -      |

### ClientPrintGroup

| 参数      | 说明                                     | 类型   | 默认值 |
| --------- | ---------------------------------------- | ------ | ------ |
| uniqueKey | 设置打印各种配置信息的本地缓存，不能重复 | string | -      |

### ClientPrintItem

| 参数           | 说明                   | 类型            | 默认值 |
| -------------- | ---------------------- | --------------- | ------ |
| label          | 打印选项卡名称         | string          | -      |
| dataSource     | 打印数据，必要参数     | array \| object | -      |
| templateRender | 打印模板组件，必要参数 | object          | -      |
| disabled       | 是否禁用当前选项卡     | boolean         | false  |

### 方法

| 方法名称 | 说明                                   | 参数 | 返回值 |
| -------- | -------------------------------------- | ---- | ------ |
| DO_PRINT | 执行打印，在之前需要加载打印数据及模板 | -    | -      |

### 事件

| 事件名称 | 说明                                 | 回调参数       |
| -------- | ------------------------------------ | -------------- |
| print    | 打印的回调事件，参数表示是否成功打印 | Function(bool) |
| export   | 导出的回调事件，参数表示是否成功导出 | Function(bool) |
| open     | 打印预览窗口，打开时触发             | -              |
| close    | 打印预览窗口，关闭时触发             | -              |

### config

| 参数名称    | 说明                                       | 类型   | 默认值   |
| ----------- | ------------------------------------------ | ------ | -------- |
| printerType | 打印机类型，激光(laser)，针式(stylus)      | string | laser    |
| direction   | 打印方向，纵向(vertical)，横向(horizontal) | string | vertical |
| copies      | 打印份数                                   | number | 1        |

### 打印模板，标签支持的类属型

- .bor: 单元格全边框，加在 td 标签上
- .fs12: 字体的大小为 12px，加在 table 标签
- .fs13: 字体的大小为 13px，加在 table 标签
- .fs14: 字体的大小为 14px，加在 table 标签
- .fw500: 字体粗细 font-weight: 500，加在 td 标签上
- .fw700: 字体粗细 font-weight: 700，加在 td 标签上
- .fl: 左浮动
- .fr: 右浮动
- .tc: 文本居中对齐，加在 td 标签上
- .tr: 文本居右对齐，加在 td 标签上
- .bor-t：单元格上边框，加在 td 标签上
- .bor-b：单元格下边框，加在 td 标签上
- .bor-l：单元格左边框，加在 td 标签上
- .bor-r：单元格右边框，加在 td 标签上
- .no-bor：去掉单元格边框，加在 td 标签上

### 连续打印(针式)

针式打印机，连续无分页打印，需要设置打印机的打印选项：

1. 用户自定义纸张，宽度 24.10 厘米，高度 55.88 厘米(最大高度即可)
2. 设置纸张规格为 上一步自定义纸张的名称

### 说明

1. 画打印模板时，必须使用 table 技术，除了以上公共的 class 属性外，不能使用自定义样式表，只能使用 style 行间样式。
2. 打印模板中的 table 表格，已经做了 24 列的等宽处理，采用了栅格系统的理念，通过合并行、列灵活实现布局。
3. 画打印模板时不需要处理打印的 Logo 和 行高(line-height)，底层已经处理。
4. 打印模板组件 template 标签的根组件必须是 table 标签。

注意：整个打印模板的绘制，必须使用标准的 table 布局！！！

### 示例

```bash
# template
<template>
  <client-print uniqueKey="print_jzy" :dataSource="printData" :click="printHandle" :templateRender="printTemplate">打印</client-print>
</template>

# js
import DemoTemplate from '@test/pages/printTemplate/demo2';

export default {
  data: {
    printTemplate: DemoTemplate, // 可以动态切换
    printData: []
  },
  methods: {
    async printHandle() {
      // 模拟接口请求数据
      await sleep(1000);
      let res = [];
      for (let i = 0; i < 100; i++) {
        res[i] = i;
      }
      this.printData = res;
    },
  }
};
```
