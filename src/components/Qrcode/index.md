## API

### Qrcode

| 参数            | 说明                         | 类型   | 默认值 |
| --------------- | ---------------------------- | ------ | ------ |
| text            | 欲编码的内容，必选参数       | string | -      |
| size            | 尺寸, 长宽一致, 包含外边距   | number | 200    |
| margin          | 二维码图像的外边距           | number | 20     |
| colorDark       | 实点的颜色                   | string | #000   |
| colorLight      | 空白区的颜色                 | string | #fff   |
| bgSrc           | 欲嵌入的背景图地址           | string | -      |
| backgroundColor | 背景色                       | string | #fff   |
| logoSrc         | 嵌入至二维码中心的 LOGO 地址 | string | -      |

### 示例

```bash
# template
<template>
  <Qrcode text="hello world" />
</template>
```
