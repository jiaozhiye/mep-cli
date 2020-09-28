/*
 * @Author: 焦质晔
 * @Date: 2020-03-05 10:27:24
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-09-22 10:20:10
 */
const expandableMixin = {
  methods: {
    // 创建展开列
    createExpandableColumn(options) {
      if (!options) {
        return null;
      }
      return {
        dataIndex: '__expandable__',
        title: '',
        width: 50,
        fixed: 'left',
        type: 'expand'
      };
    },
    createDeriveRowKeys(arr, key) {
      return arr.map((x, i) => {
        let rowKey = this.getRowKey(x, i);
        let item = { rowKey };
        if (x.children) {
          item.children = this.createDeriveRowKeys(x.children, rowKey);
        }
        return key ? Object.assign({}, item, { parentRowKey: key }) : item;
      });
    },
    findParentRowKeys(arr, key) {
      let result = [];
      arr.forEach(x => {
        if (x.children) {
          result.push.apply(result, this.findParentRowKeys(x.children, key));
        }
        if (x.rowKey === key && x.parentRowKey) {
          result.push(x.parentRowKey);
        }
      });
      if (result.length) {
        result.push.apply(result, this.findParentRowKeys(arr, result[result.length - 1]));
      }
      return result;
    },
    // 展开行，已展开的 keys
    createRowExpandedKeys() {
      const { expandable, selectionKeys, allRowKeys, isTreeTable } = this;
      const result = [];
      // 树结构 + 有选中
      if (isTreeTable && selectionKeys.length) {
        const deriveRowKeys = this.createDeriveRowKeys(this.tableFullData, null);
        selectionKeys.forEach(x => {
          result.push(...this.findParentRowKeys(deriveRowKeys, x));
        });
      }
      const { defaultExpandAllRows, expandedRowKeys = [] } = expandable || {};
      return defaultExpandAllRows && !expandedRowKeys.length ? [...allRowKeys] : [...new Set([...result, ...expandedRowKeys])];
    }
  }
};

export default expandableMixin;
