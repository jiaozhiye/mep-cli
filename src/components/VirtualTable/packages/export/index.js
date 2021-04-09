/*
 * @Author: 焦质晔
 * @Date: 2020-02-02 15:58:17
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-04-08 16:48:16
 */
import dayjs from 'dayjs';
import { get, cloneDeep, isFunction } from 'lodash';
import PropTypes from '../../../_utils/vue-types';

import { getCellValue, setCellValue, convertToRows, filterTableColumns } from '../utils';
import { download } from '../../../_utils/tool';
import { getConfig } from '../../../_utils/globle-config';

import config from '../config';
import Locale from '../locale/mixin';
import ExportMixin from './mixin';
import BaseDialog from '../../../BaseDialog';
import ExportSetting from './setting';

export default {
  name: 'Export',
  mixins: [ExportMixin, Locale],
  props: {
    tableColumns: PropTypes.array,
    flattenColumns: PropTypes.array,
    fileName: PropTypes.string
  },
  inject: ['$$table'],
  data() {
    return {
      visible: false,
      exporting: false
    };
  },
  computed: {
    headColumns() {
      return filterTableColumns(this.tableColumns, ['__expandable__', '__selection__', config.operationColumn]);
    },
    flatColumns() {
      return filterTableColumns(this.flattenColumns, ['__expandable__', '__selection__', config.operationColumn]);
    },
    exportFetch() {
      return this.$$table.exportExcel.fetch ?? null;
    },
    disabledState() {
      return !this.$$table.total || this.exporting;
    }
  },
  methods: {
    createDataList(list) {
      return list.map((x, i) => {
        let item = { ...x, index: i, pageIndex: i };
        this.flatColumns.forEach((column, index) => {
          const { dataIndex } = column;
          if (dataIndex === 'index' || dataIndex === 'pageIndex') return;
          setCellValue(item, dataIndex, getCellValue(item, dataIndex));
        });
        return item;
      });
    },
    async getTableData(options) {
      const { fileType, exportType, startIndex = 1, endIndex } = options;
      const { fetch, fetchParams, total, tableFullData, selectionKeys, getRowKey } = this.$$table;
      let tableList = [];

      if (!!fetch) {
        this.exporting = !0;
        const { api, dataKey } = fetch;
        if (process.env.MOCK_DATA === 'true') {
          const { data } = cloneDeep(require('@/mock/tableData').default);
          tableList = this.createDataList(data.items);
        } else {
          try {
            const res = await api({ ...fetchParams, currentPage: 1, pageSize: total });
            if (res.code === 200) {
              tableList = this.createDataList(Array.isArray(res.data) ? res.data : get(res.data, dataKey) ?? []);
            }
          } catch (err) {}
        }

        this.exporting = !1;
      } else {
        tableList = tableFullData;
      }

      if (exportType === 'selected') {
        tableList = tableList.filter(row => selectionKeys.includes(getRowKey(row, row.index)));
      }
      if (exportType === 'custom') {
        tableList = tableList.slice(startIndex - 1, endIndex ? endIndex : undefined);
      }
      if (fileType === 'xlsx') {
        this.exportXLSX(options, tableList);
      }
      if (fileType === 'csv') {
        this.exportCSV(options, this._toTable(options, convertToRows(this.headColumns), this.flatColumns, tableList));
      }

      this.recordExportLog();
    },
    async exportHandle(fileName) {
      const { fetchParams } = this.$$table;
      this.exporting = !0;
      try {
        const res = await this.exportFetch.api({
          columns: this.flatColumns.map(column => {
            const { title, dataIndex, hidden } = column;
            const { type } = column.filter || {};
            return { title, dataIndex, type, hidden };
          }),
          ...fetchParams,
          tsortby: undefined,
          tsummary: undefined,
          tgroupby: undefined,
          currentPage: undefined,
          pageSize: undefined
        });
        if (res.data) {
          download(res.data, fileName);
          this.recordExportLog();
        }
      } catch (err) {}
      this.exporting = !1;
    },
    _toTable(options, columnRows, flatColumns, dataList) {
      const { footSummation } = options;
      const { showHeader, showFooter, $refs } = this.$$table;
      const summationRows = flatColumns.some(x => !!x.summation) ? $refs[`tableFooter`].summationRows : [];
      let html = `<table width="100%" border="0" cellspacing="0" cellpadding="0">`;
      html += `<colgroup>${flatColumns.map(({ width, renderWidth }) => `<col style="width:${width || renderWidth || config.defaultColumnWidth}px">`).join('')}</colgroup>`;
      if (showHeader) {
        html += [
          `<thead>`,
          columnRows
            .map(
              columns =>
                `<tr>${columns
                  .map(column => {
                    const { rowSpan, colSpan } = column;
                    if (colSpan === 0) {
                      return null;
                    }
                    return `<th colspan="${colSpan}" rowspan="${rowSpan}">${column.title}</th>`;
                  })
                  .join('')}</tr>`
            )
            .join(''),
          `</thead>`
        ].join('');
      }
      if (dataList.length) {
        html += `<tbody>${dataList
          .map(
            row =>
              `<tr>${flatColumns
                .map((column, index) => {
                  const { rowspan, colspan } = this.$$table.$$tableBody.getSpan(row, column, row.index, index);
                  if (!rowspan || !colspan) {
                    return null;
                  }
                  return `<td rowspan="${rowspan}" colspan="${colspan}">${this.renderCell(row, row.index, column, index)}</td>`;
                })
                .join('')}</tr>`
          )
          .join('')}</tbody>`;
      }
      if (showFooter && footSummation) {
        html += [
          `<tfoot>`,
          summationRows
            .map(
              row =>
                `<tr>${flatColumns
                  .map((column, index) => {
                    const { dataIndex, summation } = column;
                    const text = summation?.render ? summation.render(dataList) : getCellValue(row, dataIndex);
                    return `<td>${index === 0 && text === '' ? config.summaryText() : text}</td>`;
                  })
                  .join('')}</tr>`
            )
            .join(''),
          `</tfoot>`
        ].join('');
      }
      html += '</table>';
      return html;
    },
    renderCell(row, rowIndex, column, columnIndex) {
      const { dataIndex, precision, extraRender } = column;
      let result = this.$$table.$$tableBody.renderCellTitle(column, row, rowIndex, columnIndex);
      if (isFunction(extraRender)) {
        result = extraRender(getCellValue(row, dataIndex), row, column, rowIndex, columnIndex);
      }
      // 处理 number 类型
      if (precision >= 0 && result !== '') {
        result = Number(result);
      }
      return result;
    },
    recordExportLog() {
      if (process.env.MOCK_DATA === 'true') return;
      const fetchFn = getConfig('recordExportConfigApi');
      if (!fetchFn) return;
      try {
        fetchFn();
      } catch (err) {}
    }
  },
  render() {
    const { visible, fileName, exportFetch, disabledState } = this;
    const exportFileName = fileName ?? `${dayjs().format('YYYYMMDDHHmmss')}.xlsx`;
    const exportFileType = exportFileName.slice(exportFileName.lastIndexOf('.') + 1).toLowerCase();
    const wrapProps = {
      props: {
        visible,
        title: this.t('table.export.settingTitle'),
        showFullScreen: false,
        width: '600px',
        destroyOnClose: true,
        containerStyle: { height: 'calc(100% - 52px)', paddingBottom: '52px' }
      },
      on: {
        'update:visible': val => (this.visible = val)
      }
    };
    const settingProps = {
      fileName: exportFileName.slice(0, exportFileName.lastIndexOf('.')),
      fileType: exportFileType,
      useStyle: this.$$table.exportExcel.cellStyle ? 1 : 0
    };
    const cls = [
      `v-export--wrapper`,
      `size--${this.$$table.tableSize}`,
      {
        disabled: disabledState
      }
    ];
    return (
      <span class={cls} title={this.t('table.export.text')}>
        <i
          class="iconfont icon-export-excel"
          onClick={() => {
            if (disabledState) return;
            exportFetch ? this.exportHandle(exportFileName) : (this.visible = !0);
          }}
        />
        <BaseDialog {...wrapProps}>
          <ExportSetting defaultValue={settingProps} onClose={() => (this.visible = !1)} onChange={data => this.getTableData(data)} />
        </BaseDialog>
      </span>
    );
  }
};
