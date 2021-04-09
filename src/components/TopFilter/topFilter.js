/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-04-09 10:08:55
 **/
import { get, set, xor, merge, transform, cloneDeep, isEqual, isObject, isFunction } from 'lodash';
import dayjs from 'dayjs';
import { getConfig } from '../_utils/globle-config';
import PropTypes from '../_utils/vue-types';
import Size from '../_utils/mixins/size';
import Locale from '../_utils/mixins/locale';
import PrefixCls from '../_utils/mixins/prefix-cls';
import FormCols from '../_utils/mixins/form-cols';
import { sleep } from '../_utils/tool';
import pinyin, { STYLE_FIRST_LETTER } from '../Pinyin';
import InputNumber from '../FormPanel/InputNumber';
import Cascader from '../FormPanel/Cascader.vue';
import SearchHelper from '../SearchHelper';
import BaseDialog from '../BaseDialog';
import EpCascader from '../FormPanel/EpCascader';
import EpSearchHelper from '../FormPanel/EpSearchHelper';

const noop = () => {};

export default {
  name: 'TopFilter',
  mixins: [Locale, Size, PrefixCls, FormCols],
  props: {
    list: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        fieldName: PropTypes.string
      }).loose
    ).isRequired,
    size: PropTypes.oneOf(['small', 'default', 'large']),
    initialValue: PropTypes.object.def({}),
    loading: PropTypes.bool.def(false),
    defaultRows: PropTypes.number.def(1),
    cols: PropTypes.number,
    labelWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).def(80),
    showLabelErrorColor: PropTypes.bool,
    isAutoFocus: PropTypes.bool.def(true),
    isCollapse: PropTypes.bool.def(true),
    isDisabled: PropTypes.bool.def(false),
    isSubmitBtn: PropTypes.bool.def(true),
    defultValueOnClear: PropTypes.bool.def(false)
  },
  data() {
    this.arrayTypes = ['RANGE_DATE', 'EP_RANGE_DATE', 'RANGE_TIME', 'RANGE_INPUT', 'RANGE_INPUT_NUMBER', 'MULTIPLE_SELECT', 'MULTIPLE_CHECKBOX'];
    return {
      form: {}, // 表单的值
      desc: {}, // 描述信息
      expand: false, // 展开收起状态
      visible: {}
    };
  },
  computed: {
    formItemList() {
      const result = [];
      this.list
        .filter(x => x.fieldName)
        .forEach(x => {
          if (isObject(x.labelOptions) && x.labelOptions.fieldName) {
            result.push(x.labelOptions);
          }
          result.push(x);
        });
      result.forEach(x => {
        this.$set(x, 'disabled', x.disabled);
        this.$set(x, 'hidden', x.hidden);
        this.$set(x, 'rules', x.rules);
      });
      return result;
    },
    fieldNames() {
      return this.formItemList.map(x => x.fieldName);
    },
    rules() {
      const result = {};
      this.formItemList.forEach(x => {
        if (!x.rules) return;
        result[x.fieldName] = x.rules;
      });
      return result;
    },
    descContents() {
      return this.formItemList.filter(x => isObject(x.descOptions)).map(x => ({ fieldName: x.fieldName, content: x.descOptions.content }));
    },
    isLabelErrorColor() {
      return this.showLabelErrorColor ?? getConfig('TopFilter_showLabelErrorColor') ?? false;
    },
    showCollapse() {
      const total = this.list.filter(x => !x.hidden).length;
      return this.isCollapse && total >= this.flexCols;
    }
  },
  watch: {
    fieldNames(nextProps, prevProps) {
      const diffs = xor(prevProps, nextProps);
      if (!diffs.length) return;
      diffs.forEach(x => {
        if (prevProps.includes(x)) {
          delete this.form[x];
        } else {
          let item = this.formItemList.find(k => k.fieldName === x);
          this.$set(this.form, x, this.getInitialValue(item, this.form[x] ?? this.initialValue[x]));
        }
      });
    },
    rules() {
      this.$nextTick(() => this.$refs.form.clearValidate());
    },
    descContents(val) {
      val.forEach(x => (this.desc[x.fieldName] = x.content));
    },
    expand(val) {
      if (!this.showCollapse) return;
      this.$emit('collapseChange', val);
    },
    form: {
      handler(val) {
        const diff = this.difference(val, this.initialValues);
        if (!Object.keys(diff).length) return;
        this.$emit('valuesChange', diff);
      },
      deep: true
    },
    desc: {
      handler(val) {
        this.formItemList.forEach(x => {
          if (isObject(x.descOptions)) {
            x.descOptions.content = val[x.fieldName];
          }
        });
      },
      deep: true
    }
  },
  created() {
    this.initialHandle();
  },
  mounted() {
    this.bindResizeEvent();
    this.createInputFocus();
  },
  methods: {
    initialHandle() {
      this.form = this.createFormValue();
      this.desc = this.createDescription();
      // Object.assign(this.form, this.createFormValue());
      this.initialValues = cloneDeep(this.form);
      this.initialExtras = Object.assign({}, this.desc);
    },
    getInitialValue(item, val) {
      const { type = '', options = {} } = item;
      val = val ?? undefined;
      if (this.arrayTypes.includes(type)) {
        val = val ?? [];
      }
      if (type === 'CHECKBOX') {
        val = val ?? options.falseValue ?? '0';
      }
      return val;
    },
    createFormValue() {
      const target = {};
      this.formItemList.forEach(x => {
        target[x.fieldName] = this.getInitialValue(x, this.initialValue[x.fieldName]);
      });
      return Object.assign({}, this.initialValue, target);
    },
    createInputFocus() {
      if (!this.isAutoFocus) return;
      const { type, fieldName } = this.list.filter(x => x.fieldName && !x.hidden)[0] ?? {};
      if ((type === 'INPUT' || type === 'INPUT_NUMBER') && fieldName) {
        this.$refs[`${type}-${fieldName}`].focus();
      }
    },
    clearAllFocus() {
      this.formItemList.forEach(x => {
        if (x.hidden || !x.type) return;
        this.$refs[`${x.type}-${x.fieldName}`]?.blur?.();
      });
    },
    createDescription() {
      const target = {};
      this.formItemList
        .filter(x => isObject(x.descOptions))
        .forEach(x => {
          target[x.fieldName] = x.descOptions.content;
        });
      return Object.assign({}, target);
    },
    createFormItemLabel(option) {
      const { form } = this;
      const { label, type = 'SELECT', fieldName, options = {}, style = {}, disabled, onChange = noop } = option;
      const { itemList, trueValue = '1', falseValue = '0' } = options;
      return (
        <div slot="label" class="label-wrap" style={{ ...style }}>
          {type === 'SELECT' && (
            <el-select v-model={form[fieldName]} placeholder="" disabled={disabled} onChange={onChange}>
              {itemList.map(x => (
                <el-option key={x.value} label={x.text} value={x.value} disabled={x.disabled} />
              ))}
            </el-select>
          )}
          {type === 'CHECKBOX' && (
            <span>
              <span class="desc-text" style={{ paddingRight: '10px' }}>
                {label}
              </span>
              <el-checkbox v-model={form[fieldName]} trueLabel={trueValue} falseLabel={falseValue} disabled={disabled} onChange={onChange} />
            </span>
          )}
        </div>
      );
    },
    createFormItemDesc(option) {
      const { fieldName, isTooltip, style = {} } = option;
      const content = this.desc[fieldName] ?? '';
      if (isTooltip) {
        return (
          <el-tooltip effect="dark" placement="right">
            <div slot="content">{content}</div>
            <i class="desc-icon el-icon-info" />
          </el-tooltip>
        );
      }
      return (
        <span title={content} class="desc-text text_overflow_cut" style={{ display: 'inline-block', paddingLeft: '10px', ...style }}>
          {content}
        </span>
      );
    },
    RENDER_FORM_ITEM(option) {
      const { label, fieldName, labelWidth, labelOptions, style = {}, render = noop } = option;
      return (
        <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
          {labelOptions && this.createFormItemLabel(labelOptions)}
          <div class="desc-text" style={{ width: '100%', ...style }}>
            {render()}
          </div>
        </el-form-item>
      );
    },
    INPUT(option) {
      const { form } = this;
      const {
        label,
        fieldName,
        labelWidth,
        labelOptions,
        descOptions,
        options = {},
        searchHelper = {},
        style = {},
        placeholder = this.t('form.inputPlaceholder'),
        clearable = !0,
        readonly,
        disabled,
        onChange = noop
      } = option;
      const { minlength = 0, maxlength, noInput, toUpper, unitRender, onInput = noop, onFocus = noop, onClick = noop, onDblClick = noop } = options;
      const isSearchHelper = !!Object.keys(searchHelper).length;
      // 搜索帮助关闭带值事件
      const shCloseHandle = (visible, data, alias) => {
        const aliasKeys = Object.keys(alias);
        if (isObject(data) && aliasKeys.length) {
          for (let key in alias) {
            if (key !== 'extra' && !key.endsWith('__desc')) {
              form[key] = data[alias[key]];
            }
            if (key === 'extra') {
              this.desc[fieldName] = data[alias[key]];
            }
            if (key.endsWith('__desc')) {
              this.desc[key.slice(0, -6)] = data[alias[key]];
            }
          }
          if (aliasKeys.includes(fieldName)) {
            shChangeHandle(form[fieldName]);
          }
          this[`__${fieldName}_is_change`] = false;
        }
        const { closed = noop } = searchHelper;
        closed(data);
        this.visible[fieldName] = visible;
      };
      // 搜索帮助 change 事件
      const shChangeHandle = val => {
        const others = {};
        this[`${fieldName}ExtraKeys`].forEach(key => (others[key] = form[key]));
        // 忘记了之前为啥加 $nextTick
        onChange(val, Object.keys(others).length ? others : null);
      };
      // 设置搜做帮助组件表单数据
      const createShFilters = val => {
        const { name, fieldsDefine, getServerConfig, filterAliasMap = noop } = searchHelper;
        const alias = Object.assign([], filterAliasMap());
        const inputParams = name && fieldsDefine && getServerConfig ? {} : { [fieldName]: val };
        alias.forEach(x => (inputParams[x] = val));
        return inputParams;
      };
      // 格式化查询参数 for tds
      const formatParams = val => {
        const { name, fieldsDefine, getServerConfig, beforeFetch = k => k } = searchHelper;
        val = beforeFetch(val);
        // tds 搜索条件的参数规范
        if (name && fieldsDefine && getServerConfig) {
          val = { name, condition: val };
        }
        return val;
      };
      // 执行搜索帮助接口，获取数据
      const getShTableData = val => {
        const { table, initialValue = {} } = searchHelper;
        return new Promise(async (resolve, reject) => {
          if (process.env.MOCK_DATA === 'true') {
            await sleep(500);
            const { data } = cloneDeep(require('@/mock/tableData').default);
            return resolve(data.items);
          } else {
            const params = merge({}, table.fetch?.params, formatParams({ ...initialValue, ...createShFilters(val) }), { currentPage: 1, pageSize: 500 });
            try {
              const res = await table.fetch.api(params);
              if (res.code === 200) {
                const list = get(res.data, table.fetch.dataKey) ?? (Array.isArray(res.data) ? res.data : []);
                return resolve(list);
              }
            } catch (err) {}
            reject();
          }
        });
      };
      // 打开搜索帮助面板
      const openShPanel = val => {
        const { open = () => true } = searchHelper;
        if (this.visible[fieldName] || !open(this.form)) return;
        this[`__${fieldName}_deriveValue`] = createShFilters(val);
        this.visible = Object.assign({}, this.visible, { [fieldName]: !0 });
        // 清空搜索帮助
        // clearSearchHelperValue();
        // 设置搜索帮助查询参数
        // this.$nextTick(() => this.$refs[`INPUT-SH-${fieldName}`].$refs[`topFilter`]?.SET_FORM_VALUES(createShFilters(val)));
      };
      // 创建 field alias 别名
      const createFieldAlias = async () => {
        const { name, fieldsDefine, getServerConfig, fieldAliasMap = noop } = searchHelper;
        let alias = {}; // 别名映射
        // tds
        if (name && fieldsDefine && getServerConfig) {
          const DEFINE = ['valueName', 'displayName', 'descriptionName'];
          const target = {};
          try {
            const res = await getServerConfig({ name });
            if (res?.code === 200) {
              for (let key in fieldsDefine) {
                if (!DEFINE.includes(key)) continue;
                target[fieldsDefine[key]] = res.data[key];
              }
            }
          } catch (err) {}
          alias = Object.assign({}, target);
        } else {
          alias = Object.assign({}, fieldAliasMap());
        }
        return alias;
      };
      // 设置搜索帮助的值
      const resetSearchHelperValue = async (list = [], val) => {
        const alias = await createFieldAlias();
        const records = list.filter(data =>
          data[alias[fieldName]]
            ?.toString()
            .toLowerCase()
            .includes(val.toLowerCase())
        );
        if (records.length === 1) {
          return shCloseHandle(false, records[0], alias);
        }
        openShPanel(val);
      };
      // 清空搜索帮助
      const clearSearchHelperValue = bool => {
        if (Array.isArray(this[`${fieldName}ExtraKeys`])) {
          this[`${fieldName}ExtraKeys`].forEach(key => (form[key] = ''));
        }
        if (Array.isArray(this[`${fieldName}DescKeys`])) {
          this[`${fieldName}DescKeys`].forEach(key => (this.desc[key] = ''));
        }
        form[fieldName] = '';
        bool && shChangeHandle('');
      };
      const dialogProps = isSearchHelper
        ? {
            props: {
              visible: this.visible[fieldName],
              title: this.t('form.searchHelper'),
              width: searchHelper.width ?? '60%',
              height: searchHelper.height,
              showFullScreen: false,
              destroyOnClose: true,
              containerStyle: { height: 'calc(100% - 52px)', paddingBottom: '52px' }
            },
            on: {
              'update:visible': val => (this.visible[fieldName] = val),
              close: () => {
                this[`__${fieldName}_deriveValue`] = {};
                if (this[`__${fieldName}_is_change`]) {
                  clearSearchHelperValue();
                }
                this[`__${fieldName}_is_change`] = false;
              }
            }
          }
        : null;
      const shProps = isSearchHelper
        ? {
            ref: `INPUT-SH-${fieldName}`,
            props: {
              ...searchHelper,
              initialValue: merge({}, searchHelper.initialValue, this[`__${fieldName}_deriveValue`])
            },
            on: {
              close: shCloseHandle
            }
          }
        : null;
      if (isSearchHelper) {
        let fieldKeys = [...Object.keys(searchHelper.fieldAliasMap?.() ?? {}), ...Object.values(searchHelper.fieldsDefine ?? {})];
        // 其他表单项的 fieldName
        if (!this[`${fieldName}ExtraKeys`]) {
          this[`${fieldName}ExtraKeys`] = fieldKeys.filter(x => x !== fieldName && x !== 'extra' && !x.endsWith('__desc'));
        }
        // 表单项的表述信息
        if (!this[`${fieldName}DescKeys`]) {
          this[`${fieldName}DescKeys`] = fieldKeys
            .filter(x => x === 'extra' || x.endsWith('__desc'))
            .map(x => {
              if (x === 'extra') {
                return fieldName;
              }
              return x.slice(0, -6);
            });
        }
      }
      return (
        <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
          {labelOptions && this.createFormItemLabel(labelOptions)}
          <el-input
            ref={`INPUT-${fieldName}`}
            value={form[fieldName]}
            onInput={val => {
              // 搜索帮助，不允许输入
              if (noInput) return;
              form[fieldName] = !toUpper ? val : val.toUpperCase();
              onInput(val);
              isSearchHelper && (this[`__${fieldName}_is_change`] = true);
            }}
            title={form[fieldName]}
            minlength={minlength}
            maxlength={maxlength}
            placeholder={!disabled ? (!isSearchHelper ? placeholder : this.t('form.selectPlaceholder')) : ''}
            clearable={clearable}
            readonly={readonly}
            disabled={disabled}
            style={{ ...style }}
            onChange={val => {
              val = val.trim();
              form[fieldName] = val;
              if (isSearchHelper) {
                if (!val) {
                  clearSearchHelperValue(!0);
                }
                if (val && searchHelper.table.fetch?.api) {
                  if (searchHelper.closeServerMatch) {
                    shChangeHandle(form[fieldName]);
                  } else {
                    getShTableData(val)
                      .then(list => resetSearchHelperValue(list, val))
                      .catch(() => clearSearchHelperValue(!0));
                  }
                }
              } else {
                onChange(form[fieldName], null);
              }
            }}
            onFocus={onFocus}
            nativeOnclick={ev => {
              onClick(form[fieldName]);
            }}
            nativeOnDblclick={ev => {
              onDblClick(form[fieldName]);
              if (!isSearchHelper || disabled) return;
              openShPanel(form[fieldName]);
              // 防止二次触发 change 事件
              this.$refs[`INPUT-${fieldName}`].blur();
            }}
            nativeOnKeydown={ev => {
              if (isSearchHelper) return;
              this.enterEventHandle(ev);
            }}
          >
            {isSearchHelper && (
              <template slot="append">
                <el-button
                  icon="el-icon-search"
                  style={disabled && { cursor: 'not-allowed' }}
                  onClick={ev => {
                    if (disabled) return;
                    openShPanel(form[fieldName]);
                  }}
                />
              </template>
            )}
            {isFunction(unitRender) && <template slot="append">{<div style={disabled && { pointerEvents: 'none' }}>{unitRender()}</div>}</template>}
          </el-input>
          {descOptions && this.createFormItemDesc({ fieldName, ...descOptions })}
          {isSearchHelper && (
            <BaseDialog {...dialogProps}>
              <SearchHelper {...shProps} />
            </BaseDialog>
          )}
        </el-form-item>
      );
    },
    INPUT_NUMBER(option) {
      const { form } = this;
      const {
        label,
        fieldName,
        labelWidth,
        labelOptions,
        descOptions,
        options = {},
        style = {},
        placeholder = this.t('form.inputPlaceholder'),
        clearable,
        readonly,
        disabled,
        onChange = noop
      } = option;
      const { maxlength, min = 0, max, step = 1, precision, controls = !1, onInput = noop } = options;
      return (
        <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
          {labelOptions && this.createFormItemLabel(labelOptions)}
          <InputNumber
            ref={`INPUT_NUMBER-${fieldName}`}
            v-model={form[fieldName]}
            min={min}
            max={max}
            step={step}
            precision={precision}
            maxlength={maxlength}
            controls={controls}
            placeholder={!disabled ? placeholder : ''}
            clearable={clearable}
            readonly={readonly}
            disabled={disabled}
            style={{ ...style }}
            onValueInput={onInput}
            onChange={onChange}
            nativeOnKeydown={this.enterEventHandle}
          />
          {descOptions && this.createFormItemDesc({ fieldName, ...descOptions })}
        </el-form-item>
      );
    },
    RANGE_INPUT(option) {
      const { form } = this;
      const { label, fieldName, labelWidth, labelOptions, clearable, readonly, disabled, onChange = noop } = option;
      const [startFieldName, endFieldName] = fieldName.split('|');
      return (
        <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
          {labelOptions && this.createFormItemLabel(labelOptions)}
          <el-input
            v-model={form[fieldName][0]}
            placeholder={!disabled ? this.t('form.startValue') : ''}
            clearable={clearable}
            readonly={readonly}
            disabled={disabled}
            style={{ width: `calc(50% - 7px)` }}
            onChange={() => onChange({ [startFieldName]: form[fieldName][0] })}
          />
          <span style="display: inline-block; text-align: center; width: 14px;">-</span>
          <el-input
            v-model={form[fieldName][1]}
            placeholder={!disabled ? this.t('form.endValue') : ''}
            clearable={clearable}
            readonly={readonly}
            disabled={disabled}
            style={{ width: `calc(50% - 7px)` }}
            onChange={() => onChange({ [endFieldName]: form[fieldName][1] })}
          />
        </el-form-item>
      );
    },
    RANGE_INPUT_NUMBER(option) {
      const { form } = this;
      const { label, fieldName, labelWidth, labelOptions, options = {}, clearable, readonly, disabled, onChange = noop } = option;
      const { min = 0, max, step = 1, precision } = options;
      const [startVal = min, endVal = max] = form[fieldName];
      return (
        <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
          {labelOptions && this.createFormItemLabel(labelOptions)}
          <InputNumber
            v-model={form[fieldName][0]}
            min={min}
            max={endVal}
            step={step}
            precision={precision}
            controls={false}
            placeholder={!disabled ? this.t('form.startValue') : ''}
            clearable={clearable}
            readonly={readonly}
            disabled={disabled}
            style={{ width: `calc(50% - 7px)` }}
            onChange={() => onChange(form[fieldName])}
          />
          <span style="display: inline-block; text-align: center; width: 14px;">-</span>
          <InputNumber
            v-model={form[fieldName][1]}
            min={startVal}
            max={max}
            step={step}
            precision={precision}
            controls={false}
            placeholder={!disabled ? this.t('form.endValue') : ''}
            clearable={clearable}
            readonly={readonly}
            disabled={disabled}
            style={{ width: `calc(50% - 7px)` }}
            onChange={() => onChange(form[fieldName])}
          />
        </el-form-item>
      );
    },
    INPUT_TREE(option) {
      const { form } = this;
      const { label, fieldName, labelWidth, labelOptions, options = {}, style = {}, placeholder = this.t('form.inputPlaceholder'), clearable = !0, readonly, disabled, onChange = noop } = option;
      const { itemList } = options;
      const treeWrapProps = {
        props: {
          props: { children: 'children', label: 'text' },
          data: itemList
        }
      };
      this[`${fieldName}TreeText`] = this.createInputTreeValue(fieldName, itemList);
      return (
        <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
          {labelOptions && this.createFormItemLabel(labelOptions)}
          <el-popover
            v-model={this.visible[fieldName]}
            popper-class="input-tree"
            transition="el-zoom-in-top"
            placement="bottom-start"
            trigger="click"
            style={{ width: '100%', display: 'inline-flex' }}
            on-after-leave={() => {
              this[`${fieldName}TreeFilterTexts`] = '';
              this.treeFilterTextHandle(fieldName);
            }}
          >
            <div class="el-input--small input-tree-wrap" style={{ maxHeight: '250px', overflowY: 'auto', ...style }}>
              <input
                value={this[`${fieldName}TreeFilterTexts`]}
                class="el-input__inner"
                placeholder={this.t('form.treePlaceholder')}
                onInput={ev => {
                  this[`${fieldName}TreeFilterTexts`] = ev.target.value;
                  this.treeFilterTextHandle(fieldName);
                }}
              />
              <el-tree
                ref={`INPUT_TREE-${fieldName}`}
                {...treeWrapProps}
                style={{ marginTop: '4px' }}
                defaultExpandAll={true}
                expandOnClickNode={false}
                filterNodeMethod={this.filterNodeHandle}
                on-node-click={data => {
                  this.treeNodeClickHandle(fieldName, data);
                  onChange(form[fieldName], data);
                }}
              />
            </div>
            <el-input
              slot="reference"
              value={this[`${fieldName}TreeText`]}
              placeholder={!disabled ? placeholder : ''}
              clearable={clearable}
              readonly={readonly}
              disabled={disabled}
              style={disabled && { pointerEvents: 'none' }}
              onClear={() => {
                this.treeNodeClickHandle(fieldName, {});
                onChange(form[fieldName], null);
              }}
              nativeOnKeydown={this.enterEventHandle}
            />
          </el-popover>
        </el-form-item>
      );
    },
    INPUT_CASCADER(option) {
      const { form } = this;
      const { label, fieldName, labelWidth, labelOptions, options = {}, style = {}, placeholder = this.t('form.selectPlaceholder'), clearable = !0, readonly, disabled, onChange = noop } = option;
      const { itemList, titles = [], mustCheckLast } = options;
      return (
        <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
          {labelOptions && this.createFormItemLabel(labelOptions)}
          <el-popover v-model={this.visible[fieldName]} transition="el-zoom-in-top" placement="bottom-start" trigger="click" style={{ width: '100%', display: 'inline-flex' }}>
            <div style={{ maxHeight: '250px', overflowY: 'auto', ...style }}>
              <Cascader
                value={form[fieldName]}
                onInput={val => {
                  this.cascaderChangeHandle(fieldName, val);
                }}
                list={itemList}
                labels={titles}
                mustCheckLast={mustCheckLast}
                style={style}
                onChange={() => {
                  onChange(form[fieldName], this[`${fieldName}CascaderText`]);
                }}
                onClose={val => {
                  this.visible[fieldName] = val;
                }}
              />
            </div>
            <el-input
              slot="reference"
              value={this[`${fieldName}CascaderText`]}
              placeholder={!disabled ? placeholder : ''}
              clearable={clearable}
              readonly={readonly}
              disabled={disabled}
              style={disabled && { pointerEvents: 'none' }}
              onClear={() => {
                this.cascaderChangeHandle(fieldName, []);
                onChange(form[fieldName], this[`${fieldName}CascaderText`]);
              }}
            />
          </el-popover>
        </el-form-item>
      );
    },
    EP_CASCADER(option) {
      const { form } = this;
      const { label, fieldName, labelWidth, labelOptions, descOptions, onChange = noop } = option;
      return (
        <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
          {labelOptions && this.createFormItemLabel(labelOptions)}
          <EpCascader
            value={form[fieldName]}
            option={option}
            onChange={(val, item, values) => {
              form[fieldName] = val;
              onChange(val, item, values);
            }}
          />
          {descOptions && this.createFormItemDesc({ fieldName, ...descOptions })}
        </el-form-item>
      );
    },
    EP_SEARCH_HELPER(option) {
      const { form } = this;
      const { label, fieldName, labelWidth, labelOptions, descOptions, options = {}, searchHelper, onChange = noop } = option;
      const { onlySelect = true } = options;
      const epSearchRef = () => this.$refs[`EP_SEARCH_HELPER-${fieldName}`];
      if (onlySelect) {
        this[`${fieldName}PrevValue`] = form[fieldName];
      }
      let fieldKeys = [...Object.keys(searchHelper.fieldAliasMap?.() ?? {}), ...Object.values(searchHelper.fieldsDefine ?? {})];
      if (!this[`${fieldName}ExtraKeys`]) {
        this[`${fieldName}ExtraKeys`] = fieldKeys.filter(x => x !== fieldName && x !== 'extra');
      }
      return (
        <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
          {labelOptions && this.createFormItemLabel(labelOptions)}
          <EpSearchHelper
            ref={`EP_SEARCH_HELPER-${fieldName}`}
            value={form[fieldName]}
            option={option}
            onClose={(data, alias) => {
              if (isObject(data) && Object.keys(alias).length) {
                const extraKeys = [];
                for (let key in alias) {
                  if (key !== 'extra') {
                    form[key] = data[alias[key]];
                    if (key !== fieldName) {
                      extraKeys.push(key);
                    } else {
                      onChange(form[key], false);
                    }
                  } else {
                    this.desc[fieldName] = data[alias[key]];
                  }
                }
                if (extraKeys.length) {
                  this[`${fieldName}ExtraKeys`] = extraKeys;
                }
              }
              if (onlySelect) {
                this[`${fieldName}PrevValue`] = form[fieldName];
              }
              epSearchRef().currentValue = form[fieldName];
              const { closed = noop } = searchHelper;
              closed(data);
              epSearchRef().visible = false;
            }}
            onOpen={() => {
              const { open = () => true } = searchHelper;
              if (!open(this.form)) return;
              epSearchRef().visible = true;
            }}
            onChange={val => {
              if (!val.trim() || !onlySelect) {
                if (Array.isArray(this[`${fieldName}ExtraKeys`]) && this[`${fieldName}ExtraKeys`].length) {
                  this[`${fieldName}ExtraKeys`].forEach(key => (form[key] = ''));
                }
                this.desc[fieldName] = '';
                this[`${fieldName}PrevValue`] = '';
                form[fieldName] = val.trim();
                onChange(form[fieldName], !onlySelect);
              } else if (val && onlySelect && val !== this[`${fieldName}PrevValue`]) {
                epSearchRef().currentValue = form[fieldName] = this[`${fieldName}PrevValue`];
              }
            }}
          />
          {descOptions && this.createFormItemDesc({ fieldName, ...descOptions })}
        </el-form-item>
      );
    },
    SEARCH_HELPER(option) {
      const { form } = this;
      const {
        label,
        fieldName,
        labelWidth,
        labelOptions,
        options = {},
        request = {},
        style = {},
        placeholder = this.t('form.inputPlaceholder'),
        clearable = !0,
        readonly,
        disabled,
        onChange = noop
      } = option;
      const { columns = [], fieldAliasMap, onlySelect = true } = options;
      if (!isFunction(fieldAliasMap)) {
        console.error('[SEARCH_HELPER] 类型的 `fieldAliasMap` 参数不正确');
      }
      return (
        <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
          {labelOptions && this.createFormItemLabel(labelOptions)}
          <el-autocomplete
            ref={`SEARCH_HELPER-${fieldName}`}
            v-model={form[fieldName]}
            popper-class="search-helper-popper"
            placeholder={!disabled ? placeholder : ''}
            clearable={clearable}
            readonly={readonly}
            disabled={disabled}
            style={{ ...style }}
            onSelect={val => {
              const alias = fieldAliasMap();
              for (let key in alias) {
                form[key] = val[alias[key]];
              }
              if (onlySelect) {
                this[`__${fieldName}__pv`] = form[fieldName];
              }
            }}
            onBlur={ev => {
              if (!onlySelect) return;
              if (ev.target.value) {
                form[fieldName] = this[`__${fieldName}__pv`];
              } else {
                this[`__${fieldName}__pv`] = '';
              }
              setTimeout(() => this[`__${fieldName}__cb`]?.([]), 300);
            }}
            onChange={onChange}
            nativeOnKeydown={ev => {
              if (ev.keyCode !== 13) return;
              this.$refs[`SEARCH_HELPER-${fieldName}`].$children[0]?.blur();
              setTimeout(() => this.enterEventHandle(ev));
            }}
            fetchSuggestions={(queryString, cb) => {
              !this[`__${fieldName}__cb`] && (this[`__${fieldName}__cb`] = cb);
              this.querySearchAsync(request, fieldName, columns, queryString, cb);
            }}
            scopedSlots={{
              default: ({ item }) => {
                return item.__isThead__
                  ? columns.map(x => (
                      <th key={x.dataIndex} width={x.width} style="pointer-events: none;">
                        <span>{x.title}</span>
                      </th>
                    ))
                  : columns.map(x => (
                      <td key={x.dataIndex}>
                        <span>{item[x.dataIndex]}</span>
                      </td>
                    ));
              }
            }}
          />
        </el-form-item>
      );
    },
    SEARCH_HELPER_WEB(option) {
      const { form } = this;
      const { label, fieldName, labelWidth, labelOptions, options = {}, style = {}, placeholder = this.t('form.inputPlaceholder'), clearable = !0, readonly, disabled, onChange = noop } = option;
      const { itemList } = options;
      return (
        <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
          {labelOptions && this.createFormItemLabel(labelOptions)}
          <el-autocomplete
            v-model={form[fieldName]}
            valueKey="text"
            placeholder={!disabled ? placeholder : ''}
            clearable={clearable}
            readonly={readonly}
            disabled={disabled}
            style={{ ...style }}
            onChange={onChange}
            fetchSuggestions={(queryString, cb) => this.querySearchHandle(fieldName, itemList, queryString, cb)}
            scopedSlots={{
              default: ({ item }) => {
                return <span>{item.text}</span>;
              }
            }}
          />
        </el-form-item>
      );
    },
    SELECT(option) {
      return this.createSelectHandle(option);
    },
    MULTIPLE_SELECT(option) {
      return this.createSelectHandle(option, true);
    },
    MULTIPLE_TAGS_SELECT(option) {
      return this.createSelectHandle({ ...option, showTags: !0 }, true);
    },
    DATE(option) {
      const { form } = this;
      const conf = {
        date: {
          placeholder: this.t('form.datePlaceholder'),
          valueFormat: 'yyyy-MM-dd HH:mm:ss'
        },
        datetime: {
          placeholder: this.t('form.datetimePlaceholder'),
          valueFormat: 'yyyy-MM-dd HH:mm:ss'
        },
        exactdate: {
          placeholder: this.t('form.datePlaceholder'),
          valueFormat: 'yyyy-MM-dd'
        },
        month: {
          placeholder: this.t('form.monthPlaceholder'),
          valueFormat: 'yyyy-MM'
        },
        year: {
          placeholder: this.t('form.yearPlaceholder'),
          valueFormat: 'yyyy'
        }
      };
      const { label, fieldName, labelWidth, labelOptions, options = {}, style = {}, clearable = !0, readonly, disabled, onChange = noop } = option;
      const { dateType = 'date', minDateTime, maxDateTime, shortCuts = !0 } = options;
      // 日期快捷键方法
      const createPicker = (picker, days) => {
        const start = new Date();
        start.setTime(start.getTime() - 3600 * 1000 * 24 * Number(days));
        picker.$emit('pick', start);
      };
      const pickers = [
        {
          text: this.t('form.datePickers')[0],
          onClick(picker) {
            createPicker(picker, 0);
          }
        },
        {
          text: this.t('form.datePickers')[1],
          onClick(picker) {
            createPicker(picker, 1);
          }
        },
        {
          text: this.t('form.datePickers')[2],
          onClick(picker) {
            createPicker(picker, 7);
          }
        },
        {
          text: this.t('form.datePickers')[3],
          onClick(picker) {
            createPicker(picker, 30);
          }
        }
      ];
      const dateReg = /^(\d{4})-?(\d{2})-?(\d{2})/;
      const dateTimeReg = /^(\d{4})-?(\d{2})-?(\d{2}) (\d{2}):?(\d{2}):?(\d{2})/;
      return (
        <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
          {labelOptions && this.createFormItemLabel(labelOptions)}
          <el-date-picker
            ref={`DATE-${fieldName}`}
            type={dateType.replace('exact', '')}
            value={form[fieldName]}
            onInput={val => {
              val = !val ? this.getDefaultStartTime(minDateTime) : val;
              form[fieldName] = this.formatDate(val, conf[dateType].valueFormat, dateType === 'datetime');
            }}
            value-format={conf[dateType].valueFormat}
            placeholder={!disabled ? conf[dateType].placeholder : ''}
            clearable={clearable}
            readonly={readonly}
            disabled={disabled}
            style={{ ...style }}
            picker-options={{
              disabledDate: time => {
                return this.setDisabledDate(time, [minDateTime, maxDateTime]);
              },
              shortcuts: shortCuts ? pickers : null
            }}
            nativeOnInput={ev => {
              let val = ev.target.value;
              if (!val) return;
              if (!/^[\d-\s\:]+$/.test(val)) {
                return (ev.target.value = this[`__${fieldName}__pv`] ?? form[fieldName] ?? '');
              }
              if (dateType === 'date' || dateType === 'exactdate') {
                val = val.replace(dateReg, '$1-$2-$3').slice(0, 10);
              }
              if (dateType === 'datetime') {
                val = val
                  .replace(dateReg, '$1-$2-$3')
                  .replace(dateTimeReg, '$1-$2-$3 $4:$5:$6')
                  .slice(0, 19);
              }
              ev.target.value = val;
              this[`__${fieldName}__pv`] = val;
              this[`__${fieldName}__inputed`] = !0;
            }}
            onBlur={C => {
              if (!this[`__${fieldName}__inputed`]) return;
              this[`__${fieldName}__inputed`] = !1;
              const currentVal = C.$el.children[0].value;
              const passed = !this.setDisabledDate(dayjs(currentVal).toDate(), [minDateTime, maxDateTime]);
              if (passed) {
                form[fieldName] = this.formatDate(currentVal, conf[dateType].valueFormat, dateType === 'datetime');
              }
              setTimeout(() => (this[`__${fieldName}__pv`] = C.$el.children[0].value));
            }}
            nativeOnKeydown={ev => {
              if (ev.keyCode === 13) {
                if (!this[`__${fieldName}__inputed`]) return;
                const currentVal = ev.target.value;
                const passed = !this.setDisabledDate(dayjs(currentVal).toDate(), [minDateTime, maxDateTime]);
                if (passed) {
                  form[fieldName] = this.formatDate(currentVal, conf[dateType].valueFormat, dateType === 'datetime');
                }
                this.$refs[`DATE-${fieldName}`].hidePicker();
                setTimeout(() => (this[`__${fieldName}__pv`] = ev.target.value));
              }
            }}
            onChange={() => onChange(form[fieldName])}
          />
        </el-form-item>
      );
    },
    RANGE_DATE(option) {
      const { form } = this;
      const conf = {
        daterange: {
          placeholder: this.t('form.daterangePlaceholder'),
          valueFormat: 'yyyy-MM-dd HH:mm:ss'
        },
        datetimerange: {
          placeholder: this.t('form.datetimerangePlaceholder'),
          valueFormat: 'yyyy-MM-dd HH:mm:ss'
        },
        exactdaterange: {
          placeholder: this.t('form.daterangePlaceholder'),
          valueFormat: 'yyyy-MM-dd'
        },
        monthrange: {
          placeholder: this.t('form.monthrangePlaceholder'),
          valueFormat: 'yyyy-MM'
        },
        yearrange: {
          placeholder: this.t('form.yearrangePlaceholder'),
          valueFormat: 'yyyy'
        }
      };
      const { label, fieldName, labelWidth, labelOptions, options = {}, style = {}, clearable = !0, readonly, disabled, onChange = noop } = option;
      const { dateType = 'daterange', minDateTime, maxDateTime, startDisabled, endDisabled, shortCuts = !0 } = options;
      const [startDate = minDateTime, endDate = maxDateTime] = form[fieldName];
      // 日期区间快捷键方法
      const createPicker = (picker, days) => {
        const end = new Date();
        const start = new Date();
        start.setTime(start.getTime() - 3600 * 1000 * 24 * Number(days));
        !endDisabled && (form[fieldName][1] = `${dayjs(end).format('YYYY-MM-DD')} 23:59:59`);
        picker.$emit('pick', start);
      };
      const pickers = [
        {
          text: this.t('form.dateRangePickers')[0],
          onClick(picker) {
            createPicker(picker, 7);
          }
        },
        {
          text: this.t('form.dateRangePickers')[1],
          onClick(picker) {
            createPicker(picker, 30);
          }
        },
        {
          text: this.t('form.dateRangePickers')[2],
          onClick(picker) {
            createPicker(picker, 90);
          }
        },
        {
          text: this.t('form.dateRangePickers')[3],
          onClick(picker) {
            createPicker(picker, 180);
          }
        }
      ];
      const dateReg = /^(\d{4})-?(\d{2})-?(\d{2})/;
      const dateTimeReg = /^(\d{4})-?(\d{2})-?(\d{2}) (\d{2}):?(\d{2}):?(\d{2})/;
      const cls = [`range-date`, { [`disabled`]: disabled }];
      return (
        <el-form-item key={fieldName} ref={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
          {labelOptions && this.createFormItemLabel(labelOptions)}
          <div class={cls} style={{ width: '100%', ...style }}>
            <el-date-picker
              ref={`RANGE_DATE-${fieldName}-start`}
              type={dateType.replace('exact', '').slice(0, -5)}
              value={form[fieldName][0]}
              onInput={val => {
                val = !val ? this.getDefaultStartTime(minDateTime) : val;
                form[fieldName] = this.formatDate([val, form[fieldName][1]], conf[dateType].valueFormat, dateType === 'datetimerange');
              }}
              pickerOptions={{
                disabledDate: time => {
                  return this.setDisabledDate(time, [minDateTime, endDate]);
                },
                shortcuts: shortCuts ? (dateType.includes('date') ? pickers : pickers.slice(1)) : null
              }}
              value-format={conf[dateType].valueFormat}
              style={{ width: `calc(50% - 7px)` }}
              placeholder={!disabled ? conf[dateType].placeholder[0] : ''}
              clearable={clearable}
              readonly={readonly}
              disabled={disabled || startDisabled}
              nativeOnInput={ev => {
                let val = ev.target.value;
                if (!val) return;
                if (!/^[\d-\s\:]+$/.test(val)) {
                  return (ev.target.value = this[`__${fieldName}_start__pv`] ?? form[fieldName][0] ?? '');
                }
                if (dateType === 'daterange' || dateType === 'exactdaterange') {
                  val = val.replace(dateReg, '$1-$2-$3').slice(0, 10);
                }
                if (dateType === 'datetimerange') {
                  val = val
                    .replace(dateReg, '$1-$2-$3')
                    .replace(dateTimeReg, '$1-$2-$3 $4:$5:$6')
                    .slice(0, 19);
                }
                ev.target.value = val;
                this[`__${fieldName}_start__pv`] = val;
                this[`__${fieldName}_start__inputed`] = !0;
              }}
              onBlur={C => {
                if (!this[`__${fieldName}_start__inputed`]) return;
                this[`__${fieldName}_start__inputed`] = !1;
                const startVal = C.$el.children[0].value;
                const passed = !this.setDisabledDate(dayjs(startVal).toDate(), [minDateTime, endDate]);
                if (passed) {
                  form[fieldName] = this.formatDate([startVal, form[fieldName][1]], conf[dateType].valueFormat, dateType === 'datetimerange');
                }
                setTimeout(() => (this[`__${fieldName}_start__pv`] = C.$el.children[0].value));
              }}
              nativeOnKeydown={ev => {
                if (ev.keyCode === 13) {
                  if (!this[`__${fieldName}_start__inputed`]) return;
                  const startVal = ev.target.value;
                  const passed = !this.setDisabledDate(dayjs(startVal).toDate(), [minDateTime, endDate]);
                  if (passed) {
                    form[fieldName] = this.formatDate([startVal, form[fieldName][1]], conf[dateType].valueFormat, dateType === 'datetimerange');
                  }
                  this.$refs[`RANGE_DATE-${fieldName}-start`].hidePicker();
                  setTimeout(() => (this[`__${fieldName}_start__pv`] = ev.target.value));
                }
              }}
              onChange={() => onChange(form[fieldName])}
            />
            <span class={disabled ? 'is-disabled' : ''} style="display: inline-block; text-align: center; width: 14px;">
              -
            </span>
            <el-date-picker
              ref={`RANGE_DATE-${fieldName}-end`}
              type={dateType.replace('exact', '').slice(0, -5)}
              value={form[fieldName][1]}
              onInput={val => {
                val = !val ? this.getDefaultEndTime(maxDateTime) : val;
                form[fieldName] = this.formatDate([form[fieldName][0], val], conf[dateType].valueFormat, dateType === 'datetimerange');
              }}
              pickerOptions={{
                disabledDate: time => {
                  return this.setDisabledDate(time, [startDate, maxDateTime]);
                }
              }}
              value-format={conf[dateType].valueFormat}
              style={{ width: `calc(50% - 7px)` }}
              placeholder={!disabled ? conf[dateType].placeholder[1] : ''}
              clearable={clearable}
              readonly={readonly}
              disabled={disabled || endDisabled}
              nativeOnInput={ev => {
                let val = ev.target.value;
                if (!val) return;
                if (!/^[\d-\s\:]+$/.test(val)) {
                  return (ev.target.value = this[`__${fieldName}_end__pv`] ?? form[fieldName][1] ?? '');
                }
                if (dateType === 'daterange' || dateType === 'exactdaterange') {
                  val = val.replace(dateReg, '$1-$2-$3').slice(0, 10);
                }
                if (dateType === 'datetimerange') {
                  val = val
                    .replace(dateReg, '$1-$2-$3')
                    .replace(dateTimeReg, '$1-$2-$3 $4:$5:$6')
                    .slice(0, 19);
                }
                ev.target.value = val;
                this[`__${fieldName}_end__pv`] = val;
                this[`__${fieldName}_end__inputed`] = !0;
              }}
              onBlur={C => {
                if (!this[`__${fieldName}_end__inputed`]) return;
                this[`__${fieldName}_end__inputed`] = !1;
                const endVal = C.$el.children[0].value;
                const passed = !this.setDisabledDate(dayjs(endVal).toDate(), [startDate, maxDateTime]);
                if (passed) {
                  form[fieldName] = this.formatDate([form[fieldName][0], endVal], conf[dateType].valueFormat, dateType === 'datetimerange');
                }
                setTimeout(() => (this[`__${fieldName}_end__pv`] = C.$el.children[0].value));
              }}
              nativeOnKeydown={ev => {
                if (ev.keyCode === 13) {
                  if (!this[`__${fieldName}_end__inputed`]) return;
                  const endVal = ev.target.value;
                  const passed = !this.setDisabledDate(dayjs(endVal).toDate(), [startDate, maxDateTime]);
                  if (passed) {
                    form[fieldName] = this.formatDate([form[fieldName][0], endVal], conf[dateType].valueFormat, dateType === 'datetimerange');
                  }
                  this.$refs[`RANGE_DATE-${fieldName}-end`].hidePicker();
                  setTimeout(() => (this[`__${fieldName}_end__pv`] = ev.target.value));
                }
              }}
              onChange={() => onChange(form[fieldName])}
            />
          </div>
        </el-form-item>
      );
    },
    EP_RANGE_DATE(option) {
      const { form } = this;
      const conf = {
        daterange: {
          placeholder: this.t('form.daterangePlaceholder'),
          valueFormat: 'yyyy-MM-dd HH:mm:ss'
        },
        datetimerange: {
          placeholder: this.t('form.datetimerangePlaceholder'),
          valueFormat: 'yyyy-MM-dd HH:mm:ss'
        },
        exactdaterange: {
          placeholder: this.t('form.daterangePlaceholder'),
          valueFormat: 'yyyy-MM-dd'
        },
        monthrange: {
          placeholder: this.t('form.monthrangePlaceholder'),
          valueFormat: 'yyyy-MM'
        },
        yearrange: {
          placeholder: this.t('form.yearrangePlaceholder'),
          valueFormat: 'yyyy'
        }
      };
      const { label, fieldName, labelWidth, labelOptions, options = {}, style = {}, clearable = !0, readonly, disabled, onChange = noop } = option;
      const { dateType = 'daterange', minDateTime, maxDateTime, shortCuts = !0, unlinkPanels = !0 } = options;
      // 日期区间快捷键方法
      const createPicker = (picker, days) => {
        const end = new Date();
        const start = new Date();
        start.setTime(start.getTime() - 3600 * 1000 * 24 * Number(days));
        picker.$emit('pick', [start, end]);
      };
      const pickers = [
        {
          text: this.t('form.dateRangePickers')[0],
          onClick(picker) {
            createPicker(picker, 7);
          }
        },
        {
          text: this.t('form.dateRangePickers')[1],
          onClick(picker) {
            createPicker(picker, 30);
          }
        },
        {
          text: this.t('form.dateRangePickers')[2],
          onClick(picker) {
            createPicker(picker, 90);
          }
        },
        {
          text: this.t('form.dateRangePickers')[3],
          onClick(picker) {
            createPicker(picker, 180);
          }
        }
      ];
      return (
        <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
          {labelOptions && this.createFormItemLabel(labelOptions)}
          <el-date-picker
            type={dateType.replace('exact', '')}
            value={form[fieldName]}
            onInput={val => {
              form[fieldName] = this.formatDate(val ?? [], conf[dateType].valueFormat, dateType === 'datetime');
            }}
            value-format={conf[dateType].valueFormat}
            range-separator={`-`}
            start-placeholder={!disabled ? conf[dateType].placeholder[0] : ''}
            end-placeholder={!disabled ? conf[dateType].placeholder[1] : ''}
            unlink-panels={unlinkPanels}
            clearable={clearable}
            readonly={readonly}
            disabled={disabled}
            style={{ ...style }}
            picker-options={{
              disabledDate: time => {
                return this.setDisabledDate(time, [minDateTime, maxDateTime]);
              },
              shortcuts: shortCuts ? pickers : null
            }}
            onChange={() => onChange(form[fieldName])}
          />
        </el-form-item>
      );
    },
    TIME(option) {
      const { form } = this;
      const { label, fieldName, labelWidth, labelOptions, options = {}, style = {}, placeholder = this.t('form.datetimePlaceholder'), clearable = !0, readonly, disabled, onChange = noop } = option;
      const { timeFormat = 'HH:mm:ss', defaultTime } = options;
      return (
        <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
          {labelOptions && this.createFormItemLabel(labelOptions)}
          <el-time-picker
            v-model={form[fieldName]}
            pickerOptions={{
              format: timeFormat
            }}
            default-value={defaultTime ? `1970-01-01 ${defaultTime}` : defaultTime}
            value-format={timeFormat}
            format={timeFormat}
            placeholder={!disabled ? placeholder : ''}
            clearable={clearable}
            readonly={readonly}
            disabled={disabled}
            style={{ ...style }}
            onChange={onChange}
          />
        </el-form-item>
      );
    },
    RANGE_TIME(option) {
      const { form } = this;
      const { label, fieldName, labelWidth, labelOptions, options = {}, style = {}, clearable = !0, readonly, disabled, onChange = noop } = option;
      const { timeFormat = 'HH:mm:ss' } = options;
      return (
        <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
          {labelOptions && this.createFormItemLabel(labelOptions)}
          <el-time-picker
            isRange={true}
            value={form[fieldName].length ? form[fieldName] : undefined}
            onInput={val => {
              form[fieldName] = val ?? [];
            }}
            pickerOptions={{
              format: timeFormat
            }}
            value-format={timeFormat}
            format={timeFormat}
            range-separator="-"
            start-placeholder={!disabled ? this.t('form.datetimerangePlaceholder')[0] : ''}
            end-placeholder={!disabled ? this.t('form.datetimerangePlaceholder')[1] : ''}
            clearable={clearable}
            readonly={readonly}
            disabled={disabled}
            style={{ ...style }}
            onChange={() => onChange(form[fieldName])}
          />
        </el-form-item>
      );
    },
    CHECKBOX(option) {
      const { form } = this;
      const { label, fieldName, labelWidth, labelOptions, descOptions, options = {}, style = {}, disabled, onChange = noop } = option;
      const { trueValue = '1', falseValue = '0' } = options;
      return (
        <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
          {labelOptions && this.createFormItemLabel(labelOptions)}
          <div style={{ display: 'inline-flex', ...style }}>
            <el-checkbox v-model={form[fieldName]} disabled={disabled} trueLabel={trueValue} falseLabel={falseValue} onChange={onChange} />
          </div>
          {descOptions && this.createFormItemDesc({ fieldName, ...descOptions })}
        </el-form-item>
      );
    },
    MULTIPLE_CHECKBOX(option) {
      const { form } = this;
      const { label, fieldName, labelWidth, labelOptions, descOptions, options = {}, style = {}, disabled, onChange = noop } = option;
      const { itemList, limit } = options;
      return (
        <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
          {labelOptions && this.createFormItemLabel(labelOptions)}
          <el-checkbox-group v-model={form[fieldName]} max={limit} disabled={disabled} style={{ ...style }} onChange={onChange}>
            {itemList.map(x => {
              return (
                <el-checkbox key={x.value} label={x.value} disabled={x.disabled}>
                  {x.text}
                </el-checkbox>
              );
            })}
          </el-checkbox-group>
          {descOptions && this.createFormItemDesc({ fieldName, ...descOptions })}
        </el-form-item>
      );
    },
    RADIO(option) {
      const { form } = this;
      const { label, fieldName, labelWidth, labelOptions, descOptions, options = {}, style = {}, disabled, onChange = noop } = option;
      const { itemList } = options;
      return (
        <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
          {labelOptions && this.createFormItemLabel(labelOptions)}
          <el-radio-group v-model={form[fieldName]} disabled={disabled} style={{ ...style }} onChange={onChange}>
            {itemList.map(x => (
              <el-radio key={x.value} label={x.value} disabled={x.disabled}>
                {x.text}
              </el-radio>
            ))}
          </el-radio-group>
          {descOptions && this.createFormItemDesc({ fieldName, ...descOptions })}
        </el-form-item>
      );
    },
    TEXT_AREA(option) {
      const { form } = this;
      const { label, fieldName, labelWidth, labelOptions, options = {}, style = {}, placeholder = this.t('form.inputPlaceholder'), clearable = !0, readonly, disabled, onChange = noop } = option;
      const { rows = 2, maxlength = 200, onClick = noop, onDblClick = noop } = options;
      return (
        <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
          {labelOptions && this.createFormItemLabel(labelOptions)}
          <el-input
            type="textarea"
            v-model={form[fieldName]}
            placeholder={!disabled ? placeholder : ''}
            clearable={clearable}
            readonly={readonly}
            disabled={disabled}
            style={{ ...style }}
            autosize={{ minRows: rows }}
            maxlength={maxlength}
            showWordLimit
            nativeOnclick={ev => {
              onClick(form[fieldName]);
            }}
            nativeOnDblclick={ev => {
              onDblClick(form[fieldName]);
            }}
            onChange={val => {
              form[fieldName] = val.trim();
              onChange(form[fieldName]);
            }}
          />
        </el-form-item>
      );
    },
    createSelectHandle(option, multiple = false) {
      const { form } = this;
      const {
        label,
        fieldName,
        labelWidth,
        labelOptions,
        descOptions,
        options = {},
        request = {},
        style = {},
        placeholder = this.t('form.selectPlaceholder'),
        showTags,
        disabled,
        clearable = !0,
        onChange = noop
      } = option;
      const { filterable = !0, openPyt = !0, limit } = options;
      const { fetchApi, params = {} } = request;
      let itemList = options.itemList || [];
      if (!options.itemList && fetchApi) {
        itemList = this[`${fieldName}ItemList`] || [];
        if (!isEqual(this[`${fieldName}PrevParams`], params)) {
          this[`${fieldName}PrevParams`] = params;
          this.querySelectOptions(request, fieldName);
        }
      }
      return (
        <el-form-item key={fieldName} label={label} labelWidth={labelWidth} prop={fieldName}>
          {labelOptions && this.createFormItemLabel(labelOptions)}
          <el-select
            ref={`SELECT-${fieldName}`}
            value={form[fieldName]}
            onInput={val => {
              if (!(multiple && filterable)) {
                form[fieldName] = val;
              } else {
                setTimeout(() => (form[fieldName] = val), 20);
              }
            }}
            multiple={multiple}
            multipleLimit={limit}
            collapseTags={!showTags && multiple}
            filterable={filterable}
            title={
              multiple
                ? itemList
                    .filter(x => form[fieldName]?.includes(x.value))
                    .map(x => x.text)
                    .join(',')
                : null
            }
            placeholder={!disabled ? placeholder : ''}
            clearable={clearable}
            disabled={disabled}
            style={{ ...style }}
            nativeOnKeydown={this.enterEventHandle}
            on-visible-change={visible => {
              if (filterable && !visible) {
                this.$refs[`SELECT-${fieldName}`].blur();
                setTimeout(() => this.filterMethodHandle(fieldName, ''), 300);
              }
            }}
            onChange={val => {
              const text = !multiple
                ? itemList.find(x => x.value === val)?.text
                : itemList
                    .filter(x => val.includes(x.value))
                    .map(x => x.text)
                    .join(',');
              onChange(val, text);
              if (!filterable) return;
              this.filterMethodHandle(fieldName, '');
            }}
            filterMethod={queryString => {
              if (!filterable) return;
              const res = this.filterMethodHandle(fieldName, queryString, openPyt);
              if (!multiple && res.length === 1) {
                this.form[fieldName] = res[0].value;
                this.$refs[`SELECT-${fieldName}`].blur();
                onChange(res[0].value, res[0].text);
              }
            }}
          >
            {itemList.map(x => (
              <el-option key={x.value} label={x.text} value={x.value} disabled={x.disabled} />
            ))}
          </el-select>
          {descOptions && this.createFormItemDesc({ fieldName, ...descOptions })}
        </el-form-item>
      );
    },
    // 下拉框的筛选方法
    filterMethodHandle(fieldName, queryString = '', isPyt) {
      const target = this.formItemList.find(x => x.fieldName === fieldName);
      const { options = {} } = target;
      const itemList = options.itemList || this[`${fieldName}ItemList`] || [];
      if (!this[`${fieldName}OriginItemList`] || !itemList.__filtered__) {
        this[`${fieldName}OriginItemList`] = itemList;
      }
      const res = queryString ? this[`${fieldName}OriginItemList`].filter(this.createSearchHelpFilter(queryString, isPyt)) : [...this[`${fieldName}OriginItemList`]];
      res.__filtered__ = true;
      if (!this[`${fieldName}ItemList`]) {
        set(target, 'options.itemList', res);
      } else {
        this[`${fieldName}ItemList`] = res;
      }
      this.$forceUpdate();
      return res;
    },
    // 获取下拉框数据
    async querySelectOptions({ fetchApi, params = {}, datakey = '', valueKey = 'value', textKey = 'text' }, fieldName) {
      if (process.env.MOCK_DATA === 'true') {
        const res = require('@/mock/sHelperData').default;
        this[`${fieldName}ItemList`] = res.data.map(x => ({ value: x[valueKey], text: x[textKey] }));
      } else {
        const res = await fetchApi(params);
        if (res.code === 200) {
          const dataList = !datakey ? res.data : get(res.data, datakey, []);
          this[`${fieldName}ItemList`] = dataList.map(x => ({ value: x[valueKey], text: x[textKey] }));
        }
      }
      this.$forceUpdate();
    },
    // 获取搜索帮助数据
    async querySearchAsync(request, fieldName, columns, queryString = '', cb) {
      const { fetchApi, params = {}, datakey = '' } = request;
      if (process.env.MOCK_DATA === 'true') {
        const res = require('@/mock/sHelperData').default;
        setTimeout(() => {
          cb(this.createSerachHelperList(res.data, columns));
        }, 500);
      } else {
        const res = await fetchApi({ ...{ [fieldName]: queryString }, ...params });
        if (res.code === 200) {
          const dataList = !datakey ? res.data : get(res.data, datakey, []);
          cb(this.createSerachHelperList(dataList, columns));
        }
      }
    },
    // 创建搜索帮助数据列表
    createSerachHelperList(list, columns) {
      const res = list.map(x => {
        const item = {};
        columns.forEach(k => {
          item[k.dataIndex] = x[k.dataIndex];
        });
        return item;
      });
      return res.length ? [{ __isThead__: !0 }, ...res] : res;
    },
    querySearchHandle(fieldName, itemList = [], queryString = '', cb) {
      const res = queryString ? itemList.filter(this.createSearchHelpFilter(queryString)) : itemList;
      cb(res);
    },
    createSearchHelpFilter(queryString, isPyt = true) {
      return state => {
        const pyt = pinyin(state.text, { style: STYLE_FIRST_LETTER })
          .flat()
          .join('');
        const str = isPyt ? `${state.text}|${pyt}` : state.text;
        return str.toLowerCase().includes(queryString.toLowerCase());
      };
    },
    // 创建树节点的值
    createInputTreeValue(fieldName, itemList) {
      return this.deepFind(itemList, this.form[fieldName])?.text ?? '';
    },
    // 树控件顶部文本帅选方法
    treeFilterTextHandle(key) {
      this.$refs[`INPUT_TREE-${key}`].filter(this[`${key}TreeFilterTexts`]);
    },
    // 树结构的筛选方法
    filterNodeHandle(value, data) {
      if (!value) return true;
      return data.text.indexOf(value) !== -1;
    },
    // 树节点单机事件
    treeNodeClickHandle(fieldName, { value, disabled }) {
      if (disabled) return;
      this.form[fieldName] = value;
      this.visible[fieldName] = false;
    },
    // 级联选择器值变化处理方法
    cascaderChangeHandle(fieldName, data) {
      this.form[fieldName] = data.map(x => x.value).join(',') || undefined;
      this[`${fieldName}CascaderText`] = data.map(x => x.text).join('/');
      // 强制重新渲染组件
      this.$forceUpdate();
    },
    createFormItem() {
      return this.list
        .filter(x => !x.hidden)
        .map(item => {
          const VNode = !this[item.type] ? null : item.render ? this.RENDER_FORM_ITEM(item) : this[item.type](item);
          if (VNode) {
            VNode['type'] = item.type;
          }
          return VNode;
        });
    },
    enterEventHandle(ev) {
      if (ev.keyCode !== 13) return;
      this.submitForm(ev);
    },
    isValidateValue(val) {
      return Array.isArray(val) ? val.length : !!val;
    },
    // 表单数据是否通过非空校验
    isPassValidate(form) {
      for (let key in this.rules) {
        if (this.rules[key].some(x => x.required) && !this.isValidateValue(form[key])) {
          return false;
        }
      }
      return true;
    },
    doFormItemValidate(fieldName) {
      this.$refs.form.validateField(fieldName);
    },
    // 处理 from 数据
    excuteFormValue(form) {
      this.formItemList
        .filter(x => ['RANGE_DATE', 'EP_RANGE_DATE', 'RANGE_INPUT_NUMBER'].includes(x.type))
        .map(x => x.fieldName)
        .forEach(fieldName => {
          if (form[fieldName].length > 0) {
            let isEmpty = form[fieldName].every(x => {
              let val = x ?? '';
              return val === '';
            });
            if (isEmpty) {
              form[fieldName] = [];
            }
          }
        });
      for (let attr in form) {
        if (form[attr] === '' || form[attr] === null) {
          form[attr] = undefined;
        }
        if (attr.includes('|') && Array.isArray(form[attr])) {
          let [start, end] = attr.split('|');
          form[start] = form[attr][0];
          form[end] = form[attr][1];
        }
      }
    },
    // 对返回数据进行格式化
    formatFormValue(form) {
      const formData = {};
      for (let key in form) {
        if (typeof form[key] !== 'undefined') continue;
        // formData[key] = '';
      }
      return cloneDeep(Object.assign({}, form, formData));
    },
    // 获取表单组件的值
    getFormData() {
      this.excuteFormValue(this.form);
      return new Promise((resolve, reject) => {
        this.$refs.form.validate((valid, fields) => {
          if (!valid) {
            reject(fields);
          } else {
            resolve(this.form);
          }
        });
      });
    },
    emitFormChange() {
      this.clearAllFocus();
      this.$emit('change', this.formatFormValue(this.form));
    },
    emitFormReset() {
      this.$emit('resetChange', this.formatFormValue(this.form));
    },
    submitForm(ev) {
      ev?.preventDefault();
      this.excuteFormValue(this.form);
      let isErr;
      this.$refs.form.validate(valid => {
        isErr = !valid;
        if (valid) {
          return this.emitFormChange();
        }
        // 校验没通过，展开
        this.expand = true;
      });
      return isErr;
    },
    resetForm() {
      this.formItemList.forEach(x => {
        if (!x.noResetable) {
          this.SET_FIELDS_VALUE({ [x.fieldName]: cloneDeep(this.initialValues[x.fieldName]) });
        }
        // 搜索帮助
        let extraKeys = this[`${x.fieldName}ExtraKeys`];
        if (Array.isArray(extraKeys) && extraKeys.length) {
          extraKeys.forEach(key => {
            this.SET_FORM_VALUES({ [key]: undefined });
          });
        }
        let descKeys = this[`${x.fieldName}DescKeys`];
        if (Array.isArray(descKeys) && descKeys.length) {
          descKeys.forEach(key => {
            this.desc[key] = undefined;
          });
        }
      });
      // this.$refs.form.resetFields();
      this.desc = Object.assign({}, this.initialExtras);
      this.excuteFormValue(this.form);
      // 解决日期区间(拆分后)重复校验的 bug
      this.$nextTick(() => {
        this.$refs.form.clearValidate();
        this.emitFormReset();
        if (this.isPassValidate(this.form)) {
          this.emitFormChange();
        }
      });
    },
    toggleHandler() {
      this.expand = !this.expand;
    },
    createButton(rows, total) {
      const { flexCols: cols, expand, showCollapse, loading, isDisabled } = this;
      const colSpan = 24 / cols;
      let offset = rows * cols - total > 0 ? rows * cols - total - 1 : 0;
      // 展开
      if (!showCollapse || expand) {
        offset = cols - (total % cols) - 1;
      }
      return this.isSubmitBtn ? (
        <el-col key="-" span={colSpan} offset={offset * colSpan} style={{ textAlign: 'right' }}>
          <el-button type="primary" icon="iconfont icon-search" loading={loading} disabled={isDisabled} onClick={this.submitForm}>
            {this.t('form.search')}
          </el-button>
          <el-button icon="iconfont icon-reload" disabled={isDisabled} onClick={this.resetForm}>
            {this.t('form.reset')}
          </el-button>
          {showCollapse ? (
            <el-button type="text" onClick={this.toggleHandler}>
              {expand ? this.t('form.collect') : this.t('form.spread')} <i class={expand ? 'el-icon-arrow-up' : 'el-icon-arrow-down'} />
            </el-button>
          ) : null}
        </el-col>
      ) : null;
    },
    createFormLayout() {
      const unfixTypes = ['MULTIPLE_TAGS_SELECT', 'TEXT_AREA'];
      const { flexCols: cols, defaultRows, expand, showCollapse } = this;
      const colSpan = 24 / cols;
      const formItems = this.createFormItem().filter(item => item !== null);
      const defaultPlayRows = defaultRows > Math.ceil(formItems.length / cols) ? Math.ceil(formItems.length / cols) : defaultRows;
      const count = expand ? formItems.length : defaultPlayRows * cols - 1;
      const colFormItems = formItems.map((vNode, i) => {
        return (
          <el-col key={i} type={unfixTypes.includes(vNode.type) ? 'UN_FIXED' : 'FIXED'} span={colSpan} style={{ display: !showCollapse || i < count ? 'block' : 'none' }}>
            {vNode}
          </el-col>
        );
      });
      return [...colFormItems, this.createButton(defaultPlayRows, formItems.length)];
    },
    // 设置日期控件的禁用状态
    setDisabledDate(oDate, [minDateTime, maxDateTime]) {
      const min = minDateTime
        ? dayjs(minDateTime)
            .toDate()
            .getTime()
        : 0;
      const max = maxDateTime
        ? dayjs(maxDateTime)
            .toDate()
            .getTime()
        : 0;
      if (min && max) {
        return !(oDate.getTime() >= min && oDate.getTime() <= max);
      }
      if (!!min) {
        return oDate.getTime() < min;
      }
      if (!!max) {
        return oDate.getTime() > max;
      }
      return false;
    },
    getDefaultStartTime(datetime) {
      const defultValue = this.defultValueOnClear ? `1900-01-01 00:00:00` : '';
      return datetime ? `${dayjs(datetime).format('YYYY-MM-DD')} 00:00:00` : defultValue;
    },
    getDefaultEndTime(datetime) {
      const defultValue = this.defultValueOnClear ? `${dayjs().format('YYYY-MM-DD')} 23:59:59` : '';
      return datetime ? `${dayjs(datetime).format('YYYY-MM-DD')} 23:59:59` : defultValue;
    },
    // 日期格式化
    formatDate(val, vf, nft) {
      const arr = Array.isArray(val) ? val : [val];
      const mType = vf.replace('yyyy', 'YYYY').replace('dd', 'DD');
      let res = arr.map((x = '', i) => {
        let item = /^[\d-\s\:]+$/.test(x) ? dayjs(x).format(mType) : '';
        if (item === 'Invalid date') {
          item = '';
        }
        if (!item) {
          let defaultDateTime = i === 0 ? this.getDefaultStartTime() : this.getDefaultEndTime();
          item = defaultDateTime ? dayjs(defaultDateTime).format(mType) : item;
        }
        if (!nft) {
          item = i === 0 ? item.replace(/\d{2}:\d{2}:\d{2}$/, '00:00:00') : item.replace(/\d{2}:\d{2}:\d{2}$/, '23:59:59');
        }
        return item;
      });
      // 日期区间类型 & 后边小于前边
      if (res.length === 2 && dayjs(res[1]).isBefore(res[0])) {
        res[1] = res[0];
      }
      if (res.every(x => !x)) {
        res = [];
      }
      return Array.isArray(val) ? res : res[0];
    },
    difference(object, base) {
      return transform(object, (result, value, key) => {
        if (!isEqual(value ?? '', base[key] ?? '')) {
          result[key] = isObject(value) && isObject(base[key]) ? this.difference(value, base[key]) : value;
        }
      });
    },
    deepFind(arr, mark) {
      let res = null;
      for (let i = 0; i < arr.length; i++) {
        if (Array.isArray(arr[i].children)) {
          res = this.deepFind(arr[i].children, mark);
        }
        if (res) {
          return res;
        }
        if (arr[i].value === mark) {
          return arr[i];
        }
      }
      return res;
    },
    // 外部通过组件实例调用的方法
    SUBMIT_FORM() {
      const err = this.submitForm();
      return !err ? this.formatFormValue(this.form) : null;
    },
    RESET_FORM() {
      this.resetForm();
    },
    VALIDATE_FIELDS(fieldNames) {
      const fields = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
      fields.forEach(fieldName => this.doFormItemValidate(fieldName));
    },
    // 设置表单项的值，参数是表单值得集合 { fieldName: val, ... }
    SET_FIELDS_VALUE(values = {}) {
      for (let key in values) {
        if (this.fieldNames.includes(key)) {
          let item = this.formItemList.find(x => x.fieldName === key);
          this.form[key] = this.getInitialValue(item, values[key]);
        }
      }
    },
    SET_FORM_VALUES(values = {}) {
      for (let key in values) {
        if (this.fieldNames.includes(key)) {
          this.SET_FIELDS_VALUE({ [key]: values[key] });
        } else {
          this.form[key] = values[key];
        }
      }
    },
    CREATE_FOCUS(fieldName) {
      const formItem = this.formItemList.find(x => x.fieldName === fieldName);
      if (!formItem) return;
      this.$refs[`${formItem.type}-${fieldName}`]?.focus();
    },
    async GET_FORM_DATA() {
      try {
        const res = await this.getFormData();
        return [false, this.formatFormValue(res)];
      } catch (err) {
        return [true, null];
      }
    },
    GET_FIELD_VALUE(fieldName) {
      return this.form[fieldName];
    }
  },
  render() {
    const { form, rules, labelWidth, isLabelErrorColor } = this;
    const prefixCls = this.getPrefixCls('top-filter');
    const cls = {
      [prefixCls]: true,
      [`${prefixCls}-sm`]: this.currentSize === 'small',
      [`${prefixCls}-lg`]: this.currentSize === 'large',
      [`required-label-color`]: isLabelErrorColor
    };
    const wrapProps = {
      props: {
        model: form,
        rules,
        labelWidth: labelWidth > 0 ? `${labelWidth}px` : labelWidth
      },
      nativeOn: {
        submit: ev => ev.preventDefault()
      }
    };
    return (
      <div class={cls}>
        <el-form ref="form" {...wrapProps}>
          <el-row gutter={4}>{this.createFormLayout()}</el-row>
        </el-form>
      </div>
    );
  }
};
