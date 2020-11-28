/*
 * @Author: 焦质晔
 * @Date: 2020-02-02 15:58:17
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-11-27 17:13:35
 */
import PropTypes from '../../../_utils/vue-types';
import JsonToExcel from '../../../JsonToExcel';

import config from '../config';
import Locale from '../locale/mixin';
import { setCellValue, filterTableColumns } from '../utils';
import moment from 'moment';
import { get, isFunction } from 'lodash';

export default {
  name: 'Export',
  mixins: [Locale],
  props: {
    flattenColumns: PropTypes.array,
    data: PropTypes.array.def([]),
    fileName: PropTypes.string,
    fetch: PropTypes.object
  },
  inject: ['$$table'],
  computed: {
    filterColumns() {
      return filterTableColumns(this.flattenColumns, ['__expandable__', '__selection__', config.operationColumn]);
    },
    exportFetch() {
      return this.$$table.exportExcel.fetch ?? null;
    },
    fields() {
      const target = {};
      this.filterColumns.forEach(x => {
        target[x.title] = x.dataIndex;
      });
      return target;
    }
  },
  methods: {
    createDataList(list) {
      return list.map((x, i) => {
        let item = { ...x, index: i, pageIndex: i };
        this.filterColumns.forEach((column, index) => {
          const { dataIndex, dictItems, render, extraRender } = column;
          const val = get(item, dataIndex);
          const dicts = dictItems || [];
          const target = dicts.find(x => x.value == val);
          let res = target?.text ?? val;
          // 数据是数组的情况
          if (Array.isArray(val)) {
            res = val
              .map(x => {
                let target = dicts.find(k => k.value == x);
                return target?.text ?? x;
              })
              .join(',');
          }
          // render 情况
          if (isFunction(render)) {
            res = render(val, item, column, item.index, index);
          }
          // extraRender 情况
          if (isFunction(extraRender)) {
            res = extraRender(val, item, column, item.index, index);
          }
          setCellValue(item, dataIndex, res);
        });
        return item;
      });
    },
    createFetchParams(fetch) {
      if (!fetch) {
        return null;
      }
      const { api, dataKey, total } = fetch;
      return {
        fetch: {
          api,
          params: {
            ...this.$$table.fetchParams,
            currentPage: 1,
            pageSize: total
          },
          dataKey
        }
      };
    },
    async exportHandle(fileName) {
      const { fetchParams } = this.$$table;
      try {
        const res = await this.exportFetch.api({
          ...fetchParams,
          tsortby: undefined,
          tsummary: undefined,
          tgroupby: undefined,
          currentPage: undefined,
          pageSize: undefined
        });
        if (!res.data) return;
        this.downloadFile(res.data, fileName);
      } catch (err) {}
    },
    // 执行下载动作
    downloadFile(blob, fileName) {
      // ie10+
      if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, decodeURI(fileName));
      } else {
        const downloadUrl = window.URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = downloadUrl;
        a.download = decodeURI(fileName);
        a.click();
        a = null;
      }
    }
  },
  render() {
    const { data, fields, fileName, fetch, exportFetch } = this;
    const exportFileName = fileName ?? `${moment().format('YYYYMMDDHHmmss')}.xlsx`;
    const wrapProps = {
      props: {
        initialValue: data,
        fields,
        fileType: exportFileName.slice(exportFileName.lastIndexOf('.') + 1).toLowerCase(),
        fileName: exportFileName,
        ...this.createFetchParams(fetch),
        formatHandle: this.createDataList
      }
    };
    const cls = [
      `v-export--wrapper`,
      `size--${this.$$table.tableSize}`,
      {
        disabled: !this.$$table.total
      }
    ];
    return (
      <span
        class={cls}
        title={this.t('table.export.text')}
        onClick={() => {
          if (!exportFetch) return;
          this.exportHandle(exportFileName);
        }}
      >
        {exportFetch ? <i class="iconfont icon-export-excel" /> : <JsonToExcel type="text" {...wrapProps} />}
      </span>
    );
  }
};
