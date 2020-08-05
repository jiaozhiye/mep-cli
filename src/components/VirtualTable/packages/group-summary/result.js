/*
 * @Author: 焦质晔
 * @Date: 2020-05-20 09:36:38
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-08-05 14:14:20
 */
import { maxBy, minBy, sumBy } from 'lodash';
import { groupBy, getCellValue, setCellValue } from '../utils';
import config from '../config';
import Locale from '../locale/mixin';

import VTable from '../table';

export default {
  name: 'GroupSummaryResult',
  mixins: [Locale],
  props: ['columns', 'group', 'summary'],
  inject: ['$$table'],
  data() {
    const groupColumns = this.group.map(x => ({
      dataIndex: x.group,
      ...this.formatColumn(x.group)
    }));
    const summaryColumns = this.summary.map(x => {
      if (x.summary === config.groupSummary.total.value) {
        return { dataIndex: x.summary, title: config.groupSummary.total.text };
      }
      return { dataIndex: x.summary, ...this.formatColumn(x.summary) };
    });
    return {
      loading: !1,
      list: [], // 汇总表格数据
      vFetch: this.createvTableFetch(),
      vColumns: this.createvTableColumns(groupColumns, summaryColumns),
      exportExcel: {
        fileName: this.t('table.groupSummary.exportFileName')
      },
      tablePrint: {
        showLogo: true
      }
    };
  },
  mounted() {
    if (!this.$$table.isFetch) {
      this.list = this.createvTableData(this.$$table.tableFullData);
    }
  },
  methods: {
    formatColumn(dataIndex) {
      const column = this.columns.find(x => x.dataIndex === dataIndex);
      return {
        title: column.title,
        dictItems: column.dictItems ?? []
      };
    },
    createvTableFetch() {
      const { isFetch, fetchParams, fetch } = this.$$table;
      if (!isFetch) return null;
      const params = Object.assign({}, fetchParams, {
        [config.groupSummary.summaryFieldName]: this.summary.map(x => `${x.formula}|${x.summary}`).join(','),
        [config.groupSummary.groupbyFieldName]: this.group.map(x => `${x.group}`).join(','),
        usedJH: 0
      });
      return Object.assign({}, fetch, { params });
    },
    createvTableColumns(groupColumns, summaryColumns) {
      return [
        {
          title: '序号',
          dataIndex: 'pageIndex',
          width: 80,
          render: text => {
            return text + 1;
          }
        },
        ...groupColumns.map(x => ({
          title: x.title,
          dataIndex: x.dataIndex,
          dictItems: x.dictItems
        })),
        ...summaryColumns.map(x => ({
          title: x.title,
          dataIndex: x.dataIndex,
          summation: this.$$table.isFetch ? { dataKey: x.dataIndex } : {}
        }))
      ];
    },
    createvTableData(list) {
      const result = groupBy(
        list,
        this.group.map(x => x.group)
      );
      // =================
      let res = [];
      result.forEach(arr => {
        let record = {};
        this.vColumns.forEach(x => {
          const { dataIndex } = x;
          if (dataIndex === 'index') return;
          setCellValue(record, dataIndex, getCellValue(arr[0], dataIndex));
        });
        this.summary.forEach(x => {
          let key = x.summary;
          let fn = x.formula;
          if (fn === 'count') {
            setCellValue(record, key, arr.length);
          }
          if (fn === 'sum') {
            setCellValue(record, key, sumBy(arr, key));
          }
          if (fn === 'max') {
            setCellValue(record, key, maxBy(arr, key)[key]);
          }
          if (fn === 'min') {
            setCellValue(record, key, minBy(arr, key)[key]);
          }
          if (fn === 'avg') {
            setCellValue(record, key, (sumBy(arr, key) / arr.length).toFixed(2));
          }
        });
        res.push(record);
      });
      // =================
      return res;
    }
  },
  render() {
    const { vColumns, list, vFetch, exportExcel, tablePrint } = this;
    const tableProps = {
      props: {
        height: 400,
        ...(this.$$table.isFetch ? { fetch: vFetch } : { dataSource: list }),
        columns: vColumns,
        rowKey: record => record.index,
        showFullScreen: !1,
        exportExcel,
        tablePrint,
        columnsChange: columns => (this.vColumns = columns)
      }
    };
    return (
      <div>
        <VTable {...tableProps} />
      </div>
    );
  }
};
