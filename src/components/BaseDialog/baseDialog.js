/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-01-09 08:14:51
 **/
import PropTypes from '../_utils/vue-types';
import { getConfig } from '../_utils/globle-config';
import { isNumber } from 'lodash';
import { isIE } from '../_utils/tool';
import Size from '../_utils/mixins/size';
import Locale from '../_utils/mixins/locale';
import PrefixCls from '../_utils/mixins/prefix-cls';
import dragDialog from './dragDialog';

export default {
  name: 'BaseDialog',
  mixins: [Locale, Size, PrefixCls],
  directives: {
    drag: dragDialog
  },
  props: {
    visible: PropTypes.bool.def(false),
    size: PropTypes.oneOf(['small', 'default', 'large']),
    closable: PropTypes.bool.def(true),
    showFullScreen: PropTypes.bool.def(true),
    destroyOnClose: PropTypes.bool.def(false),
    stopEventBubble: PropTypes.bool.def(false),
    title: PropTypes.string.def(''),
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).def('65%'),
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    dragable: PropTypes.bool.def(true),
    top: PropTypes.string.def('10vh'),
    modal: PropTypes.bool.def(true),
    lockScroll: PropTypes.bool.def(true),
    customClass: PropTypes.string,
    maskClosable: PropTypes.bool,
    closeOnPressEscape: PropTypes.bool.def(true),
    containerStyle: PropTypes.object.def({})
  },
  data() {
    return {
      isVisible: this.visible,
      fullscreen: false
    };
  },
  computed: {
    $$dialog() {
      return this.$refs['dialog'].$el.querySelector('.el-dialog');
    },
    isShowDialog() {
      return this.destroyOnClose ? this.isVisible : true;
    },
    maskToClose() {
      return this.maskClosable ?? getConfig('BaseDialog_maskClosable') ?? false;
    },
    fullCls() {
      return ['iconfont', this.fullscreen ? 'icon-fullscreen-exit' : 'icon-fullscreen'];
    },
    disTop() {
      if (this.fullscreen || !this.height) {
        return this.top;
      }
      return `calc((100vh - ${this.parseHeight(this.height)}) / 2)`;
    },
    delayTime() {
      return !isIE() ? 300 : 400;
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.resetDialogHeight();
        this.resetDialogPosition();
        this.isVisible = val;
      } else {
        setTimeout(() => {
          this.isVisible = false;
          this.fullscreen = false;
        }, this.delayTime);
      }
    },
    fullscreen(val) {
      // 重置高度
      this.resetDialogHeight();
      // 可拖拽 & 全屏状态 重置 left/top
      if (this.dragable && val) {
        this.resetDialogPosition();
      }
      this.$emit('viewportChange', val ? 'fullscreen' : 'default');
    }
  },
  deactivated() {
    this.close();
  },
  methods: {
    close() {
      this.$emit('update:visible', false);
    },
    handleClick() {
      this.fullscreen = !this.fullscreen;
    },
    resetDialogHeight() {
      if (!this.$$dialog) return;
      if (this.fullscreen || !this.height) {
        this.$$dialog.style.height = null;
      } else {
        this.$$dialog.style.height = this.parseHeight(this.height);
      }
    },
    resetDialogPosition() {
      if (!this.$$dialog) return;
      this.$$dialog.style.left = 0;
      this.$$dialog.style.top = 0;
    },
    parseHeight(val) {
      return isNumber(val) ? `${val}px` : val;
    }
  },
  render() {
    const {
      isShowDialog,
      showFullScreen,
      fullscreen,
      width,
      height,
      disTop,
      dragable,
      closable,
      fullCls,
      maskToClose,
      closeOnPressEscape,
      stopEventBubble,
      containerStyle,
      $props,
      $attrs,
      $listeners,
      $slots
    } = this;
    const prefixCls = this.getPrefixCls('dialog--wrapper');
    const cls = {
      [prefixCls]: true,
      [`${prefixCls}-sm`]: this.currentSize === 'small',
      [`${prefixCls}-lg`]: this.currentSize === 'large'
    };
    const wrapProps = {
      ref: 'dialog',
      props: {
        ...$props,
        top: disTop,
        width: this.parseHeight(width),
        appendToBody: true,
        showClose: closable,
        fullscreen,
        closeOnClickModal: maskToClose,
        closeOnPressEscape,
        destroyOnClose: false,
        beforeClose: this.close
      },
      attrs: { ...$attrs },
      on: { ...$listeners },
      nativeOn: {
        click: ev => {
          if (!stopEventBubble) return;
          ev.stopPropagation();
        }
      },
      // drag -> 拖拽指令
      directives: dragable ? [{ name: 'drag' }] : null
    };
    const isFooterSlot = Object.keys($slots).includes('footer');
    return (
      <el-dialog class={cls} {...wrapProps}>
        {showFullScreen && (
          <span title={fullscreen ? this.t('baseDialog.cancelFullScreen') : this.t('baseDialog.fullScreen')} class="fullscreen-btn" onClick={this.handleClick}>
            <i class={fullCls} />
          </span>
        )}
        <div
          class="container"
          style={{
            maxHeight: !(fullscreen || height) ? `calc(100vh - ${disTop} - ${disTop} - 48px - ${isFooterSlot ? '52px' : '0px'})` : null,
            ...containerStyle,
            height: null
          }}
        >
          {isShowDialog ? $slots[`default`] : null}
        </div>
        {isShowDialog && isFooterSlot ? $slots[`footer`] : null}
      </el-dialog>
    );
  }
};
