/*
 * @Author: 焦质晔
 * @Date: 2020-03-05 10:27:24
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-01-12 16:10:05
 */
import { uniqWith } from 'lodash';
import { deepFindRowKey, tableDataFlatMap, isArrayContain } from '../utils';
import config from '../config';

const selectionMixin = {
  methods: {
    // 创建选择列
    createSelectionColumn(options) {
      if (!options) {
        return null;
      }
      const { type } = options;
      return {
        dataIndex: '__selection__',
        title: type === 'radio' ? config.selectionText() : '',
        width: 50,
        fixed: 'left',
        type
      };
    },
    createTreeSelectionKeys(key, arr) {
      const { deriveRowKeys } = this;
      const target = deepFindRowKey(deriveRowKeys, key);
      const childRowKeys = this.getAllChildRowKeys(target.children ?? []);
      const parentRowKeys = this.findParentRowKeys(deriveRowKeys, key);
      // 处理后代节点
      arr = [...new Set([...arr, ...childRowKeys])];
      // 处理祖先节点
      parentRowKeys.forEach(x => {
        const target = deepFindRowKey(deriveRowKeys, x);
        const isContain = isArrayContain(
          arr,
          target.children.map(k => k.rowKey)
        );
        if (isContain) {
          arr = [...arr, x];
        } else {
          arr = arr.filter(k => k !== x);
        }
      });
      return arr;
    },
    createSelectionRows(selectedKeys) {
      const { tableFullData, tableData, selectionRows, getRowKey, isFetch } = this;
      const uniqRecords = isFetch ? uniqWith([...selectionRows, ...tableData], (a, b) => getRowKey(a, a.index) === getRowKey(b, b.index)) : tableFullData;
      this.selectionRows = tableDataFlatMap(uniqRecords).filter(row => selectedKeys.includes(getRowKey(row, row.index)));
    },
    // 选择列已选中 keys
    createSelectionKeys(keys) {
      const { rowSelection, selectionKeys, isTreeTable } = this;
      const { type, checkStrictly = !0 } = rowSelection || {};
      const rowSelectionKeys = Array.isArray(keys) ? keys : selectionKeys;
      let result = [];
      if (isTreeTable && !checkStrictly) {
        rowSelectionKeys.forEach(x => {
          result.push(...this.createTreeSelectionKeys(x, rowSelectionKeys));
        });
      }
      const selectedKeys = type === 'radio' ? rowSelectionKeys.slice(0, 1) : [...new Set([...rowSelectionKeys, ...result])];
      this.createSelectionRows(selectedKeys);
      return selectedKeys;
    }
  }
};

export default selectionMixin;
