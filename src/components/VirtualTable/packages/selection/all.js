/*
 * @Author: 焦质晔
 * @Date: 2020-03-06 21:30:12
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-05-15 11:19:24
 */
import { intersection, xor } from 'lodash';
import Checkbox from '../checkbox';
import { getAllTableData } from '../utils';

const noop = () => {};

export default {
  name: 'AllSelection',
  props: ['selectionKeys'],
  inject: ['$$table'],
  computed: {
    filterAllRowKeys() {
      const { tableFullData, getRowKey, rowSelection } = this.$$table;
      const { disabled = noop } = rowSelection;
      return getAllTableData(tableFullData)
        .filter(row => !disabled(row))
        .map(row => getRowKey(row, row.index));
    },
    indeterminate() {
      return this.selectionKeys.length > 0 && intersection(this.selectionKeys, this.filterAllRowKeys).length < this.filterAllRowKeys.length;
    },
    selectable() {
      return !this.indeterminate && this.selectionKeys.length > 0;
    }
  },
  methods: {
    changeHandle(val) {
      const { selectionKeys, filterAllRowKeys } = this;
      this.$$table.selectionKeys = val ? [...new Set([...selectionKeys, ...filterAllRowKeys])] : xor(selectionKeys, filterAllRowKeys);
    }
  },
  render() {
    return <Checkbox indeterminate={this.indeterminate} value={this.selectable} onInput={this.changeHandle} />;
  }
};
