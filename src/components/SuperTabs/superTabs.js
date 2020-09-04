/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-09-03 08:38:46
 **/
import PropTypes from '../_utils/vue-types';
import { filterEmpty } from '../_utils/props-util';
import Size from '../_utils/mixins/size';
import PrefixCls from '../_utils/mixins/prefix-cls';

export default {
  name: 'SuperTabs',
  mixins: [Size, PrefixCls],
  props: {
    initialValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    size: PropTypes.oneOf(['small', 'default', 'large']),
    tabType: PropTypes.oneOf(['card', 'border-card']),
    tabPosition: PropTypes.oneOf(['top', 'left']).def('top'),
    animated: PropTypes.bool.def(false),
    lazyLoad: PropTypes.bool.def(true),
    tabNavOffsetLeft: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    containerStyle: PropTypes.object.def({})
  },
  data() {
    return {
      activeKey: this.value || this.initialValue
    };
  },
  mounted() {
    if (this.tabPosition === 'top' && this.tabNavOffsetLeft) {
      this.$el.querySelector('.el-tabs__nav-wrap').style.paddingLeft = this.pxToNumber(this.tabNavOffsetLeft) + 'px';
    }
  },
  methods: {
    pxToNumber(val) {
      if (typeof val === 'number') {
        return val;
      }
      if (/^\d+(?:px)?$/.test(val)) {
        return parseInt(val, 10);
      }
      return val;
    },
    handleClick() {
      this.$emit('input', this.activeKey);
      this.$emit('change', this.activeKey);
    },
    createTabMenus(vNodes) {
      return vNodes.map(x => ({
        name: x.key ?? x.data.attrs.label,
        label: x.data.attrs.label,
        disabled: x.data.attrs.disabled,
        lazy: this.lazyLoad,
        children: x.children ?? []
      }));
    },
    createTabsContent(arr) {
      return arr.map(x => {
        return (
          <el-tab-pane key={x.name} name={x.name} label={x.label} disabled={x.disabled} lazy={x.lazy}>
            {x.children}
          </el-tab-pane>
        );
      });
    }
  },
  render() {
    const { activeKey, tabPosition, tabType, containerStyle, $slots } = this;
    const prefixCls = this.getPrefixCls('super-tab--wrapper');
    const cls = {
      [prefixCls]: true,
      [`${prefixCls}-sm`]: this.currentSize === 'small',
      [`${prefixCls}-lg`]: this.currentSize === 'large'
    };
    const children = filterEmpty($slots.default).filter(x => x.tag === 'tab-panel' || x.tag === 'TabPanel');
    const tabProps = this.createTabMenus(children);
    return (
      <div class={cls} style={{ ...containerStyle, position: 'relative' }}>
        {$slots['extraContent'] && tabPosition === 'top' ? <div class="tap-top-exta">{$slots['extraContent']}</div> : null}
        <el-tabs value={activeKey} tab-position={tabPosition} type={tabType} onInput={val => (this.activeKey = val)} on-tab-click={this.handleClick}>
          {this.createTabsContent(tabProps)}
        </el-tabs>
      </div>
    );
  }
};
