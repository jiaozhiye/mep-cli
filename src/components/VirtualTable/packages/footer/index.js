/*
 * @Author: 焦质晔
 * @Date: 2020-03-01 23:54:20
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-06-25 16:48:05
 */
import { setCellValue, getCellValue } from '../utils';
import formatMixin from '../body/format';
import config from '../config';

const noop = () => {};

export default {
  name: 'TableFooter',
  props: ['flattenColumns'],
  inject: ['$$table'],
  mixins: [formatMixin],
  computed: {
    summationRows() {
      const { tableFullData, selectionKeys, selectionRows, summaries, getGroupValidData, isGroupSubtotal } = this.$$table;
      const summationColumns = this.flattenColumns.filter(x => typeof x.summation !== 'undefined');
      // 结果
      const res = {};
      summationColumns.forEach(column => {
        const {
          dataIndex,
          precision,
          formatType = 'finance', // 默认货币格式
          summation: { sumBySelection, displayWhenNotSelect, unit = '', onChange = noop }
        } = column;
        const tableDataList = !isGroupSubtotal ? tableFullData : getGroupValidData(tableFullData);
        // 未选择时，显示合计结果
        const notSelectAndDisplay = !selectionKeys.length && displayWhenNotSelect;
        // 可选择列动态合计
        const values = !sumBySelection || notSelectAndDisplay ? tableDataList : selectionRows;
        // 累加求和
        let result = values.reduce((prev, curr) => {
          if (curr[config.summaryIgnore]) {
            return prev;
          }
          let value = Number(getCellValue(curr, dataIndex));
          if (!Number.isNaN(value)) {
            return prev + value;
          }
          return prev;
        }, 0);
        // 服务端合计
        if (Object.keys(summaries).includes(dataIndex) && (!sumBySelection || notSelectAndDisplay)) {
          result = getCellValue(summaries, dataIndex);
        }
        result = precision >= 0 ? result.toFixed(precision) : result;
        // 处理数据格式化
        result = this[`${formatType}Format`]?.(result) ?? result;
        // 设置合计值
        setCellValue(res, dataIndex, unit ? `${result} ${unit}` : result);
        // 触发事件
        onChange(result);
      });
      return [res];
    }
  },
  methods: {
    renderColgroup() {
      const {
        layout: { gutterWidth },
        scrollY
      } = this.$$table;
      return (
        <colgroup>
          {this.flattenColumns.map(column => {
            const { dataIndex, width, renderWidth } = column;
            return <col key={dataIndex} style={{ width: `${width || renderWidth}px`, minWidth: `${width || renderWidth}px` }} />;
          })}
          {scrollY && <col style={{ width: `${gutterWidth}px`, minWidth: `${gutterWidth}px` }} />}
        </colgroup>
      );
    },
    renderRows() {
      const { scrollY, isIE, rightFixedColumns } = this.$$table;
      const cls = [
        `gutter`,
        {
          [`v-cell-fix-right`]: !!rightFixedColumns.length
        }
      ];
      const stys = !isIE
        ? {
            right: !!rightFixedColumns.length ? 0 : null
          }
        : null;
      return this.summationRows.map(row => (
        <tr class="v-footer--row">
          {this.flattenColumns.map((column, index) => this.renderCell(column, row, index))}
          {scrollY && <td class={cls} style={stys}></td>}
        </tr>
      ));
    },
    renderCell(column, row, index) {
      const {
        tableFullData,
        leftFixedColumns,
        rightFixedColumns,
        getStickyLeft,
        getStickyRight,
        layout: { gutterWidth },
        scrollY,
        isIE
      } = this.$$table;
      const { dataIndex, fixed, align, summation } = column;
      const cls = [
        `v-footer--column`,
        `col--ellipsis`,
        {
          [`col--center`]: align === 'center',
          [`col--right`]: align === 'right',
          [`v-cell-fix-left`]: fixed === 'left',
          [`v-cell-fix-right`]: fixed === 'right',
          [`v-cell-fix-left-last`]: !isIE && fixed === 'left' && leftFixedColumns[leftFixedColumns.length - 1].dataIndex === dataIndex,
          [`v-cell-fix-right-first`]: !isIE && fixed === 'right' && rightFixedColumns[0].dataIndex === dataIndex
        }
      ];
      const stys = !isIE
        ? {
            left: fixed === 'left' ? `${getStickyLeft(dataIndex)}px` : null,
            right: fixed === 'right' ? `${getStickyRight(dataIndex) + (scrollY ? gutterWidth : 0)}px` : null
          }
        : null;
      const text = summation?.render ? summation.render(tableFullData) : getCellValue(row, dataIndex);
      return (
        <td key={dataIndex} class={cls} style={{ ...stys }}>
          <div class="v-cell">{index === 0 && text === '' ? config.summaryText() : text}</div>
        </td>
      );
    }
  },
  render() {
    const {
      layout: { tableBodyWidth }
    } = this.$$table;
    return (
      <div class="v-table--footer-wrapper body--wrapper">
        <table class="v-table--footer" cellspacing="0" cellpadding="0" border="0" style={{ width: tableBodyWidth ? `${tableBodyWidth}px` : null }}>
          {this.renderColgroup()}
          <tfoot>{this.renderRows()}</tfoot>
        </table>
      </div>
    );
  }
};
