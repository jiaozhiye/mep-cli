/*
 * @Author: 焦质晔
 * @Date: 2020-05-12 13:07:13
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-04-03 14:23:03
 */
import addEventListener from 'add-dom-event-listener';
import Spin from '../Spin';
import TopFilter from '../TopFilter';
import VirtualTable from '../VirtualTable';

import { merge, cloneDeep, get, isFunction } from 'lodash';
import { getParentNode, debounce, sleep } from '../_utils/tool';
import PropTypes from '../_utils/vue-types';

import Locale from '../_utils/mixins/locale';
import Size from '../_utils/mixins/size';

const noop = () => {};
const trueNoop = () => !0;

export default {
  name: 'SearchHelper',
  mixins: [Locale, Size],
  props: {
    name: PropTypes.string, // tds
    filters: PropTypes.arrayOf(PropTypes.shape({ fieldName: PropTypes.string }).loose).def([]),
    initialValue: PropTypes.object.def({}),
    showFilterCollapse: PropTypes.bool.def(true),
    table: PropTypes.shape({
      columns: PropTypes.array.def([]),
      rowKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).def('uid'),
      fetch: PropTypes.object.isRequired,
      showAlert: PropTypes.bool.def(true),
      webPagination: PropTypes.bool.def(false)
    }),
    fieldAliasMap: PropTypes.func.def(noop),
    beforeFetch: PropTypes.func,
    dataIndex: PropTypes.string,
    callback: PropTypes.func,
    fieldsDefine: PropTypes.object.def({}), // tds
    getServerConfig: PropTypes.func // tds
  },
  data() {
    const { fetch, showAlert = !0, webPagination = !1 } = this.table;
    // tds
    this.DEFINE = ['valueName', 'displayName', 'descriptionName'];
    return {
      result: null,
      topFilters: this.createTopFilters(),
      height: 300,
      columns: this.createTableColumns(),
      tableList: [],
      selection: {
        type: 'radio',
        defaultSelectFirstRow: !0,
        onChange: this.selectedRowChange
      },
      fetch: {
        api: fetch.api,
        params: merge({}, fetch.params, this.formatParams(this.initialValue)),
        beforeFetch: fetch.beforeFetch || trueNoop,
        xhrAbort: fetch.xhrAbort || !1,
        dataKey: fetch.dataKey
      },
      showAlert,
      webPagination,
      loading: false,
      alias: this.fieldAliasMap() || {}
    };
  },
  computed: {
    $topFilter() {
      return this.$refs.topFilter;
    },
    $vTable() {
      return this.$refs.vTable;
    },
    disabled() {
      return !this.result;
    }
  },
  created() {
    this.getHelperConfig();
    this.getTableData();
  },
  mounted() {
    this.resizeEvent = addEventListener(window, 'resize', debounce(this.resizeEventHandle, 0));
    this.$nextTick(() => this.resizeEventHandle());
  },
  destroyed() {
    this.resizeEvent && this.resizeEvent.remove();
  },
  methods: {
    async getHelperConfig() {
      if (!this.getServerConfig) return;
      if (!this.name) {
        return console.error(`[SearchHelper]: 从服务端获取配置信息的时候，name 为必选参数.`);
      }
      this.loading = true;
      if (process.env.MOCK_DATA === 'true') {
        const mockFilters = [
          {
            type: 'INPUT',
            label: '条件1',
            fieldName: 'x1'
          },
          {
            type: 'SELECT',
            label: '条件2',
            fieldName: 'x2',
            refListName: 'sex'
          }
        ];
        const mockColumns = [
          {
            title: '姓名',
            dataIndex: 'person.name'
          },
          {
            title: '性别',
            dataIndex: 'person.sex',
            refListName: 'sex'
          }
        ];
        await sleep(500);
        // 设置 topFilters、columns
        this.topFilters = this.createTopFilters(mockFilters);
        this.columns = this.createTableColumns(mockColumns);
        // 设置 alias
        let target = {};
        for (let key in this.fieldsDefine) {
          if (!this.DEFINE.includes(key)) continue;
          target[this.fieldsDefine[key]] = 'address';
        }
        this.alias = Object.assign({}, target);
      } else {
        try {
          const res = await this.getServerConfig({ name: this.name });
          if (res.code === 200) {
            const { data } = res;
            // 设置 topFilters、columns
            this.topFilters = this.createTopFilters(data.filters);
            this.columns = this.createTableColumns(data.columns);
            // 设置 alias
            let target = {};
            for (let key in this.fieldsDefine) {
              if (!this.DEFINE.includes(key)) continue;
              target[this.fieldsDefine[key]] = data[key];
            }
            this.alias = Object.assign({}, target);
          }
        } catch (e) {}
      }
      this.loading = false;
    },
    createTableColumns(vals = []) {
      return [
        {
          title: this.t('searchHelper.orderIndex'),
          dataIndex: 'index',
          width: 80,
          render: text => {
            return text + 1;
          }
        },
        ...(this.table.columns || []),
        ...vals.map(x => {
          let dict = x.refListName ? this.createDictList(x.refListName) : [];
          return {
            ...x,
            sorter: true,
            filter: {
              type: x.type ?? 'text',
              items: dict
            },
            dictItems: dict
          };
        })
      ];
    },
    createTopFilters(vals = []) {
      return [
        ...(this.filters || []),
        ...vals.map(x => {
          let option = x.refListName ? { options: { itemList: this.createDictList(x.refListName) } } : null;
          return {
            ...x,
            ...option
          };
        })
      ];
    },
    formatParams(val) {
      const { name, getServerConfig, beforeFetch = k => k } = this;
      val = beforeFetch(val);
      // tds 搜索条件的参数规范
      if (name && isFunction(getServerConfig)) {
        val = { name, condition: val };
      }
      return val;
    },
    filterChangeHandle(val) {
      const params = this.table.fetch?.params ?? {};
      val = this.formatParams(val);
      this.fetch.xhrAbort = !1;
      this.fetch.params = merge({}, params, val);
      // 内存分页，获取数据
      this.getTableData();
    },
    async getTableData() {
      if (!this.webPagination || !this.fetch.api) return;
      if (!this.fetch.beforeFetch(this.fetch.params) || this.fetch.xhrAbort) return;
      // console.log(`ajax 请求参数：`, this.fetch.params);
      this.loading = true;
      if (process.env.MOCK_DATA === 'true') {
        await sleep(500);
        const { data } = cloneDeep(require('@/mock/tableData').default);
        this.tableList = data.items;
      } else {
        const res = await this.fetch.api(this.fetch.params);
        if (res.code === 200) {
          this.$vTable.CLEAR_TABLE_DATA();
          this.tableList = Array.isArray(res.data) ? res.data : get(res.data, this.fetch.dataKey) ?? [];
        }
      }
      this.loading = false;
    },
    collapseHandle() {
      this.$nextTick(() => this.calcTableHeight());
    },
    selectedRowChange(keys, rows) {
      this.result = rows.length ? rows[0] : null;
    },
    dbClickHandle(row) {
      this.result = row;
      this.confirmHandle();
    },
    rowEnterHandle(row) {
      if (!row) return;
      this.dbClickHandle(row);
    },
    confirmHandle() {
      const tableData = this.createTableData();
      if (this.callback) {
        Array.isArray(tableData) && this.callback(...tableData);
      }
      this.cancelHandle(this.result);
    },
    cancelHandle(data) {
      this.$emit('close', false, data, this.alias);
    },
    createDictList(code) {
      let $dict = JSON.parse(localStorage.getItem('dict')) || {};
      let res = [];
      if ($dict && Array.isArray($dict[code])) {
        res = $dict[code].map(x => ({ text: x.cnText, value: x.value }));
      }
      return res;
    },
    createTableData() {
      if (!Object.keys(this.alias).length) return;
      let others = {};
      let current;
      for (let dataIndex in this.alias) {
        let dataKey = this.alias[dataIndex];
        if (dataIndex !== this.dataIndex) {
          others[dataIndex] = this.result[dataKey];
        } else {
          current = this.result[dataKey];
        }
      }
      return [current, others];
    },
    calcTableHeight() {
      const ftHeight = {
        large: 56,
        default: 52,
        small: 48
      };
      const containerHeight = window.innerHeight - getParentNode(this.$el, 'el-dialog')?.offsetTop * 2 - 50 - ftHeight[this.currentSize];
      this.height = containerHeight - this.$topFilter.$el.offsetHeight - 94;
    },
    resizeEventHandle() {
      this.calcTableHeight();
    }
  },
  render() {
    const { loading, initialValue, topFilters, showFilterCollapse, height, columns, selection, tableList, fetch, showAlert, webPagination, disabled } = this;
    const tableProps = { props: !webPagination ? { fetch } : { dataSource: tableList, webPagination: !0 } };
    return (
      <div>
        <Spin spinning={loading} tip="Loading...">
          <TopFilter
            ref="topFilter"
            initialValue={initialValue}
            list={topFilters}
            isAutoFocus={false}
            isCollapse={showFilterCollapse}
            onChange={this.filterChangeHandle}
            onCollapseChange={this.collapseHandle}
          />
          <VirtualTable
            ref="vTable"
            height={height}
            columns={columns}
            {...tableProps}
            rowKey={this.table.rowKey}
            rowSelection={selection}
            showAlert={showAlert}
            columnsChange={columns => (this.columns = columns)}
            onRowEnter={this.rowEnterHandle}
            onRowDblclick={this.dbClickHandle}
          />
        </Spin>
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
          <el-button onClick={() => this.cancelHandle()}>{this.t('searchHelper.close')}</el-button>
          <el-button type="primary" onClick={() => this.confirmHandle()} disabled={disabled}>
            {this.t('searchHelper.confirm')}
          </el-button>
        </div>
      </div>
    );
  }
};
