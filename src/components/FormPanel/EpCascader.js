/*
 * @Author: 申庆柱
 * @Date: 2020-07-15 10:51:30
 * @LastEditors: shen
 * @LastEditTime: 2020-12-04 10:54:48
 */

import { get } from 'lodash';
import PropTypes from '../_utils/vue-types';

export default {
  name: 'EpCascader',
  props: {
    formType: PropTypes.string.def(''),
    option: PropTypes.object.def({}),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.array])
  },
  data() {
    return {
      itemList: [],
      currentValue: [],
      valueAllLevels: false,
      isInit: true,
      loading: false
    };
  },
  computed: {
    item() {
      return this.$refs.cascader.getCheckedNodes()[0]?.data;
    }
  },
  watch: {
    value(newVal, oldVal) {
      if (newVal === '') {
        this.currentValue = [];
        return;
      }
      if (!this.isInit && this.currentValue[this.currentValue.length - 1] !== newVal) {
        this.setCurrentValue();
      }
    }
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      const { form, option } = this;
      const { fieldName, options = {}, request = {} } = option;
      const { fetchApi, params = {} } = request;
      this.valueAllLevels = options.valueAllLevels;
      this.itemList = options.itemList || [];
      if (!this.itemList.length && fetchApi) {
        this.queryCascaderData(request, fieldName);
      } else {
        this.setCurrentValue();
      }
    },
    setCurrentValue() {
      this.isInit = false;
      if (!this.valueAllLevels && this.value && this.itemList.length) {
        this.currentValue = this.treeFindPath(this.itemList, data => data.value === this.value);
      } else if (this.valueAllLevels && this.itemList.length) {
        this.currentValue = Array.isArray(this.value) ? this.value : [];
      }
    },
    // 获取级联数据
    async queryCascaderData({ fetchApi, params = {}, datakey = '' }, fieldName) {
      this.loading = true;
      const res = await fetchApi(params);
      this.loading = false;
      if (res.code === 200) {
        this.itemList = !datakey ? res.data : get(res.data, datakey, []);
        this.setCurrentValue(this.valueAllLevels);
      }
    },
    // 递归查询树形全路径数据
    treeFindPath(tree, func, path = []) {
      if (!tree) {
        return [];
      }
      for (const data of tree) {
        path.push(data.value);
        if (func(data)) {
          return path;
        }
        if (data.children) {
          const findChildren = this.treeFindPath(data.children, func, path);
          if (findChildren.length) {
            return findChildren;
          }
        }
        path.pop();
      }
      return [];
    },
    handleChange(val) {
      const value = this.valueAllLevels ? val : val[val.length - 1];
      const values = !this.valueAllLevels ? val : undefined;
      this.$emit('change', value, this.item, values);
    },
    showLoading() {
      return this.loading ? (
        <div
          style={{
            position: 'absolute',
            top: '1px',
            right: '2px',
            bottom: '1px',
            width: '25px',
            'text-align': 'center',
            background: '#fff'
          }}
        >
          <i class="el-icon-loading"></i>
        </div>
      ) : null;
    }
  },
  render() {
    const { option } = this;
    const { options = {}, style = {}, placeholder = this.$t('form.selectPlaceholder'), disabled, clearable = !0 } = option;
    const { filterable = false, showAllLevels = true, valueAllLevels = false, checkStrictly = false } = options;
    const props = { value: 'value', label: 'text', checkStrictly };
    return (
      <div style="flex: 1;position: relative">
        <el-cascader
          ref="cascader"
          v-model={this.currentValue}
          options={this.itemList}
          Props={props}
          placeholder={!disabled ? placeholder : ''}
          style={{ width: '100%', ...style }}
          show-all-levels={showAllLevels}
          filterable={filterable}
          disabled={disabled}
          clearable={clearable}
          onChange={val => {
            this.handleChange(val);
          }}
        />
        {this.showLoading()}
      </div>
    );
  }
};

// EP_CASCADER(option) {
//   const { form, formType } = this;
//   const { label, fieldName, labelWidth, labelOptions, descOptions, onChange = noop } = option;
//   return (
//     <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
//       {labelOptions && this.createFormItemLabel(labelOptions)}
//       <EpCascader
//         value={form[fieldName]}
//         formType={formType}
//         option={option}
//         onChange={(val, item, values) => {
//           form[fieldName] = val;
//           onChange(val, item, values);
//         }}
//       />
//       {descOptions && this.createFormItemDesc({ fieldName, ...descOptions })}
//     </el-form-item>
//   );
// }
