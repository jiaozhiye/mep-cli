/*
 * @Author: 焦质晔
 * @Date: 2020-07-12 16:26:19
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-12-23 17:59:38
 */
import localforage from 'localforage';
import { isBracketBalance } from '../filter-sql';
import { hasOwn, createUidKey, createWhereSQL } from '../utils';
import { getConfig } from '../../../_utils/globle-config';
import config from '../config';
import Locale from '../locale/mixin';

import VTable from '../table';
import EmptyEle from '../empty/element';

export default {
  name: 'HighSearchSetting',
  mixins: [Locale],
  props: ['columns'],
  inject: ['$$table'],
  data() {
    this.fieldDicts = this.columns.filter(column => !!column.filter).map(x => ({ value: x.dataIndex, text: x.title }));
    this.logicDicts = [
      { value: 'and', text: this.t('table.highSearch.andText') },
      { value: 'or', text: this.t('table.highSearch.orText') }
    ];
    return {
      loading: !1,
      searchColumns: this.createVTableColumns(),
      list: [], // 初始数据
      currentData: [],
      savedItems: [],
      currentKey: '',
      form: { name: '' }
    };
  },
  computed: {
    $$vTable() {
      return this.$refs[`search`];
    },
    highSearchKey() {
      return this.$$table.uniqueKey ? `search_${this.$$table.uniqueKey}` : '';
    },
    filterColumns() {
      return this.columns.filter(column => !!column.filter);
    },
    query() {
      return createWhereSQL(this.currentData);
    },
    confirmDisabled() {
      return !(this.query && isBracketBalance(this.query));
    }
  },
  watch: {
    currentKey(next) {
      if (next) {
        this.list = this.savedItems.find(x => x.value === next).list;
      } else {
        this.list = [];
      }
    }
  },
  async created() {
    if (!this.highSearchKey) return;
    let res = await localforage.getItem(this.highSearchKey);
    if (!res) {
      res = await this.getHighSearchConfig(this.highSearchKey);
      if (Array.isArray(res)) {
        await localforage.setItem(this.highSearchKey, res);
      }
    }
    if (Array.isArray(res) && res.length) {
      this.savedItems = res;
      this.currentKey = res[0].value;
    }
  },
  methods: {
    findColumn(dataIndex) {
      return this.searchColumns.find(x => x.dataIndex === dataIndex);
    },
    createVTableColumns() {
      return [
        {
          title: '操作',
          dataIndex: '__action__',
          fixed: 'left',
          width: 80,
          render: (text, row) => {
            return (
              <div>
                <el-button
                  type="text"
                  onClick={() => {
                    this.$$vTable.REMOVE_RECORDS(row);
                  }}
                >
                  {this.t('table.highSearch.removeText')}
                </el-button>
              </div>
            );
          }
        },
        {
          title: '括号',
          dataIndex: 'bracket_left',
          align: 'right',
          width: 80,
          render: (text, row) => {
            return <span style={{ fontSize: '20px' }}>{text}</span>;
          }
        },
        {
          title: '字段名',
          dataIndex: 'fieldName',
          required: true,
          editRender: row => {
            return {
              type: 'select',
              editable: true,
              items: this.fieldDicts,
              rules: [{ required: true, message: '字段名不能为空' }],
              onChange: (cell, row) => {
                let dataIndex = Object.values(cell)[0];
                let filterType = this.filterColumns.find(x => x.dataIndex === dataIndex)?.filter.type;
                let expressionItems = this.getExpressionHandle(filterType);
                // 重置 字段类型
                row[`fieldType`] = filterType;
                // 重置 运算
                row[`expression`] = dataIndex ? expressionItems[0]?.value : '';
                // 重置 条件值
                row[`condition`] = this.isMultipleSelect(row[`expression`]) ? [] : '';
                // 重置 括号
                if (!dataIndex) {
                  row[`bracket_left`] = row[`bracket_right`] = '';
                }
              }
            };
          }
        },
        {
          title: '字段类型',
          dataIndex: 'fieldType',
          width: 100,
          hidden: true
        },
        {
          title: '运算',
          dataIndex: 'expression',
          width: 120,
          required: true,
          editRender: row => {
            let filterType = this.filterColumns.find(x => x.dataIndex === row[`fieldName`])?.filter.type;
            return {
              type: 'select',
              editable: true,
              items: this.getExpressionHandle(filterType),
              extra: {
                disabled: !row[`fieldName`],
                clearable: false
              },
              onChange: (cell, row) => {
                // 重置 条件值
                row[`condition`] = this.isMultipleSelect(row[`expression`]) ? [] : '';
              }
            };
          }
        },
        {
          title: '条件值',
          dataIndex: 'condition',
          width: 160,
          editRender: row => {
            let column = this.filterColumns.find(x => x.dataIndex === row[`fieldName`]);
            let filterType = column?.filter.type;
            let dictItems = column?.filter?.items ?? column?.dictItems ?? [];
            return {
              type: this.getConditionType(filterType, this.isMultipleSelect(row[`expression`])),
              editable: true,
              items: dictItems,
              extra: {
                disabled: !row[`fieldName`]
              }
            };
          }
        },
        {
          title: '括号',
          dataIndex: 'bracket_right',
          width: 80,
          render: (text, row) => {
            return <span style={{ fontSize: '20px' }}>{text}</span>;
          }
        },
        {
          title: '逻辑',
          dataIndex: 'logic',
          width: 90,
          required: true,
          editRender: row => {
            return {
              type: 'select',
              editable: true,
              items: this.logicDicts,
              extra: {
                disabled: !row[`fieldName`],
                clearable: false
              }
            };
          }
        }
      ];
    },
    isMultipleSelect(type) {
      return ['in', 'nin'].includes(type);
    },
    getConditionType(type, isMultiple) {
      let __type__ = '';
      switch (type) {
        case 'number':
          __type__ = 'number';
          break;
        case 'date':
          __type__ = 'date';
          break;
        case 'checkbox':
        case 'radio':
          __type__ = isMultiple ? 'select-multiple' : 'select';
          break;
        case 'text':
        default:
          __type__ = 'text';
          break;
      }
      return __type__;
    },
    getExpressionHandle(type) {
      let result = [];
      switch (type) {
        case 'date':
        case 'number':
          result = [
            { value: '>', text: this.t('table.highSearch.gtText') },
            { value: '<', text: this.t('table.highSearch.ltText') },
            { value: '>=', text: this.t('table.highSearch.gteText') },
            { value: '<=', text: this.t('table.highSearch.lteText') },
            { value: '==', text: this.t('table.highSearch.eqText') },
            { value: '!=', text: this.t('table.highSearch.neqText') }
          ];
          break;
        case 'checkbox':
        case 'radio':
          result = [
            { value: 'in', text: this.t('table.highSearch.inText') },
            { value: 'nin', text: this.t('table.highSearch.ninText') },
            { value: '==', text: this.t('table.highSearch.eqText') },
            { value: '!=', text: this.t('table.highSearch.neqText') }
          ];
          break;
        case 'text':
        default:
          result = [
            { value: 'like', text: this.t('table.highSearch.likeText') },
            { value: '==', text: this.t('table.highSearch.eqText') },
            { value: '!=', text: this.t('table.highSearch.neqText') }
          ];
          break;
      }
      return result;
    },
    insertRowsHandle() {
      this.$$vTable.INSERT_RECORDS({ logic: 'and' });
    },
    toggleBracket(row, column) {
      const { dataIndex } = column;
      if (!row[`fieldName`]) return;
      if (dataIndex === 'bracket_left') {
        row[dataIndex] = !row[dataIndex] ? '(' : '';
      }
      if (dataIndex === 'bracket_right') {
        row[dataIndex] = !row[dataIndex] ? ')' : '';
      }
    },
    toggleHandle(key) {
      this.currentKey = key !== this.currentKey ? key : '';
    },
    async saveConfigHandle() {
      if (!this.highSearchKey) {
        return console.error('[Table]: 必须设置组件参数 `uniqueKey` 才能保存');
      }
      const title = this.form.name;
      const uuid = createUidKey();
      this.savedItems.push({
        text: title,
        value: uuid,
        list: this.currentData.filter(x => !!x.fieldName)
      });
      this.currentKey = uuid;
      await localforage.setItem(this.highSearchKey, this.savedItems);
      await this.saveHighSearchConfig(this.highSearchKey, this.savedItems);
    },
    async getHighSearchConfig(key) {
      if (process.env.MOCK_DATA === 'true') return;
      const fetchFn = getConfig('getComponentConfigApi');
      if (!fetchFn) return;
      try {
        const res = await fetchFn({ key });
        if (res.code === 200) {
          return res.data;
        }
      } catch (err) {}
      return null;
    },
    async saveHighSearchConfig(key, value) {
      if (process.env.MOCK_DATA === 'true') return;
      const fetchFn = getConfig('saveComponentConfigApi');
      if (!fetchFn) return;
      try {
        await fetchFn({ [key]: value });
      } catch (err) {}
    },
    async removeSavedHandle(ev, key) {
      ev.stopPropagation();
      if (!key) return;
      const index = this.savedItems.findIndex(x => x.value === key);
      this.savedItems.splice(index, 1);
      if (key === this.currentKey) {
        this.currentKey = '';
      }
      await localforage.setItem(this.highSearchKey, this.savedItems);
      await this.saveHighSearchConfig(this.highSearchKey, this.savedItems);
    },
    confirmHandle() {
      const { clearTableFilter, createSuperSearch, fetch } = this.$$table;
      this.loading = !0;
      if (hasOwn(fetch ?? {}, 'xhrAbort')) {
        this.$$table.fetch.xhrAbort = !1;
      }
      clearTableFilter();
      createSuperSearch(this.currentData);
      this.$nextTick(() => this.$$table.$refs[`tableHeader`]?.filterHandle());
      setTimeout(() => this.cancelHandle(), 200);
    },
    cancelHandle() {
      this.loading = !1;
      this.$emit('close', false);
    }
  },
  render() {
    const { list, searchColumns, form, savedItems, currentKey, query, confirmDisabled, loading } = this;
    return (
      <div class="v-high-search--setting">
        <div class="main">
          <div class="container">
            <VTable
              ref="search"
              height={300}
              dataSource={list}
              columns={searchColumns}
              showFullScreen={false}
              showColumnDefine={false}
              rowKey={record => record.index}
              columnsChange={columns => (this.searchColumns = columns)}
              onRowClick={this.toggleBracket}
              onDataChange={tableData => {
                this.currentData = tableData;
              }}
            >
              <template slot="default">
                <el-button type="primary" icon="el-icon-plus" onClick={this.insertRowsHandle} style={{ marginRight: '-10px' }} />
              </template>
            </VTable>
            {config.highSearch.showSQL && query && <code class="lang-js">{query}</code>}
          </div>
          <div class="saved line">
            <div class="form-wrap">
              <el-input class="form-item" placeholder={this.t('table.highSearch.configText')} disabled={confirmDisabled} value={form.name} onInput={val => (this.form.name = val)} />
              <el-button type="primary" disabled={!form.name} style={{ marginLeft: '10px' }} onClick={() => this.saveConfigHandle()}>
                {this.t('table.highSearch.saveButton')}
              </el-button>
            </div>
            <div class="card-wrap">
              <h5 style={{ height: `${config.rowHeightMaps[this.$$table.tableSize]}px` }}>
                <span>{this.t('table.highSearch.savedSetting')}</span>
              </h5>
              <ul>
                {savedItems.map(x => (
                  <li class={x.value === currentKey && 'selected'} onClick={() => this.toggleHandle(x.value)}>
                    <span class="title">
                      <i class={['iconfont', x.value === currentKey ? 'icon-check' : 'icon-file']} />
                      <span>{x.text}</span>
                    </span>
                    <i class="iconfont icon-close-circle close" title={this.t('table.highSearch.removeText')} onClick={ev => this.removeSavedHandle(ev, x.value)} />
                  </li>
                ))}
                {!savedItems.length && (
                  <div style={{ padding: '10px' }}>
                    <EmptyEle />
                  </div>
                )}
              </ul>
            </div>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            right: 0,
            zIndex: 9,
            borderTop: '1px solid #d9d9d9',
            padding: '10px 15px',
            background: '#fff',
            textAlign: 'right'
          }}
        >
          <el-button onClick={() => this.cancelHandle()}>{this.t('table.highSearch.closeButton')}</el-button>
          <el-button type="primary" loading={loading} disabled={confirmDisabled} onClick={() => this.confirmHandle()}>
            {this.t('table.highSearch.searchButton')}
          </el-button>
        </div>
      </div>
    );
  }
};
