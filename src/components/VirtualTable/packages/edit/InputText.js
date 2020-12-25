/*
 * @Author: 焦质晔
 * @Date: 2020-08-11 08:19:36
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-12-25 17:25:31
 */
import PropTypes from '../../../_utils/vue-types';

export default {
  name: 'InputText',
  props: {
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    size: PropTypes.string,
    maxlength: PropTypes.number,
    placeholder: PropTypes.string,
    readonly: PropTypes.bool.def(false),
    clearable: PropTypes.bool.def(false),
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
    blur() {
      this.$refs['input']?.blur();
    },
    select() {
      this.$refs['input']?.select();
    }
  },
  render() {
    const { inputTextSize, currentValue, maxlength, placeholder, readonly, clearable, disabled, $slots } = this;
    return (
      <el-input
        ref="input"
        size={inputTextSize}
        value={currentValue}
        onInput={val => {
          if (readonly) return;
          this.currentValue = val;
          this.$emit('nativeInput', val);
        }}
        maxlength={maxlength}
        placeholder={placeholder}
        disabled={disabled}
        clearable={clearable}
        onChange={val => {
          this.setValueHandle(val);
          this.emitEventHandle(val);
        }}
        nativeOnClick={ev => {
          if (Array.from(ev.target.classList).includes('el-input__clear')) {
            ev.stopPropagation();
          }
        }}
      >
        <template slot="append">{$slots[`append`]}</template>
      </el-input>
    );
  }
};
