/*
 * @Author: 焦质晔
 * @Date: 2020-03-06 21:30:12
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-06-23 15:22:13
 */
import { cloneDeep, get, intersection, union, xor } from 'lodash';
import Checkbox from '../checkbox';

const noop = () => {};

export default {
  name: 'AllSelection',
  props: ['selectionKeys'],
  inject: ['$$table'],
  computed: {
    filterAllRowKeys() {
      const { allTableData, getRowKey, rowSelection } = this.$$table;
      const { disabled = noop } = rowSelection;
      return allTableData.filter(row => !disabled(row)).map(row => getRowKey(row, row.index));
    },
    indeterminate() {
      return this.selectionKeys.length > 0 && intersection(this.selectionKeys, this.filterAllRowKeys).length < this.filterAllRowKeys.length;
    },
    selectable() {
      return !this.indeterminate && this.selectionKeys.length > 0;
    }
  },
  methods: {
    async getAllSelectionKeys() {
      const { fetchParams, getRowKey } = this.$$table;
      let rowKeys = [];
      if (process.env.MOCK_DATA === 'true') {
        const { data } = cloneDeep(require('@/mock/tableData').default);
        rowKeys = data.items.map((row, index) => getRowKey(row, index));
      } else {
        const { fetchAllRowKeys: fetch } = this.$$table.rowSelection;
        this.$$table.showLoading = !0;
        try {
          const res = await fetch.api(fetchParams);
          if (res.code === 200) {
            rowKeys = Array.isArray(res.data) ? res.data : get(res.data, fetch.dataKey) ?? [];
          }
        } catch (err) {}
        this.$$table.showLoading = !1;
      }
      return rowKeys;
    },
    async changeHandle(val) {
      const { selectionKeys, filterAllRowKeys } = this;
      const { rowSelection } = this.$$table;
      if (rowSelection.fetchAllRowKeys) {
        this.$$table.selectionKeys = val ? await this.getAllSelectionKeys() : [];
      } else {
        this.$$table.selectionKeys = val ? union(selectionKeys, filterAllRowKeys) : selectionKeys.filter(x => !filterAllRowKeys.includes(x));
      }
    }
  },
  render() {
    return <Checkbox indeterminate={this.indeterminate} disabled={!this.filterAllRowKeys.length} value={this.selectable} onInput={this.changeHandle} />;
  }
};
