/*
 * @Author: 焦质晔
 * @Date: 2020-03-05 10:27:24
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-10-21 08:45:34
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
    // 展开行，已展开的 keys
    createRowExpandedKeys() {
      const { expandable, selectionKeys, allRowKeys, treeStructure, isTreeTable } = this;
      if (isTreeTable && expandable) {
        console.error('[Table]: 树结构表格不能再设置展开行 `expandable` 参数');
      }
      // 树结构
      if (isTreeTable) {
        let { defaultExpandAllRows, expandedRowKeys = [] } = treeStructure || {};
        let mergedRowKeys = [...selectionKeys, ...expandedRowKeys];
        let result = [];
        if (mergedRowKeys.length) {
          mergedRowKeys.forEach(x => {
            result.push(...this.findParentRowKeys(this.deriveRowKeys, x));
          });
        }
        return defaultExpandAllRows && !expandedRowKeys.length ? [...allRowKeys] : [...new Set([...expandedRowKeys, ...result])];
      }
      // 展开行
      if (!!expandable) {
        let { defaultExpandAllRows, expandedRowKeys = [] } = expandable || {};
        return defaultExpandAllRows && !expandedRowKeys.length ? [...allRowKeys] : [...expandedRowKeys];
      }
      return [];
    }
  }
};

export default expandableMixin;
