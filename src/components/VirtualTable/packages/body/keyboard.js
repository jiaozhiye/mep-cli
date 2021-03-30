/*
 * @Author: 焦质晔
 * @Date: 2020-03-23 12:51:24
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-03-30 13:41:31
 */
import { isUndefined } from 'lodash';
import TableManager from '../manager';

const keyboardMixin = {
  methods: {
    keyboardEvent(ev) {
      const { keyCode } = ev;
      if (this.$$table._uid !== TableManager.getFocusInstance()?.id) return;
      // Esc
      if (keyCode === 27) {
        this.setClickedValues([]);
        this.setHighlightKey('');
      }
      // table-body 被点击，获得焦点
      if (!this.clicked.length) return;
      const { rowSelection, rowHighlight } = this.$$table;
      // Enter
      if (keyCode === 13) {
        ev.preventDefault();
        if (rowSelection?.type === 'radio' || rowHighlight) {
          const { tableData, getRowKey, selectionKeys, highlightKey } = this.$$table;
          const rowKey = selectionKeys[0] ?? highlightKey ?? null;
          const row = tableData.find(record => getRowKey(record, record.index) === rowKey) ?? null;
          row && this.$$table.$emit('rowEnter', row, ev);
        }
      }
      // 上  下
      if (keyCode === 38 || keyCode === 40) {
        ev.preventDefault();
        const { allRowKeys, tableFullData, getRowKey } = this.$$table;
        const total = allRowKeys.length;
        let index = allRowKeys.findIndex(x => x === this.clicked[0]);
        // let xIndex = keyCode === 38 ? (--index + total) % total : ++index % total;
        let xIndex = keyCode === 38 ? --index : ++index;
        if (!(index < 0 || index > total - 1)) {
          const rowKey = allRowKeys[xIndex];
          const row = tableFullData.find(record => getRowKey(record, record.index) === rowKey);
          // 行单选
          if (rowSelection?.type === 'radio' && !rowSelection.disabled?.(row)) {
            this.setSelectionKeys([rowKey]);
          }
          // 行高亮
          if (rowHighlight && !rowHighlight.disabled?.(row)) {
            this.setHighlightKey(rowKey);
          }
          // 滚动条定位
          if (!this.rowInViewport(rowKey, xIndex)) {
            keyCode === 38 ? this.scrollYToRecord(rowKey, xIndex) : this.scrollYToRecord(rowKey, xIndex - (this.$$table.scrollYStore.visibleSize - 2));
          }
          this.setClickedValues([rowKey, this.clicked[1]]);
        }
      }
      // Tab
      if (keyCode === 9) {
        ev.preventDefault();
        // 非可编辑单元格
        if (!this.editableColumns.length) {
          return this.setClickedValues([]);
        }
        const total = this.editableColumns.length;
        let index = this.editableColumns.findIndex(x => x.dataIndex === this.clicked[1]);
        let yIndex = ++index % total;
        const dataIndex = this.editableColumns[yIndex].dataIndex;
        this.setClickedValues([this.clicked[0], dataIndex]);
        this.scrollXToColumn(dataIndex);
      }
      // 左  右
      // if (keyCode === 37 || keyCode === 39) {
      //   ev.preventDefault();
      //   const total = this.editableColumns.length;
      //   let index = this.editableColumns.findIndex(x => x.dataIndex === this.clicked[1]);
      //   let yIndex = keyCode === 37 ? (--index + total) % total : ++index % total;
      //   const dataIndex = this.editableColumns[yIndex].dataIndex;
      //   this.setClickedValues([this.clicked[0], dataIndex]);
      //   this.scrollXToColumn(dataIndex);
      // }
    },
    rowInViewport(rowKey, index) {
      const { scrollYStore, allRowKeys } = this.$$table;
      const { rowHeight, visibleSize } = scrollYStore;
      const v = isUndefined(index) ? allRowKeys.findIndex(x => x === rowKey) : index;
      if (v < 0) return;
      const st = v * rowHeight;
      // 不在 tableBody 视口范围
      if (st < this.$el.scrollTop || st > this.$el.scrollTop + (visibleSize - 2) * rowHeight) {
        return !1;
      }
      return !0;
    },
    scrollXToColumn(dataIndex, index) {
      const { leftFixedColumns } = this.$$table;
      const v = isUndefined(index) ? this.flattenColumns.findIndex(x => x.dataIndex === dataIndex) : index;
      if (v < 0) return;
      const fixedWidth = leftFixedColumns.map(x => x.width || x.renderWidth || config.defaultColumnWidth).reduce((prev, curr) => prev + curr, 0);
      this.$el.scrollLeft = this.$vTableBody.querySelectorAll('tbody > tr > td')[v].offsetLeft - fixedWidth;
    },
    scrollYToRecord(rowKey, index) {
      const { scrollYStore, allRowKeys } = this.$$table;
      const v = isUndefined(index) ? allRowKeys.findIndex(x => x === rowKey) : index;
      if (v < 0) return;
      this.$el.scrollTop = v * scrollYStore.rowHeight;
    },
    createInputFocus() {
      const { tableFullData, getRowKey } = this.$$table;
      if (!this.editableColumns.length || !tableFullData.length) return;
      const firstRecord = tableFullData[0];
      const firstInputColumn = this.editableColumns.find(column => {
        let options = column.editRender(firstRecord, column);
        return ['text', 'number', 'search-helper'].includes(options.type);
      });
      if (!firstInputColumn) return;
      const rowKey = getRowKey(firstRecord, firstRecord.index);
      const { dataIndex, editRender } = firstInputColumn;
      const { type } = editRender(firstRecord, firstInputColumn);
      const $$cellEdit = this.$refs[`${rowKey}-${dataIndex}`];
      if (!$$cellEdit) return;
      // 正处于编辑状态的单元格
      const { isEditing } = $$cellEdit;
      if (!isEditing) return;
      this.setClickedValues([rowKey, dataIndex]);
      $$cellEdit.$refs[`${type}-${rowKey}|${dataIndex}`]?.select();
    }
  }
};

export default keyboardMixin;
