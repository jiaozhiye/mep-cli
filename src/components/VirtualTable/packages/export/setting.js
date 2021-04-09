/*
 * @Author: 焦质晔
 * @Date: 2021-04-07 08:23:32
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-04-08 16:26:31
 */
import dayjs from 'dayjs';
import { sleep } from '../utils';
import Locale from '../locale/mixin';

import Form from '../../../FormPanel';

export default {
  name: 'ExportSetting',
  props: ['defaultValue'],
  inject: ['$$table'],
  mixins: [Locale],
  data() {
    return {
      loading: false,
      initialValue: this.getInitialvalue(),
      formList: this.createFormList()
    };
  },
  methods: {
    getInitialvalue() {
      return Object.assign(
        {},
        {
          fieldName: `${dayjs().format('YYYYMMDDHHmmss')}.xlsx`,
          fileType: 'xlsx',
          sheetName: 'sheet1',
          exportType: 'all',
          'startIndex|endIndex': [1, this.$$table.total],
          footSummation: 1,
          useStyle: 0
        },
        this.defaultValue
      );
    },
    createFormList() {
      return [
        {
          type: 'INPUT',
          label: this.t('table.export.fileName'),
          fieldName: 'fileName'
        },
        {
          type: 'SELECT',
          label: this.t('table.export.fileType'),
          fieldName: 'fileType',
          options: {
            itemList: [
              { text: 'xlsx', value: 'xlsx' },
              { text: 'csv', value: 'csv' }
            ]
          }
        },
        {
          type: 'INPUT',
          label: this.t('table.export.sheetName'),
          fieldName: 'sheetName'
        },
        {
          type: 'RANGE_INPUT_NUMBER',
          label: '',
          fieldName: 'startIndex|endIndex',
          labelOptions: {
            type: 'SELECT',
            fieldName: 'exportType',
            options: {
              itemList: [
                { text: this.t('table.export.all'), value: 'all' },
                { text: this.t('table.export.selected'), value: 'selected', disabled: this.$$table.rowSelection?.type !== 'checkbox' },
                { text: this.t('table.export.custom'), value: 'custom' }
              ]
            },
            onChange: val => {
              this.formList.find(x => x.fieldName === 'startIndex|endIndex').disabled = val !== 'custom';
            }
          },
          options: {
            min: 1
          },
          disabled: true
        },
        {
          type: 'CHECKBOX',
          label: this.t('table.export.footSummation'),
          fieldName: 'footSummation',
          options: {
            trueValue: 1,
            falseValue: 0
          }
        },
        {
          type: 'CHECKBOX',
          label: this.t('table.export.useStyle'),
          fieldName: 'useStyle',
          options: {
            trueValue: 1,
            falseValue: 0
          }
        }
      ];
    },
    cancelHandle() {
      this.$emit('close', false);
    },
    async confirmHandle() {
      const [err, data] = await this.$refs[`form`].GET_FORM_DATA();
      if (err) return;
      this.loading = !0;
      for (let key in data) {
        if (key === 'footSummation' || key === 'useStyle') {
          data[key] = !!data[key];
        }
      }
      this.$emit('change', data);
      await sleep(500);
      this.loading = !1;
      this.cancelHandle();
    }
  },
  render() {
    const { initialValue, formList, loading } = this;
    return (
      <div>
        <Form ref="form" initialValue={initialValue} list={formList} cols={1} labelWidth={110} />
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
          <el-button onClick={() => this.cancelHandle()}>{this.t('table.export.closeButton')}</el-button>
          <el-button type="primary" loading={loading} onClick={() => this.confirmHandle()}>
            {this.t('table.export.text')}
          </el-button>
        </div>
      </div>
    );
  }
};
