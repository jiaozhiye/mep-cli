/*
 * @Author: 焦质晔
 * @Date: 2020-05-27 15:30:29
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-08-27 19:03:05
 */
import { addResizeListener, removeResizeListener } from '../_utils/resize-event';

export default {
  destroyed() {
    this.removeResizeEvent();
  },
  methods: {
    resizeListener() {
      // 祖先元素有 display: none 时，不执行重绘
      if (this.$el?.offsetParent === null) return;
      this.chartRef && this.chartRef.resize();
    },
    bindResizeEvent() {
      addResizeListener(this.$chart, this.resizeListener);
    },
    removeResizeEvent() {
      removeResizeListener(this.$chart, this.resizeListener);
    }
  }
};
