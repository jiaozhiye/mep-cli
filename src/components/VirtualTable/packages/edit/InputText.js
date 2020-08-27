/*
 * @Author: 焦质晔
 * @Date: 2020-08-11 08:19:36
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-08-26 17:08:14
 */
import PropTypes from '../../../_utils/vue-types';

export default {
  name: 'InputText',
  props: {
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    size: PropTypes.string,
    maxlength: PropTypes.number,
    placeholder: PropTypes.string,
    disabled: PropTypes.bool.def(false)
  },
  data() {
    return {
      currentValue: ''
    };
  },
  computed: {
    inputTextSize() {
      return this.size || (this.$ELEMENT || {}).size;
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
      this.currentValue = val;
    },
    emitEventHandle(val) {
      this.$emit('input', val);
      this.$emit('change', val);
    },
    focus() {
      this.$refs['input']?.focus();
    },
    select() {
      this.$refs['input']?.select();
    }
  },
  render() {
    const { inputTextSize, currentValue, maxlength, placeholder, disabled } = this;
    return (
      <el-input
        ref="input"
        size={inputTextSize}
        value={currentValue}
        onInput={val => {
          this.currentValue = val;
          this.$emit('nativeInput', val);
        }}
        maxlength={maxlength}
        placeholder={placeholder}
        disabled={disabled}
        onChange={val => {
          this.setValueHandle(val);
          this.emitEventHandle(val);
        }}
      />
    );
  }
};
