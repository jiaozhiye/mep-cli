/*
 * @Author: 焦质晔
 * @Date: 2020-02-28 23:01:43
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-06-26 11:41:49
 */
import addEventListener from 'add-dom-event-listener';
import { isEqual, isFunction, isObject } from 'lodash';
import { parseHeight, throttle, getCellValue, deepFindRowKey, getVNodeText, isArrayContain } from '../utils';
import { getParentNode } from '../../../_utils/tool';
import { isValidElement } from '../../../_utils/props-util';
import clickOutside from '../../../_utils/click-outside';
import TableManager from '../manager';
import config from '../config';

import formatMixin from './format';
import keyboardMixin from './keyboard';

import Draggable from '../draggable';
import Expandable from '../expandable';
import Selection from '../selection';
import CellEdit from '../edit';

const noop = () => {};

export default {
  name: 'TableBody',
  props: ['flattenColumns', 'tableData', 'rowStyle', 'cellStyle'],
  inject: ['$$table'],
  provide() {
    return {
      $$body: this
    };
  },
  directives: {
    clickOutside
  },
  mixins: [keyboardMixin, formatMixin],
  data() {
    this.prevST = 0;
    this.prevSL = 0;
    return {
      clicked: [], // 被点击单元格的坐标
      checked: [] // 可选择列选中的 rowKey
    };
  },
  computed: {
    $vTableBody() {
      return this.$el.querySelector('.v-table--body');
    },
    bodyWidth() {
      const { layout, scrollY } = this.$$table;
      const { tableBodyWidth, gutterWidth } = layout;
      return tableBodyWidth ? `${tableBodyWidth - (scrollY ? gutterWidth : 0)}px` : null;
    },
    wrapStyle() {
      const { layout, height, minHeight, maxHeight, fullHeight, autoHeight } = this.$$table;
      const { headerHeight, viewportHeight, footerHeight } = layout;
      const result = {};
      if (minHeight) {
        Object.assign(result, { minHeight: `${parseHeight(minHeight) - headerHeight - footerHeight}px` });
      }
      if (maxHeight) {
        Object.assign(result, { maxHeight: `${parseHeight(maxHeight) - headerHeight - footerHeight}px` });
      }
      if (height || fullHeight || autoHeight) {
        return { ...result, height: `${viewportHeight}px` };
      }
      return result;
    },
    editableColumns() {
      return this.flattenColumns.filter(x => isFunction(x.editRender));
    },
    firstDataIndex() {
      const effectColumns = this.flattenColumns.filter(x => !['__expandable__', '__selection__', config.operationColumn].includes(x.dataIndex));
      return effectColumns.length ? effectColumns[0].dataIndex : '';
    },
    isDraggable() {
      return this.$$table.rowDraggable;
    }
  },
  watch: {
    clicked(next) {
      if (!next.length) return;
      TableManager.focus(this.$$table._uid);
    }
  },
  mounted() {
    this.event1 = addEventListener(this.$el, 'scroll', this.scrollEvent);
    this.event2 = addEventListener(document, 'keydown', throttle(this.keyboardEvent, 100));
  },
  destroyed() {
    this.event1.remove();
    this.event2.remove();
  },
  methods: {
    scrollEvent(ev) {
      const { scrollYLoad, scrollY, layout, triggerScrollYEvent, $refs } = this.$$table;
      const scrollYWidth = scrollY ? layout.gutterWidth : 0;
      const { scrollTop: st, scrollLeft: sl } = ev.target;
      if (sl !== this.prevSL) {
        if ($refs[`tableHeader`]) {
          $refs[`tableHeader`].$el.scrollLeft = sl;
        }
        if ($refs[`tableFooter`]) {
          $refs[`tableFooter`].$el.scrollLeft = sl;
        }
        this.$$table.isPingLeft = sl > 0;
        this.$$table.isPingRight = sl + layout.tableWidth < layout.tableBodyWidth + scrollYWidth;
      }
      if (scrollYLoad && st !== this.prevST) {
        triggerScrollYEvent(ev);
      }
      this.prevST = st;
      this.prevSL = sl;
    },
    cancelClickEvent($down, $up) {
      if (!!getParentNode($up, 'table-editable__popper')) return;
      this.setClickedValues([]);
    },
    renderBodyXSpace() {
      return <div class="v-body--x-space" style={{ width: this.bodyWidth }} />;
    },
    renderBodyYSpace() {
      return <div class="v-body--y-space" />;
    },
    renderColgroup() {
      return (
        <colgroup>
          {this.flattenColumns.map(column => {
            const { dataIndex, width, renderWidth } = column;
            return <col key={dataIndex} style={{ width: `${width || renderWidth}px`, minWidth: `${width || renderWidth}px` }} />;
          })}
        </colgroup>
      );
    },
    renderRows(list, depth = 0) {
      const { getRowKey, stripe, selectionKeys, highlightKey, rowSelection, expandable, rowExpandedKeys, isGroupSubtotal } = this.$$table;
      const rows = [];
      list.forEach(row => {
        // 行记录 索引
        const rowIndex = row.index;
        // 行记录 rowKey
        const rowKey = getRowKey(row, rowIndex);
        const cls = [
          `v-body--row`,
          {
            [`v-body--row-striped`]: stripe && rowIndex % 2 !== 0,
            [`v-body--row-selected`]: selectionKeys.includes(rowKey),
            [`v-body--row-current`]: highlightKey === rowKey,
            ...(isGroupSubtotal ? this.createGroupRowCls(row._group) : null)
          }
        ];
        rows.push(
          <tr key={rowKey} data-row-key={rowKey} class={cls}>
            {this.flattenColumns.map((column, columnIndex) => this.renderColumn(column, columnIndex, row, rowIndex, rowKey, depth))}
          </tr>
        );
        // 展开行
        if (expandable) {
          const { rowExpandable = noop } = expandable;
          const expandColumnCls = [`v-body--column`];
          // 展开状态
          if (!rowExpandable(row) && rowExpandedKeys.includes(rowKey)) {
            rows.push(
              <tr key={`expand_${rowKey}`} class="v-body--row-expanded">
                <td colspan={this.flattenColumns.length} class={expandColumnCls} style={{ paddingLeft: !rowSelection ? `50px` : `100px` }}>
                  <div class="v-cell">{expandable.expandedRowRender(row, rowIndex)}</div>
                </td>
              </tr>
            );
          }
        }
        // 树表格
        if (this.isTreeNode(row)) {
          // 展开状态
          if (rowExpandedKeys.includes(rowKey)) {
            rows.push(...this.renderRows(row.children, depth + 1));
          }
        }
      });
      return rows;
    },
    renderColumn(column, columnIndex, row, rowIndex, rowKey, depth) {
      const { leftFixedColumns, rightFixedColumns, getStickyLeft, getStickyRight, ellipsis, sorter, isGroupSubtotal, isIE } = this.$$table;
      const { dataIndex, fixed, align, className } = column;
      const { rowspan, colspan } = this.getSpan(row, column, rowIndex, columnIndex);
      const isEllipsis = column.ellipsis ?? ellipsis;
      if (!rowspan || !colspan) {
        return null;
      }
      const cls = [
        `v-body--column`,
        {
          [`col--ellipsis`]: isEllipsis,
          [`col--center`]: align === 'center',
          [`col--right`]: align === 'right',
          [`v-column--sort`]: Object.keys(sorter).includes(dataIndex),
          [`v-cell-fix-left`]: fixed === 'left',
          [`v-cell-fix-right`]: fixed === 'right',
          [`v-cell-fix-left-last`]: !isIE && fixed === 'left' && leftFixedColumns[leftFixedColumns.length - 1].dataIndex === dataIndex,
          [`v-cell-fix-right-first`]: !isIE && fixed === 'right' && rightFixedColumns[0].dataIndex === dataIndex,
          [className]: !!className
        }
      ];
      const stys = !isIE
        ? {
            left: fixed === 'left' ? `${getStickyLeft(dataIndex)}px` : null,
            right: fixed === 'right' ? `${getStickyRight(dataIndex)}px` : null
          }
        : null;
      const trExtraStys = this.rowStyle ? (isFunction(this.rowStyle) ? this.rowStyle(row, rowIndex) : this.rowStyle) : null;
      const tdExtraStys = this.cellStyle ? (isFunction(this.cellStyle) ? this.cellStyle(row, column, rowIndex, columnIndex) : this.cellStyle) : null;
      const groupStys = isGroupSubtotal ? this.getGroupStyles(row._group) : null;
      return (
        <td
          key={dataIndex}
          title={isEllipsis && this.renderCellTitle(column, row, rowIndex, columnIndex)}
          rowspan={rowspan}
          colspan={colspan}
          class={cls}
          style={{ ...stys, ...groupStys, ...trExtraStys, ...tdExtraStys }}
          onClick={ev => this.cellClickHandle(ev, row, column)}
          onDblclick={ev => this.cellDbclickHandle(ev, row, column)}
        >
          <div class="v-cell">{this.renderCell(column, row, rowIndex, columnIndex, rowKey, depth)}</div>
        </td>
      );
    },
    renderCell(column, row, rowIndex, columnIndex, rowKey, depth) {
      const { expandable, selectionKeys, isTreeTable } = this.$$table;
      const { dataIndex, editRender, render } = column;
      const text = getCellValue(row, dataIndex);
      if (dataIndex === '__expandable__') {
        const { rowExpandable = noop } = expandable;
        // Expandable -> 受控组件
        return !rowExpandable(row) && <Expandable record={row} rowKey={rowKey} />;
      }
      if (dataIndex === '__selection__') {
        // Selection -> 受控组件
        return <Selection selectionKeys={selectionKeys} column={column} record={row} rowKey={rowKey} />;
      }
      if (isFunction(editRender)) {
        // CellEdit -> UI 组件，无状态组件
        return <CellEdit ref={`${rowKey}-${dataIndex}`} column={column} record={row} rowKey={rowKey} columnKey={dataIndex} clicked={this.clicked} />;
      }
      // Content Node
      const vNodeText = isFunction(render) ? render(text, row, column, rowIndex, columnIndex) : this.renderText(text, column, row);
      // Tree Expandable + vNodeText
      if (isTreeTable && dataIndex === this.firstDataIndex) {
        return [this.renderIndent(depth), <Expandable record={row} rowKey={rowKey} style={this.isTreeNode(row) ? null : { visibility: 'hidden' }} />, vNodeText];
      }
      return vNodeText;
    },
    renderText(text, column, row) {
      const { dictItems, precision, formatType, editRender } = column;
      const dicts = dictItems || editRender?.(row, column)?.items || [];
      const target = dicts.find(x => x.value == text);
      let result = target?.text ?? text ?? '';
      // 数据是数组的情况
      if (Array.isArray(text)) {
        result = text
          .map(x => {
            let target = dicts.find(k => k.value == x);
            return target?.text ?? x;
          })
          .join(',');
      }
      // 处理数值精度
      if (precision >= 0 && result !== '') {
        result = Number(result).toFixed(precision);
      }
      // 处理换行符
      if (typeof result === 'string') {
        result = result.replace(/[\r\n]/g, '');
      }
      // 处理数据格式化
      if (formatType) {
        const render = this[`${formatType}Format`];
        if (!render) {
          console.error('[Table]: 字段的格式化类型 `formatType` 配置不正确');
        } else {
          result = render(result);
        }
      }
      return result;
    },
    renderIndent(level) {
      return level ? <span class={`v-cell--indent indent-level-${level}`} style={{ paddingLeft: `${level * config.treeTable.textIndent}px` }} /> : null;
    },
    getSpan(row, column, rowIndex, columnIndex) {
      let rowspan = 1;
      let colspan = 1;
      const fn = this.$$table.spanMethod;
      if (isFunction(fn)) {
        const result = fn({ row, column, rowIndex, columnIndex, tableData: this.tableData });
        if (Array.isArray(result)) {
          rowspan = result[0];
          colspan = result[1];
        } else if (isObject(result)) {
          rowspan = result.rowspan;
          colspan = result.colspan;
        }
        // 内存分页 或 虚拟滚动 支持动态合并行
        if (row === this.tableData[0] && rowspan === 0) {
          rowspan = 1;
          for (let i = 1; i < this.tableData.length; i++) {
            const { rowspan: rowSpan } = this.getSpan(this.tableData[i], column, this.tableData[i].index, columnIndex);
            if (rowSpan > 0) break;
            rowspan++;
          }
        }
      }
      return { rowspan, colspan };
    },
    createGroupRowCls(dataIndex) {
      const level = this.$$table.groupSubtotal.findIndex(x => x.dataIndex === dataIndex);
      return {
        [`v-body--row-group_${level + 1}`]: level >= 0 ? true : false
      };
    },
    getGroupStyles(dataIndex) {
      const { backgroundColor, color } = this.$$table.groupSubtotal.find(x => x.dataIndex === dataIndex) ?? {};
      return { backgroundColor, color };
    },
    renderCellTitle(column, row, rowIndex, columnIndex) {
      const { dataIndex, render } = column;
      if (['__expandable__', '__selection__', config.operationColumn].includes(dataIndex)) {
        return '';
      }
      const text = getCellValue(row, dataIndex);
      let title = '';
      if (isFunction(render)) {
        const result = render(text, row, column, rowIndex, columnIndex);
        if (isValidElement(result)) {
          title = getVNodeText(result).join('');
        } else {
          title = result;
        }
      } else {
        title = this.renderText(text, column, row);
      }
      return title;
    },
    cellClickHandle(ev, row, column) {
      const { getRowKey, rowSelection = {}, selectionKeys, rowHighlight, isTreeTable } = this.$$table;
      const { dataIndex } = column;
      if (['__expandable__', config.operationColumn].includes(dataIndex)) return;
      const rowKey = getRowKey(row, row.index);
      // 设置 clicked 坐标
      this.setClickedValues([rowKey, dataIndex]);
      // 判断单元格是否可编辑
      const options = column.editRender?.(row, column);
      const isEditable = options && !options.disabled;
      // 正处于编辑状态的单元格
      // const isEditing = this.$refs[`${rowKey}-${dataIndex}`]?.isEditing;
      // 行选中
      const { type, checkStrictly = !0, disabled = noop } = rowSelection;
      if (type && !disabled(row) && !isEditable) {
        if (type === 'radio') {
          this.setSelectionKeys([rowKey]);
        }
        if (type === 'checkbox') {
          if (isTreeTable && !checkStrictly) {
            this.setTreeSelectionKeys(rowKey, selectionKeys);
          } else {
            this.setSelectionKeys(!selectionKeys.includes(rowKey) ? [...selectionKeys, rowKey] : selectionKeys.filter(x => x !== rowKey));
          }
        }
      }
      // 单击 展开列、可选择列、操作列 不触发行单击事件
      if (['__selection__'].includes(dataIndex)) return;
      // 行高亮
      if (rowHighlight && !rowHighlight.disabled?.(row)) {
        this.$$table.highlightKey = rowKey;
      }
      // 行单击
      this.$$table.$emit('rowClick', row, column, ev);
    },
    cellDbclickHandle(ev, row, column) {
      const { dataIndex } = column;
      if (['__expandable__', '__selection__', config.operationColumn].includes(dataIndex)) return;
      this.$$table.$emit('rowDblclick', row, column, ev);
    },
    setClickedValues(arr) {
      if (isEqual(arr, this.clicked)) return;
      this.clicked = arr;
    },
    setSelectionKeys(arr) {
      this.$$table.selectionKeys = arr;
    },
    setTreeSelectionKeys(key, arr) {
      // on(选中)  off(取消)
      const state = !arr.includes(key) ? 'on' : 'off';
      const selectedKeys = this.createTreeSelectionKeys(key, arr, state);
      this.setSelectionKeys(selectedKeys);
    },
    createTreeSelectionKeys(key, arr, state) {
      const { deriveRowKeys, getAllChildRowKeys, findParentRowKeys } = this.$$table;
      const target = deepFindRowKey(deriveRowKeys, key);
      let result = [];
      // 后代节点 rowKeys
      const childRowKeys = getAllChildRowKeys(target.children ?? []);
      // 祖先节点 rowKeys
      const parentRowKeys = findParentRowKeys(deriveRowKeys, key);
      // 处理后代节点
      if (state === 'on') {
        result = [...new Set([...arr, key, ...childRowKeys])];
      } else {
        result = arr.filter(x => ![key, ...childRowKeys].includes(x));
      }
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
    setHighlightKey(key) {
      this.$$table.highlightKey = key;
    },
    isTreeNode(row) {
      return Array.isArray(row.children) && row.children.length > 0;
    }
  },
  render() {
    const { bodyWidth, wrapStyle, tableData, isDraggable } = this;
    const dragProps = {
      props: {
        tag: 'tbody',
        value: this.$$table.tableFullData,
        options: { animation: 200 }
      },
      on: {
        input: list => {
          this.$$table.tableFullData = list;
        }
      }
    };
    return (
      <div class="v-table--body-wrapper body--wrapper" style={{ ...wrapStyle }}>
        {this.renderBodyYSpace()}
        {this.renderBodyXSpace()}
        <table class="v-table--body" cellspacing="0" cellpadding="0" border="0" style={{ width: bodyWidth }} v-clickOutside={($down, $up) => this.cancelClickEvent($down, $up)}>
          {this.renderColgroup()}
          {!isDraggable ? <tbody>{this.renderRows(tableData)}</tbody> : <Draggable {...dragProps}>{this.renderRows(tableData)}</Draggable>}
        </table>
      </div>
    );
  }
};
