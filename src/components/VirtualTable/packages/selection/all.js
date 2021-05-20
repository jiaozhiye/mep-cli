/*
 * @Author: 焦质晔
 * @Date: 2020-03-06 21:30:12
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-05-20 10:37:21
 */
import { intersection, union, xor } from 'lodash';
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
    changeHandle(val) {
      const { selectionKeys, filterAllRowKeys } = this;
      this.$$table.selectionKeys = val ? union(selectionKeys, filterAllRowKeys) : selectionKeys.filter(x => !filterAllRowKeys.includes(x));
    }
  },
  render() {
    return <Checkbox indeterminate={this.indeterminate} value={this.selectable} onInput={this.changeHandle} />;
  }
};
