/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-08-25 10:48:14
 **/
import PropTypes from '../_utils/vue-types';
import Locale from '../_utils/mixins/locale';
import Size from '../_utils/mixins/size';
import PrefixCls from '../_utils/mixins/prefix-cls';

export default {
  name: 'BreakSpace',
  mixins: [Locale, Size, PrefixCls],
  props: {
    label: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['default', 'border']).def('default'),
    size: PropTypes.oneOf(['small', 'default', 'large']),
    extra: PropTypes.any,
    collapse: PropTypes.bool.def(false),
    defaultExpand: PropTypes.bool.def(false),
    containerStyle: PropTypes.object.def({}),
    labelStyle: PropTypes.object.def({})
  },
  data() {
    return {
      expand: this.defaultExpand
    };
  },
  methods: {
    toggleHandler() {
      this.expand = !this.expand;
      this.$emit('change', { [this.label]: this.expand });
    }
  },
  render() {
    const { type, collapse, expand, extra } = this;
    const prefixCls = this.getPrefixCls('form-panel--divider');
    const cls = {
      [prefixCls]: true,
      [`divider-${type}`]: true,
      [`${prefixCls}-sm`]: this.currentSize === 'small',
      [`${prefixCls}-lg`]: this.currentSize === 'large'
    };
    const { containerStyle, labelStyle, label, $attrs } = this;
    const wrapProps = {
      attrs: $attrs,
      style: {
        ...containerStyle
      }
    };
    return (
      <div class={cls} {...wrapProps}>
        {type === 'default' && (
          <el-divider contentPosition="left">
            <span class="title" style={{ ...labelStyle }}>
              {label}
            </span>
          </el-divider>
        )}
        {type === 'border' && (
          <div class="divider-border">
            <span class="title" style={{ ...labelStyle }}>
              {label}
            </span>
            {extra && (
              <div class="extra-text text_overflow_cut" title={extra}>
                {extra}
              </div>
            )}
          </div>
        )}
        {collapse && (
          <span class="collect-btn">
            <el-button type="text" onClick={this.toggleHandler}>
              {expand ? this.t('form.collect') : this.t('form.spread')} <i class={expand ? 'el-icon-arrow-up' : 'el-icon-arrow-down'} />
            </el-button>
          </span>
        )}
      </div>
    );
  }
};
