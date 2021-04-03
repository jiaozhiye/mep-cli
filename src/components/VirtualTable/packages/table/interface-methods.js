/*
 * @Author: 焦质晔
 * @Date: 2020-04-14 16:03:27
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-04-03 14:46:35
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
  // 选中首行数据
  SELECT_FIRST_RECORD() {
    this.selectFirstRow(true);
  },
  // 清空表格焦点
  CLEAR_TABLE_FOCUS() {
    this.$$tableBody.setClickedValues([]);
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
  INSERT_RECORDS(records) {
    const rows = (Array.isArray(records) ? records : [records]).filter(x => isObject(x));
    const lastIndex = this.tableOriginData[this.tableOriginData.length - 1]?.index ?? -1;
    rows.forEach((row, index) => {
      const curIndex = lastIndex + index + 1;
      // 初始化数据
      this.flattenColumns.forEach(column => {
        const { dataIndex } = column;
        if (['__expandable__', '__selection__', config.operationColumn].includes(dataIndex)) return;
        setCellValue(row, dataIndex, getCellValue(row, dataIndex));
      });
      // 数据索引
      row.index = curIndex;
      // 分页索引
      row.pageIndex = this.createPageIndex(curIndex);
      // 添加表格操作记录
      this.store.addToInserted(row);
    });
    // 处理插入数据
    this.tableFullData.push(...rows);
    this.tableOriginData.push(...rows);
    // 滚动条定位
    if (rows.length > 0) {
      const lastRowKey = this.getRowKey(rows[rows.length - 1], rows[rows.length - 1].index);
      this.$nextTick(() => {
        this.toLastPage();
        this.$$tableBody.scrollYToRecord(lastRowKey);
      });
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
        this.tableFullData.splice(i, 1);
        this.tableOriginData.splice(i, 1);
        // 移动下标
        i = i - 1;
      }
    }
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
