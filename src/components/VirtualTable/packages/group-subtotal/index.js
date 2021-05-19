/*
 * @Author: 焦质晔
 * @Date: 2020-03-05 10:27:24
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-05-10 15:12:30
 */
import { groupBy, createUidKey, getCellValue, setCellValue } from '../utils';

const groupSubtotalMixin = {
  computed: {
    summationColumns() {
      return this.flattenColumns.filter(column => !!column.summation);
    }
  },
  methods: {
    getGroupValidData(list) {
      return list.filter(row => !row._group);
    },
    flatTreeData(list) {
      const result = [];

      list.forEach(record => {
        if (record.children) {
          result.push.apply(result, this.flatTreeData(record.children));
        }
        delete record.children;
        result.push(record);
      });

      return result;
    },
    deepCreateData(list, index) {
      const item = this.groupSubtotal[index];

      if (!item) {
        list.forEach((row, i) => {
          row._rowSpan = i === 0 ? list.length : 0;
          row._colSpan = 1;
        });
        return list;
      }

      // groups 分组项
      const groups = groupBy(list, [item.dataIndex]);

      return groups.map(arr => {
        const target = {
          children: this.deepCreateData(arr, index + 1),
          _group: item.dataIndex
        };

        if (typeof this.rowKey !== 'function') {
          setCellValue(target, this.rowKey, createUidKey());
        }

        if (item.titleIndex) {
          setCellValue(target, item.titleIndex, getCellValue(arr[0], item.titleIndex));
        }
        setCellValue(target, item.dataIndex, getCellValue(arr[0], item.dataIndex));

        this.summationColumns.forEach(column => {
          const { dataIndex } = column;
          const result = target.children?.reduce((prev, curr) => {
            curr = Number(getCellValue(curr, dataIndex));
            return prev + curr;
          }, 0);
          setCellValue(target, dataIndex, result);
        });

        return target;
      });
    },
    createGroupData(list) {
      if (!this.isGroupSubtotal) {
        return list;
      }
      return this.flatTreeData(this.deepCreateData(list, 0));
    }
  }
};

export default groupSubtotalMixin;
