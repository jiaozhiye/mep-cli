/*
 * @Author: 焦质晔
 * @Date: 2020-08-11 08:19:36
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-04-09 10:03:48
 */
import PropTypes from '../_utils/vue-types';
import Emitter from '../_utils/mixins/emitter';

export default {
  name: 'InputNumber',
  mixins: [Emitter],
  inject: ['elForm', 'elFormItem'],
  props: {
    value: PropTypes.number,
    min: PropTypes.number.def(0),
    max: PropTypes.number,
    step: PropTypes.number.def(1),
    maxlength: PropTypes.number,
    precision: PropTypes.number,
    controls: PropTypes.bool.def(false),
    placeholder: PropTypes.string,
    clearable: PropTypes.bool.def(false),
    readonly: PropTypes.bool.def(false),
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
      this.dispatch('ElFormItem', 'el.form.change', [val]);
    },
    emitInputHandle(val) {
      this.$emit('valueInput', val !== '' ? Number(val) : undefined);
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
    blur() {
      this.dispatch('ElFormItem', 'el.form.blur', [this.currentValue]);
    },
    focus() {
      this.$refs['input']?.focus();
    },
    select() {
      this.$refs['input']?.select();
    }
  },
  render() {
    const { inputNumberSize, currentValue, min, max, maxlength, precision, controls, placeholder, clearable, readonly, disabled, minDisabled, maxDisabled } = this;
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
            this.emitInputHandle(val);
          }}
          validateEvent={false}
          placeholder={placeholder}
          clearable={clearable}
          readonly={readonly}
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
          onBlur={this.blur}
        />
      </div>
    );
  }
};
