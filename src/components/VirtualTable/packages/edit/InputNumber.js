/*
 * @Author: 焦质晔
 * @Date: 2020-08-11 08:19:36
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-01-07 17:24:41
 */
import PropTypes from '../../../_utils/vue-types';

export default {
  name: 'InputNumber',
  props: {
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    size: PropTypes.string,
    min: PropTypes.number.def(0),
    max: PropTypes.number,
    step: PropTypes.number.def(1),
    maxlength: PropTypes.number,
    precision: PropTypes.number,
    controls: PropTypes.bool.def(false),
    placeholder: PropTypes.string,
    disabled: PropTypes.bool.def(false)
  },
  data() {
    return {
      currentValue: ''
    };
  },
  computed: {
    inputNumberSize() {
      return this.size || (this.$ELEMENT || {}).size;
    },
    minDisabled() {
      return this.currentValue <= this.min;
    },
    maxDisabled() {
      return this.currentValue >= this.max;
    }
  },
  watch: {
    value: {
      handler(val) {
        this.setValueHandle(val);
      },
      immediate: true
    }
  },
  methods: {
    setValueHandle(val) {
      val = val ?? '';
      if (this.precision >= 0 && val !== '') {
        val = Number(val).toFixed(this.precision);
      }
      this.currentValue = val;
    },
    emitEventHandle(val) {
      val = val !== '' ? Number(val) : undefined;
      this.$emit('input', val);
      this.$emit('change', val);
    },
    increaseHandle() {
      if (this.maxDisabled) return;
      let val = Number(this.currentValue) + this.step;
      val = val > this.max ? this.max : val;
      this.setValueHandle(val);
      this.emitEventHandle(val);
    },
    decreaseHanle() {
      if (this.minDisabled) return;
      let val = Number(this.currentValue) - this.step;
      val = val < this.min ? this.min : val;
      this.setValueHandle(val);
      this.emitEventHandle(val);
    },
    focus() {
      this.$refs['input']?.focus();
    },
    blur() {
      this.$refs['input']?.blur();
    },
    select() {
      this.$refs['input']?.select();
    }
  },
  render() {
    const { inputNumberSize, currentValue, min, max, maxlength, precision, controls, placeholder, disabled, minDisabled, maxDisabled } = this;
    const regExp = /^-?(0|[1-9][0-9]*)(\.[0-9]*)?$/;
    const cls = [
      'el-input-number',
      {
        [`el-input-number--${inputNumberSize}`]: inputNumberSize
      },
      { 'is-disabled': disabled },
      { 'is-without-controls': !controls },
      { 'is-controls-right': controls }
    ];
    return (
      <div class={cls}>
        {controls && (
          <span class={{ 'el-input-number__decrease': !0, 'is-disabled': minDisabled }} onClick={this.decreaseHanle}>
            <i class="el-icon-arrow-down" />
          </span>
        )}
        {controls && (
          <span class={{ 'el-input-number__increase': !0, 'is-disabled': maxDisabled }} onClick={this.increaseHandle}>
            <i class="el-icon-arrow-up" />
          </span>
        )}
        <el-input
          ref="input"
          value={currentValue}
          onInput={val => {
            let isPassed = (!Number.isNaN(val) && regExp.test(val)) || val === '' || val === '-';
            // 数值类型校验
            if (!isPassed) return;
            // 不允许是负数
            if (min === 0 && val === '-') return;
            let chunks = val.split('.');
            // 判断最大长度
            if (chunks[0].length > maxlength) return;
            // 判断整型
            if (precision === 0 && chunks.length > 1) return;
            // 判断浮点型
            if (precision > 0 && chunks.length > 1 && chunks[1].length > precision) return;
            // 设置数据值
            this.currentValue = val;
          }}
          placeholder={placeholder}
          disabled={disabled}
          onChange={val => {
            // 处理 val 值得特殊情况
            val = val === '-' ? '' : val;
            // 判断最大值/最小值
            if (Number(val) > max) {
              val = max;
            }
            if (Number(val) < min) {
              val = min;
            }
            this.setValueHandle(val);
            this.emitEventHandle(val);
          }}
        />
      </div>
    );
  }
};
