/*
 * @Author: 焦质晔
 * @Date: 2020-03-05 10:27:24
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-06-24 18:48:22
 */
import { deepFindRowKey, isArrayContain } from '../utils';
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
      let result = [];
      if (!target) {
        return result;
      }
      const childRowKeys = this.getAllChildRowKeys(target.children ?? []);
      const parentRowKeys = this.findParentRowKeys(deriveRowKeys, key);
      // 处理后代节点
      result = [...new Set([...arr, ...childRowKeys])];
      // 处理祖先节点
      parentRowKeys.forEach(x => {
        const target = deepFindRowKey(deriveRowKeys, x);
        const isContain = isArrayContain(
          result,
          target.children.map(k => k.rowKey)
        );
        if (isContain) {
          result = [...result, x];
        } else {
          result = result.filter(k => k !== x);
        }
      });
      return result;
    },
    createSelectionRows(selectedKeys) {
      const { allTableData, allRowKeys, selectionRows, getRowKey, isFetch } = this;
      if (isFetch) {
        return [
          ...selectionRows.filter(row => selectedKeys.includes(getRowKey(row, row.index))),
          ...allTableData.filter(row => {
            let rowKey = getRowKey(row, row.index);
            return selectedKeys.includes(rowKey) && selectionRows.findIndex(row => getRowKey(row, row.index) === rowKey) === -1;
          })
        ];
      }
      return selectedKeys.map(x => {
        let index = allRowKeys.findIndex(key => key === x);
        return allTableData[index];
      });
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
      this.selectionRows = this.createSelectionRows(selectedKeys);
      return selectedKeys;
    }
  }
};

export default selectionMixin;
