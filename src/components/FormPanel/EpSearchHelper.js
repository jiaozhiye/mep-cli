/*
 * @Author: 申庆柱
 * @Date: 2020-07-15 10:51:30
 * @LastEditors: 申庆柱
 * @LastEditTime: 2020-08-24 14:29:48
 */

import { get, isObject, template } from 'lodash';
import PropTypes from '../_utils/vue-types';

export default {
  name: 'EpCascader',
  props: {
    formType: PropTypes.string.def(''),
    option: PropTypes.object.def({}),
    value: PropTypes.string.def('')
  },
  data() {
    this.DEFINE = ['valueName', 'displayName', 'descriptionName'];
    this.queryFields = [];
    return {
      currentValue: this.value,
      isInit: true,
      columns: null,
      alias: {},
      visible: false,
      hideLoading: false,
      isExistHeader: false
    };
  },
  watch: {
    value(newVal, oldVal) {
      this.currentValue = newVal;
    }
  },
  methods: {
    // 获取搜索帮助数据
    async querySearchAsync(queryString = '', cb) {
      const { fieldsDefine, table } = this.option.searchHelper;
      const { api, params = {}, dataKey = '' } = table.fetch;
      if (!Object.keys(this.alias).length) {
        await this.getHelperConfig();
      }
      if (!Object.keys(this.alias).length) return;
      const res = await api({ ...this.getQueryParams(queryString), ...params, currentPage: 1, pageSize: 5 });
      if (res.code === 200) {
        const dataList = !dataKey ? res.data : get(res.data, dataKey, []);
        cb(this.createSerachHelperList(dataList));
      }
    },
    // 获取搜索帮助配置
    async getHelperConfig() {
      const { getServerConfig, name, fieldsDefine } = this.option.searchHelper;
      if (!name) {
        throw new Error('[EP_SEARCH_HELPER] 类型的 `name` 不存在');
      }
      try {
        const { code, data } = await getServerConfig({ name });
        if (code === 200) {
          const target = {};
          for (let key in fieldsDefine) {
            if (!this.DEFINE.includes(key)) continue;
            target[fieldsDefine[key]] = data[key];
          }
          this.alias = Object.assign({}, target);
          this.queryFields = data.columns.filter(p => p.type === 'text').map(f => f.dataIndex);
          this.columns = data.columns;
        }
      } catch (error) {}
    },
    // 获取搜索参数只支持input
    getQueryParams(queryString) {
      if (!this.queryFields.length) return {};
      return { twhere: this.queryFields.map(f => `${f} like '${queryString}'`).join(' or ') };
    },
    createSerachHelperList(list) {
      if (!list.length) {
        return [];
      }
      let header = { ...list[0], isHeader: true };
      this.columns.forEach(item => {
        header[item.dataIndex] = item.title;
      });
      return [header, ...list];
    }
  },
  render() {
    const { option } = this;
    const { options = {}, style = {}, fieldName, placeholder = this.$t('form.inputPlaceholder'), disabled, readonly = false, clearable = !0, searchHelper } = option;
    const { onEnter } = options;
    const dialogProps = {
      props: {
        visible: this.visible,
        title: this.$t('form.searchHelper'),
        showFullScreen: false,
        destroyOnClose: true,
        containerStyle: { height: 'calc(100% - 52px)', paddingBottom: '52px' }
      },
      on: {
        'update:visible': val => (this.visible = val)
      }
    };
    const shProps = {
      props: {
        ...searchHelper
      },
      on: {
        close: (visible, data, alias) => {
          this.$emit('close', data, alias);
        }
      }
    };
    return (
      <div style="flex: 1;position: relative">
        <el-autocomplete
          ref="autocomplete"
          v-model={this.currentValue}
          placeholder={!disabled ? placeholder : ''}
          disabled={disabled}
          popperClass="search-helper-popper ep-search-helper-popper"
          clearable
          triggerOnFocus={false}
          readonly={readonly}
          fetchSuggestions={(queryString, cb) => this.querySearchAsync(queryString, cb)}
          onSelect={data => {
            if (data.isHeader) {
              this.currentValue = this.value;
              return;
            }
            this.$emit('close', data, this.alias);
          }}
          onChange={val => {
            this.$emit('change', val);
          }}
          onClear={() => {
            // 解决清除之后不能直接触发输入建议问题
            this.$refs.autocomplete.activated = true;
          }}
          nativeOnKeydown={e => {
            if (e.keyCode !== 13) return;
            onEnter(e.target.value);
          }}
          scopedSlots={{
            default: ({ item }) => {
              return this.columns.map(x => (
                <td style={{ fontWeight: item.isHeader ? '600' : '400', borderBottom: item.isHeader ? '1px solid #ccc' : '' }} key={x.dataIndex}>
                  {<span>{item[x.dataIndex]}</span>}
                </td>
              ));
            }
          }}
        >
          <template slot="append">
            <el-button icon="el-icon-search" />
          </template>
        </el-autocomplete>
        <div
          class="ep-search-helper-button"
          style={disabled && { cursor: 'not-allowed' }}
          onClick={ev => {
            if (disabled) return;
            this.$emit('open');
          }}
        ></div>
        <BaseDialog {...dialogProps}>
          <SearchHelper {...shProps} />
        </BaseDialog>
      </div>
    );
  }
};
// 使用
// import EpSearchHelper from './EpSearchHelper';
// EP_SEARCH_HELPER(option) {
//   const { form, formType } = this;
//   const { label, fieldName, labelWidth, labelOptions, descOptions, options = {}, searchHelper, onChange = noop } = option;
//   const { onlySelect = true } = options;
//   const searchRef = this.$refs[`EP_SEARCH_HELPER-${fieldName}`];
//   if (onlySelect) {
//     this[`${fieldName}PrevValue`] = form[fieldName];
//   }
//   let fieldKeys = [...Object.keys(searchHelper.fieldAliasMap?.() ?? {}), ...Object.values(searchHelper.fieldsDefine ?? {})];
//   if (!this[`${fieldName}ExtraKeys`]) {
//     this[`${fieldName}ExtraKeys`] = fieldKeys.filter(x => x !== fieldName && x !== 'extra');
//   }

//   return (
//     <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
//       {labelOptions && this.createFormItemLabel(labelOptions)}
//       <EpSearchHelper
//         ref={`EP_SEARCH_HELPER-${fieldName}`}
//         value={form[fieldName]}
//         formType={formType}
//         option={option}
//         onClose={(data, alias) => {
//           if (isObject(data) && Object.keys(alias).length) {
//             const extraKeys = [];
//             for (let key in alias) {
//               if (key !== 'extra') {
//                 form[key] = data[alias[key]];
//                 if (key !== fieldName) {
//                   extraKeys.push(key);
//                 } else {
//                   onChange(form[key], false);
//                 }
//               } else {
//                 this.desc[fieldName] = data[alias[key]];
//               }
//             }
//             if (extraKeys.length) {
//               this[`${fieldName}ExtraKeys`] = extraKeys;
//             }
//           }
//           if (onlySelect) {
//             this[`${fieldName}PrevValue`] = form[fieldName];
//           }
//           searchRef.currentValue = form[fieldName];
//           const { closed = noop } = searchHelper;
//           closed(data);
//           searchRef.visible = false;
//         }}
//         onOpen={() => {
//           const { open = () => true } = searchHelper;
//           if (!open(this.form)) return;
//           searchRef.visible = true;
//         }}
//         onChange={val => {
//           if (!val.trim() || !onlySelect) {
//             if (Array.isArray(this[`${fieldName}ExtraKeys`]) && this[`${fieldName}ExtraKeys`].length) {
//               this[`${fieldName}ExtraKeys`].forEach(key => (form[key] = ''));
//             }
//             this.desc[fieldName] = '';
//             this[`${fieldName}PrevValue`] = '';
//             form[fieldName] = val.trim();
//             onChange(form[fieldName], !onlySelect);
//           } else if (val && onlySelect && val !== this[`${fieldName}PrevValue`]) {
//             searchRef.currentValue = form[fieldName] = this[`${fieldName}PrevValue`];
//           }
//         }}
//       />
//       {descOptions && this.createFormItemDesc({ fieldName, ...descOptions })}
//     </el-form-item>
//   );
// },
