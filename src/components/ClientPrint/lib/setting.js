/*
 * @Author: 焦质晔
 * @Date: 2020-08-02 08:04:15
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-01-06 20:28:55
 */
import Locale from '../../_utils/mixins/locale';
import config from './config';

import FormPanel from '../../FormPanel';

export default {
  name: 'PageSetting',
  mixins: [Locale],
  props: ['setting'],
  data() {
    return {
      initialValue: this.getInitialvalue(),
      formList: this.createFormList()
    };
  },
  methods: {
    getInitialvalue() {
      const { setting } = this;
      const { distance } = setting;
      return Object.assign(
        {},
        {
          disleft: distance.left,
          disright: distance.right,
          distop: distance.top,
          disbottom: distance.bottom,
          pageSize: setting.pageSize,
          direction: setting.direction,
          doubleSide: setting.doubleSide,
          doubleSideType: setting.doubleSideType,
          fixedLogo: setting.fixedLogo
        }
      );
    },
    createFormList() {
      return [
        {
          type: 'BREAK_SPACE',
          label: '打印参数'
        },
        {
          type: 'SELECT',
          label: '纸张类型',
          fieldName: 'pageSize',
          options: {
            itemList: [
              { text: 'A2', value: '420*594' },
              { text: 'A3', value: '420*297' },
              { text: 'A4', value: '210*297' },
              { text: 'A5', value: '210*148' },
              { text: '三联复写纸(针式)', value: '241*280' }
            ]
          }
        },
        {
          type: 'RADIO',
          label: '打印方向',
          fieldName: 'direction',
          options: {
            itemList: [
              { text: '纵向', value: 'vertical' },
              { text: '横向', value: 'horizontal' }
            ]
          }
        },
        {
          type: 'CHECKBOX',
          label: '双面打印',
          fieldName: 'doubleSide',
          labelOptions: {
            type: 'SELECT',
            fieldName: 'doubleSideType',
            options: {
              itemList: [
                { text: '自动双面打印', value: 'auto' },
                { text: '手动双面打印', value: 'manual' }
              ]
            },
            disabled: !this.setting.doubleSide
          },
          options: {
            trueValue: 1,
            falseValue: 0
          },
          onChange: val => {
            this.formList.find(x => x.fieldName === 'doubleSide').labelOptions.disabled = !val;
          }
        },
        {
          type: 'CHECKBOX',
          label: '固定Logo',
          fieldName: 'fixedLogo',
          options: {
            trueValue: 1,
            falseValue: 0
          }
        },
        {
          type: 'BREAK_SPACE',
          label: '打印边距'
        },
        {
          type: 'INPUT_NUMBER',
          label: '左边距',
          fieldName: 'disleft',
          options: {
            min: config.defaultDistance,
            step: 0.05,
            precision: 2,
            controls: true
          },
          style: { width: `calc(100% - 50px)` },
          descOptions: {
            content: '厘米'
          },
          rules: [{ required: true, message: '不能为空', trigger: 'change' }]
        },
        {
          type: 'INPUT_NUMBER',
          label: '右边距',
          fieldName: 'disright',
          options: {
            min: config.defaultDistance,
            step: 0.05,
            precision: 2,
            controls: true
          },
          style: { width: `calc(100% - 50px)` },
          descOptions: {
            content: '厘米'
          },
          rules: [{ required: true, message: '不能为空', trigger: 'change' }]
        },
        {
          type: 'INPUT_NUMBER',
          label: '上边距',
          fieldName: 'distop',
          options: {
            min: config.defaultDistance,
            step: 0.05,
            precision: 2,
            controls: true
          },
          style: { width: `calc(100% - 50px)` },
          descOptions: {
            content: '厘米'
          },
          rules: [{ required: true, message: '不能为空', trigger: 'change' }]
        },
        {
          type: 'INPUT_NUMBER',
          label: '下边距',
          fieldName: 'disbottom',
          options: {
            min: config.defaultDistance,
            step: 0.05,
            precision: 2,
            controls: true
          },
          style: { width: `calc(100% - 50px)` },
          descOptions: {
            content: '厘米'
          },
          rules: [{ required: true, message: '不能为空', trigger: 'change' }]
        }
      ];
    },
    async confirmHandle() {
      const [err, data] = await this.$refs.formPanel.GET_FORM_DATA();
      if (err) return;
      this.$emit('change', {
        distance: { left: data.disleft, right: data.disright, top: data.distop, bottom: data.disbottom },
        pageSize: data.pageSize,
        direction: data.direction,
        doubleSide: data.doubleSide,
        doubleSideType: data.doubleSideType,
        fixedLogo: data.fixedLogo
      });
      this.cancelHandle();
    },
    cancelHandle() {
      this.$emit('close', false);
    }
  },
  render() {
    const { initialValue, formList } = this;
    return (
      <div>
        <FormPanel ref="formPanel" initialValue={initialValue} list={formList} cols={2} labelWidth={115} />
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
          <el-button onClick={() => this.cancelHandle()}>{this.t('clientPrint.close')}</el-button>
          <el-button type="primary" onClick={() => this.confirmHandle()}>
            {this.t('clientPrint.confirm')}
          </el-button>
        </div>
      </div>
    );
  }
};
