/*
 * @Author: 焦质晔
 * @Date: 2020-04-14 16:03:27
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-11-23 19:19:59
 */
import { getCellValue, setCellValue, tableDataFlatMap } from '../utils';
import { intersection, isObject, isFunction } from 'lodash';
import config from '../config';

export default {
  // 计算表格高度
  CALCULATE_HEIGHT() {
    this.$nextTick(() => this.calcTableHeight());
  },
  // 刷新表格数据
  async DO_REFRESH(callback) {
    this.clearRowSelection();
    this.clearRowHighlight();
    await this.getTableData();
    callback?.();
  },
  // 获取表格操作记录
  GET_LOG() {
    const { required, validate, inserted, updated, removed } = this.store.state;
    // 求 inserted, removed 的交集
    const intersections = intersection(inserted, removed);
    return {
      required: required.map(item => ({ rowKey: item.x, dataIndex: item.y, text: item.text })),
      validate: validate.map(item => ({ rowKey: item.x, dataIndex: item.y, text: item.text })),
      inserted: inserted.filter(row => !intersections.includes(row)),
      updated: updated.filter(row => ![...intersection(updated, inserted), ...intersection(updated, removed)].includes(row)),
      removed: removed.filter(row => !intersections.includes(row))
    };
  },
  // 获取表格的查询参数
  GET_FETCH_PARAMS() {
    let params = {};
    for (let key in this.fetchParams) {
      // 过滤分页参数
      if (Object.keys(this.pagination).includes(key)) continue;
      params[key] = this.fetchParams[key];
    }
    return params;
  },
  // 打开单元格搜索帮助面板
  OPEN_SEARCH_HELPER(rowKey, dataIndex) {
    const editableCell = this.$$tableBody.$refs[`${rowKey}-${dataIndex}`];
    if (!editableCell) return;
    editableCell.shVisible = !0;
  },
  // 清空表格数据
  CLEAR_TABLE_DATA() {
    if (this.isFetch) {
      this.setRecordsTotal(0);
    } else {
      // 清空列选中
      this.clearRowSelection();
      // 清空行高亮
      this.clearRowHighlight();
      // 清空表头排序
      this.clearTableSorter();
      // 清空表头筛选
      this.clearTableFilter();
      // 清空高级检索
      this.clearSuperSearch();
      // 清空表格操作记录
      this.clearTableLog();
    }
    this.createTableData([]);
  },
  // 清空表格操作记录
  CLEAR_LOG() {
    this.clearTableLog();
  },
  // 滚动到指定数据行
  SCROLL_TO_RECORD(rowKey) {
    this.$$tableBody.scrollYToRecord(rowKey);
  },
  // 滚动到指定表格列
  SCROLL_TO_COLUMN(dataIndex) {
    this.$$tableBody.scrollXToColumn(dataIndex);
  },
  // 表格数据插入
  INSERT_RECORDS(records, dir = 'bottom') {
    const rows = (Array.isArray(records) ? records : [records]).filter(x => isObject(x));
    rows.forEach(row => {
      // 初始化数据
      this.flattenColumns.forEach(column => {
        const { dataIndex } = column;
        if (['__expandable__', '__selection__', config.operationColumn].includes(dataIndex)) return;
        setCellValue(row, dataIndex, getCellValue(row, dataIndex));
      });
      // 添加表格操作记录
      this.store.addToInserted(row);
    });
    // 处理插入数据
    const tableData = dir === 'bottom' ? [...this.tableOriginData, ...rows] : [...rows, ...this.tableOriginData];
    // 清空表头筛选和排序
    this.clearTableSorter();
    this.clearTableFilter();
    // 重新创建表格数据
    this.createTableData(tableData);
    // 滚动条定位
    if (rows.length > 0) {
      let current = dir === 'bottom' ? rows[rows.length - 1] : rows[0];
      this.$nextTick(() => this.$$tableBody.scrollYToRecord(this.getRowKey(current, current.index)));
    }
  },
  // 删除数据
  REMOVE_RECORDS(records) {
    const rows = Array.isArray(records) ? records : [records];
    const rowKeys = rows.filter(x => !!x).map(x => (isObject(x) ? this.getRowKey(x, x.index) : x));
    const editableColumns = this.flattenColumns.filter(column => isFunction(column.editRender));
    for (let i = 0; i < this.tableFullData.length; i++) {
      const row = this.tableFullData[i];
      const rowKey = this.getRowKey(row, row.index);
      if (rowKeys.includes(rowKey)) {
        this.store.addToRemoved(row);
        // 移除表单校验记录
        editableColumns.forEach(column => {
          const { dataIndex, editRender } = column;
          const options = editRender(row);
          if (!options) return;
          const { rules = [], disabled } = options;
          if (!disabled && rules.length) {
            this.store.removeFromRequired({ x: rowKey, y: dataIndex });
            this.store.removeFromValidate({ x: rowKey, y: dataIndex });
          }
        });
        // 移除选择列数据
        if (this.selectionKeys.includes(rowKey)) {
          this.removeSelectionKey(rowKey);
        }
        // 移除高亮行数据
        if (rowKey === this.highlightKey) {
          this.clearRowHighlight();
        }
        // 移除展开行数据
        if (this.rowExpandedKeys.includes(rowKey)) {
          this.removeExpandableKey(rowKey);
        }
        // 移除数据
        this.tableFullData.splice(i--, 1);
      }
    }
    // 重新创建表格数据
    this.createTableData(this.tableFullData);
  },
  // 表单校验
  FORM_VALIDATE() {
    const editableColumns = this.flattenColumns.filter(column => isFunction(column.editRender));
    tableDataFlatMap(this.tableFullData).forEach(record => {
      editableColumns.forEach(column => {
        const { dataIndex, editRender } = column;
        const options = editRender(record);
        if (!options) return;
        const { rules = [], disabled } = options;
        if (!disabled && rules.length) {
          this.createFieldValidate(rules, getCellValue(record, dataIndex), this.getRowKey(record, record.index), dataIndex);
        }
      });
    });
    const { required, validate } = this.GET_LOG();
    const result = [...required, ...validate];
    // 定位未通过校验的字段
    if (result.length) {
      this.$$tableBody.scrollYToRecord(result[0].rowKey);
    }
    return { required, validate };
  }
};
