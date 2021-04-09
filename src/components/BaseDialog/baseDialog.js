/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-04-08 15:09:47
 **/
import addEventListener from 'add-dom-event-listener';
import PropTypes from '../_utils/vue-types';
import { getConfig } from '../_utils/globle-config';
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
    title: PropTypes.string.def(''),
    size: PropTypes.oneOf(['small', 'default', 'large']),
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).def('65%'),
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    top: PropTypes.string.def('10vh'),
    dragable: PropTypes.bool.def(true),
    closable: PropTypes.bool.def(true),
    showFullScreen: PropTypes.bool.def(true),
    destroyOnClose: PropTypes.bool.def(false),
    stopEventBubble: PropTypes.bool.def(false),
    lockScroll: PropTypes.bool.def(true),
    beforeClose: PropTypes.func,
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
    showDialog() {
      return this.destroyOnClose ? this.isVisible : true;
    },
    maskToClose() {
      return this.maskClosable ?? getConfig('BaseDialog_maskClosable') ?? false;
    },
    disTop() {
      if (this.fullscreen || !this.height) {
        return this.top;
      }
      return `calc((100vh - ${this.parseHeight(this.height)}) / 2)`;
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.resetDialogHeight();
        this.resetDialogPosition();
      }
    },
    fullscreen(val) {
      this.resetDialogHeight();
      // 可拖拽 & 全屏状态 重置 left/top
      if (this.dragable && val) {
        this.resetDialogPosition();
      }
    }
  },
  deactivated() {
    this.close();
  },
  methods: {
    open() {
      this.isVisible = true;
      this.fullscreen = false;
      this.$emit('open');
    },
    opened() {
      this.addStopEvent();
      this.$emit('opened');
      this.$emit('afterVisibleChange', true);
    },
    close() {
      this.$emit('update:visible', false);
      this.$emit('close');
    },
    closed() {
      this.isVisible = false;
      this.removeStopEvent();
      this.$emit('closed');
      this.$emit('afterVisibleChange', false);
    },
    handleClick() {
      this.fullscreen = !this.fullscreen;
      this.$emit('viewportChange', this.fullscreen ? 'fullscreen' : 'default');
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
      return Number(val) > 0 ? `${val}px` : val;
    },
    addStopEvent() {
      this.stopEvent = addEventListener(document.body, 'mousedown', ev => ev.stopPropagation());
    },
    removeStopEvent() {
      this.stopEvent?.remove();
    },
    DO_CLOSE() {
      this.$refs[`dialog`].handleClose();
    }
  },
  render() {
    const { showDialog, showFullScreen, fullscreen, title, height, disTop, dragable, maskToClose, closeOnPressEscape, containerStyle, $props, $attrs, $slots } = this;
    const prefixCls = this.getPrefixCls('dialog--wrapper');
    const cls = {
      [prefixCls]: true,
      [`${prefixCls}-sm`]: this.currentSize === 'small',
      [`${prefixCls}-lg`]: this.currentSize === 'large'
    };
    const wrapProps = {
      ref: 'dialog',
      class: cls,
      props: {
        visible: $props.visible,
        width: this.parseHeight($props.width),
        top: disTop,
        showClose: $props.closable,
        beforeClose: $props.beforeClose,
        fullscreen,
        closeOnClickModal: maskToClose,
        closeOnPressEscape,
        appendToBody: true,
        destroyOnClose: false
      },
      attrs: { ...$attrs },
      on: {
        open: this.open,
        opened: this.opened,
        close: this.close,
        closed: this.closed
      },
      // drag -> 拖拽指令
      directives: dragable ? [{ name: 'drag' }] : null
    };
    const isFooterSlot = Object.keys($slots).includes('footer');
    const fullCls = ['iconfont', fullscreen ? 'icon-fullscreen-exit' : 'icon-fullscreen'];
    return (
      <el-dialog {...wrapProps}>
        <div slot="title" class="dialog-title">
          <span class="title">{title}</span>
          {showFullScreen && (
            <span title={fullscreen ? this.t('baseDialog.cancelFullScreen') : this.t('baseDialog.fullScreen')} class="fullscreen" onClick={this.handleClick}>
              <i class={fullCls} />
            </span>
          )}
        </div>
        <div
          class="dialog-container"
          style={{
            maxHeight: !(fullscreen || height) ? `calc(100vh - ${disTop} - ${disTop} - 48px - ${isFooterSlot ? '52px' : '0px'})` : null,
            ...containerStyle,
            height: null
          }}
        >
          {showDialog ? $slots[`default`] : null}
        </div>
        {showDialog && isFooterSlot ? $slots[`footer`] : null}
      </el-dialog>
    );
  }
};
