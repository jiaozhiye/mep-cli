/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-04-08 15:11:14
 **/
import addEventListener from 'add-dom-event-listener';
import PropTypes from '../_utils/vue-types';
import { getConfig } from '../_utils/globle-config';
import Spin from '../Spin';
import Size from '../_utils/mixins/size';
import Locale from '../_utils/mixins/locale';
import PrefixCls from '../_utils/mixins/prefix-cls';

export default {
  name: 'Drawer',
  mixins: [Locale, Size, PrefixCls],
  provide() {
    return { $$drawer: this };
  },
  props: {
    visible: PropTypes.bool.def(false),
    title: PropTypes.string.def(''),
    size: PropTypes.oneOf(['small', 'default', 'large']),
    position: PropTypes.oneOf(['right', 'left', 'top', 'bottom']).def('right'),
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).def('75%'),
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).def('60%'),
    closable: PropTypes.bool.def(true),
    showHeader: PropTypes.bool.def(true),
    destroyOnClose: PropTypes.bool.def(false),
    showFullScreen: PropTypes.bool.def(true),
    stopEventBubble: PropTypes.bool.def(false),
    level: PropTypes.number.def(1),
    beforeClose: PropTypes.func,
    maskClosable: PropTypes.bool,
    closeOnPressEscape: PropTypes.bool.def(true),
    containerStyle: PropTypes.object.def({})
  },
  data() {
    return {
      isVisible: this.visible,
      loading: this.visible,
      fullscreen: false
    };
  },
  computed: {
    direction() {
      const DIR = { right: 'rtl', left: 'ltr', top: 'ttb', bottom: 'btt' };
      return DIR[this.position];
    },
    contentSize() {
      const size = ['right', 'left'].includes(this.position) ? this.width : this.height;
      return this.calcContentSize(!this.fullscreen ? size : '100%');
    },
    maskToClose() {
      return this.maskClosable ?? getConfig('Drawer_maskClosable') ?? false;
    }
  },
  deactivated() {
    this.close();
  },
  methods: {
    open() {
      if (this.destroyOnClose || !this.isVisible) {
        this.loading = true;
      }
      this.fullscreen = false;
      this.$emit('open');
    },
    opened() {
      this.loading = false;
      this.isVisible = true;
      this.addStopEvent();
      this.$emit('opened');
      this.$emit('afterVisibleChange', true);
    },
    close() {
      this.$emit('update:visible', false);
      this.$emit('close', this.doReload);
    },
    closed() {
      this.isVisible = !this.destroyOnClose;
      this.doReload = undefined;
      this.removeStopEvent();
      this.$emit('closed');
      this.$emit('afterVisibleChange', false);
    },
    handleClick() {
      this.fullscreen = !this.fullscreen;
      this.$emit('viewportChange', this.fullscreen ? 'fullscreen' : 'default');
    },
    calcContentSize(val) {
      let size = Number(val) > 0 ? `${val}px` : val;
      return `calc(${size} - ${(Number(this.level) - 1) * 60}px)`;
    },
    addStopEvent() {
      this.stopEvent = addEventListener(document.body, 'mousedown', ev => ev.stopPropagation());
    },
    removeStopEvent() {
      this.stopEvent?.remove();
    },
    DO_CLOSE() {
      this.$refs[`drawer`].closeDrawer();
    }
  },
  render() {
    const { isVisible, loading, title, fullscreen, contentSize, direction, showFullScreen, maskToClose, closeOnPressEscape, containerStyle, $props, $attrs, $slots } = this;
    const prefixCls = this.getPrefixCls('drawer--wrapper');
    const cls = {
      [prefixCls]: true,
      [`${prefixCls}-sm`]: this.currentSize === 'small',
      [`${prefixCls}-lg`]: this.currentSize === 'large'
    };
    const wrapProps = {
      ref: 'drawer',
      class: cls,
      props: {
        visible: $props.visible,
        size: contentSize,
        direction,
        withHeader: $props.showHeader,
        showClose: $props.closable,
        beforeClose: $props.beforeClose,
        wrapperClosable: maskToClose,
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
      }
    };
    const fullCls = ['iconfont', fullscreen ? 'icon-fullscreen-exit' : 'icon-fullscreen'];
    return (
      <el-drawer {...wrapProps}>
        <div slot="title" class="drawer-title">
          <span class="title">{title}</span>
          {showFullScreen && (
            <span title={fullscreen ? this.t('baseDialog.cancelFullScreen') : this.t('baseDialog.fullScreen')} class="fullscreen" onClick={this.handleClick}>
              <i class={fullCls} />
            </span>
          )}
        </div>
        {isVisible && (
          <div class="drawer-container" style={{ ...containerStyle }}>
            {$slots[`default`]}
          </div>
        )}
        {loading && (
          <div class="drawer-loading">
            <Spin spinning={loading} tip="Loading..." containerStyle={{ height: '100%' }} />
          </div>
        )}
      </el-drawer>
    );
  }
};
