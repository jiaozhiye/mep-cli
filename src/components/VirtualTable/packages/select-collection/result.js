/*
 * @Author: 焦质晔
 * @Date: 2020-05-20 09:36:38
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-05-21 12:56:09
 */
import { cloneDeep } from 'lodash';
import config from '../config';
import Locale from '../locale/mixin';

import VTable from '../table';

export default {
  name: 'SelectCollectionResult',
  mixins: [Locale],
  props: ['columns', 'selectionKeys', 'selectionRows'],
  inject: ['$$table'],
  data() {
    return {
      vColumns: this.createColumns(),
      list: cloneDeep(this.selectionRows),
      selection: {
        type: 'checkbox',
        selectedRowKeys: this.selectionKeys,
        onChange: val => {
          this.$$table.selectionKeys = val;
        }
      }
    };
  },
  methods: {
    createFilterColumns(columns) {
      return columns.map(column => {
        const x = {
          dataIndex: column.dataIndex,
          title: column.title,
          width: column.width || 100,
          ...(column.precision >= 0 ? { precision: column.precision } : null),
          dictItems: column.dictItems ?? []
        };
        if (Array.isArray(column.children)) {
          x.children = this.createFilterColumns(column.children);
        }
        return x;
      });
    },
    createColumns() {
      return this.createFilterColumns(this.columns.filter(x => !['__expandable__', 'index', 'pageIndex', config.operationColumn].includes(x.dataIndex)));
    },
    cancelHandle() {
      this.$emit('close', false);
    }
  },
  render() {
    const { vColumns, list, selection } = this;
    const { rowKey } = this.$$table;
    return (
      <div>
        <VTable
          dataSource={list}
          columns={vColumns}
          rowKey={rowKey}
          rowSelection={selection}
          minHeight={300}
          webPagination={true}
          showFullScreen={false}
          showColumnDefine={false}
          columnsChange={columns => (this.vColumns = columns)}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            right: 0,
            zIndex: 9,
            borderTop: '1px solid #d9d9d9',
            padding: '10px 15px',
            background: '#fff',
            textAlign: 'right'
          }}
        >
          <el-button onClick={() => this.cancelHandle()}>{this.t('table.selectCollection.closeButton')}</el-button>
        </div>
      </div>
    );
  }
};
