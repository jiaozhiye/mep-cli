/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-01-19 14:25:23
 **/
import PropTypes from '../_utils/vue-types';
import { getConfig } from '../_utils/globle-config';
import { isIE } from '../_utils/tool';
import Spin from '../Spin';
import Size from '../_utils/mixins/size';
import Locale from '../_utils/mixins/locale';
import PrefixCls from '../_utils/mixins/prefix-cls';

import { PopupManager } from 'element-ui/lib/utils/popup';

export default {
  name: 'VDrawer',
  mixins: [Locale, Size, PrefixCls],
  props: {
    visible: PropTypes.bool.def(false),
    size: PropTypes.oneOf(['small', 'default', 'large']),
    closable: PropTypes.bool.def(true),
    destroyOnClose: PropTypes.bool.def(false),
    title: PropTypes.string.def(''),
    position: PropTypes.string.def('right'),
    lockScroll: PropTypes.bool.def(true),
    maskClosable: PropTypes.bool,
    closeOnPressEscape: PropTypes.bool.def(true),
    showFullScreen: PropTypes.bool.def(true),
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).def('75%'),
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).def('300px'),
    level: PropTypes.number.def(1),
    zIndex: PropTypes.number.def(100),
    maskStyle: PropTypes.object.def({}),
    containerStyle: PropTypes.object.def({})
  },
  provide() {
    return { $$drawer: this };
  },
  data() {
    this.STYLE = {
      bottom: {
        bottom: 0,
        left: 0,
        width: '100%',
        minHeight: this.calcPanelSize(this.height),
        transform: 'translate3d(0, 100%, 0)'
      },
      left: {
        bottom: 0,
        left: 0,
        width: this.calcPanelSize(this.width),
        minWidth: '800px',
        height: '100vh',
        transform: 'translate3d(-100%, 0, 0)'
      },
      top: {
        top: 0,
        right: 0,
        width: '100%',
        minHeight: this.calcPanelSize(this.height),
        transform: 'translate3d(0, -100%, 0)'
      },
      right: {
        top: 0,
        right: 0,
        width: this.calcPanelSize(this.width),
        minWidth: '800px',
        height: '100vh',
        transform: 'translate3d(100%, 0, 0)'
      }
    };
    // 状态变量
    this.transitionState = '';
    return {
      isVisible: this.visible,
      loading: this.visible,
      fullscreen: false,
      containerShowStyle: {}
    };
  },
  computed: {
    $$drawerPanel() {
      return this.$refs[`drawer-panel`];
    },
    realzIndex() {
      return Number(this.zIndex) + Number(this.level);
    },
    delayTime() {
      return !isIE() ? 300 : 400;
    },
    maskToClose() {
      return this.maskClosable ?? getConfig('Drawer_maskClosable') ?? false;
    },
    containerPosition() {
      return this.STYLE[this.position];
    },
    fullScrennStyle() {
      if (this.position === 'right' || this.position === 'left') {
        return this.fullscreen ? { width: this.calcPanelSize('100%') } : null;
      }
      return null;
    }
  },
  watch: {
    visible(val) {
      if (val) {
        if (this.destroyOnClose || !this.isVisible) {
          this.loading = val;
        }
        this.fullscreen = false;
      }
      if (this.transitionState !== '') {
        this.containerShowStyle = this.createShowStyle();
      } else {
        // 首次加载，延迟展开动画，解决 transitionend 不触发问题
        setTimeout(() => (this.containerShowStyle = this.createShowStyle()), 10);
      }
      this.transitionState = 'ready';
      val ? this.$emit('open') : this.$emit('close', this.doReload);
      document.addEventListener('keydown', this.escapeCloseHandle, false);
      if (this.lockScroll) {
        document.body.style.overflow = val ? 'hidden' : '';
      }
    }
  },
  deactivated() {
    this.close();
  },
  methods: {
    open() {
      this.$emit('update:visible', true);
    },
    close(from) {
      if (from === 'mask' && !this.maskToClose) return;
      this.$emit('update:visible', false);
    },
    handleClick() {
      this.fullscreen = !this.fullscreen;
      this.$emit('viewportChange', this.fullscreen ? 'fullscreen' : 'default');
    },
    createShowStyle() {
      return this.visible ? { visibility: 'visible', transform: `translate3d(0, 0, 0)` } : null;
    },
    calcPanelSize(val) {
      let size = Number(val) > 0 ? `${val}px` : val;
      return `calc(${size} - ${(Number(this.level) - 1) * 60}px)`;
    },
    escapeCloseHandle(ev) {
      if (!this.closeOnPressEscape || ev.keyCode !== 27) return;
      const topPopup = this.getTopPopup();
      if (!topPopup) {
        this.close();
      }
    },
    transitionendHandle(ev) {
      if (ev.target !== ev.currentTarget) return;
      if (this.transitionState !== 'ready') return;
      this.transitionState = 'stop';
      this.loading = false;
      this.isVisible = this.destroyOnClose ? this.visible : true;
      this.doReload = undefined;
      this.$emit('afterVisibleChange', this.visible);
      !this.visible && document.removeEventListener('keydown', this.escapeCloseHandle);
    },
    getTopPopup() {
      if (PopupManager.modalStack.length > 0) {
        const topPopup = PopupManager.modalStack[PopupManager.modalStack.length - 1];
        if (!topPopup) return;
        const instance = PopupManager.getInstance(topPopup.id);
        return instance;
      }
    }
  },
  render() {
    const { isVisible, loading, title, closable, fullscreen, showFullScreen, realzIndex, maskStyle, containerPosition, containerShowStyle, containerStyle, fullScrennStyle, $slots } = this;
    const prefixCls = this.getPrefixCls('drawer--wrapper');
    const cls = {
      [prefixCls]: true,
      [`${prefixCls}-sm`]: this.currentSize === 'small',
      [`${prefixCls}-lg`]: this.currentSize === 'large'
    };
    const maskCls = [
      'drawer-mask',
      {
        [`mask-show`]: this.visible
      }
    ];
    const fullCls = ['iconfont', fullscreen ? 'icon-fullscreen-exit' : 'icon-fullscreen'];
    return (
      <div class={cls}>
        <div class={maskCls} style={{ ...maskStyle, zIndex: realzIndex }} onClick={() => this.close('mask')} />
        <div
          ref="drawer-panel"
          class="drawer-container"
          style={{ ...containerPosition, ...containerShowStyle, ...containerStyle, ...fullScrennStyle, zIndex: realzIndex + 1 }}
          onTransitionend={this.transitionendHandle}
        >
          <div class="header">
            <div class="title">{$slots[`title`] || title}</div>
            {showFullScreen && (
              <span title={fullscreen ? this.t('baseDialog.cancelFullScreen') : this.t('baseDialog.fullScreen')} class="fullscreen-btn" onClick={this.handleClick}>
                <i class={fullCls} />
              </span>
            )}
            {closable && (
              <span class="close" title={this.t('drawer.close')} onClick={this.close}>
                <i class="iconfont icon-close" />
              </span>
            )}
          </div>
          <div class="container">
            {isVisible && $slots[`default`]}
            {loading && (
              <div class="loading">
                <Spin spinning={loading} tip="Loading..." />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
};
