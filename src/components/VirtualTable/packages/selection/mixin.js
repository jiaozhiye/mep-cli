/*
 * @Author: 焦质晔
 * @Date: 2020-03-05 10:27:24
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-10-21 08:50:48
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
    // 选择列已选中 keys
    createSelectionKeys() {
      const { rowSelection, isTreeTable } = this;
      const { type, checkStrictly = !0, selectedRowKeys = [] } = rowSelection || {};
      let result = [];
      if (isTreeTable && !checkStrictly) {
        selectedRowKeys.forEach(x => {
          result.push(...this.createTreeSelectionKeys(x, selectedRowKeys));
        });
      }
      return type === 'radio' ? selectedRowKeys.slice(0, 1) : [...new Set([...selectedRowKeys, ...result])];
    }
  }
};

export default selectionMixin;
