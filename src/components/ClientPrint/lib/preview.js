/*
 * @Author: 焦质晔
 * @Date: 2020-08-01 23:36:04
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-08-10 10:49:44
 */
import { getLodop } from '../../BasePrint/LodopFuncs';
import localforage from 'localforage';
import Size from '../../_utils/mixins/size';
import Locale from '../../_utils/mixins/locale';
import PrefixCls from '../../_utils/mixins/prefix-cls';
import Emitter from '../../_utils/mixins/emitter';
import config from './config';
import Print from './print';

import BaseDialog from '../../BaseDialog';
import Container from './container';
import PageSetting from './setting';

export default {
  name: 'Preview',
  mixins: [Size, Locale, PrefixCls, Emitter, Print],
  props: ['dataSource', 'templateRender', 'uniqueKey', 'closeOnPrinted'],
  provide() {
    return {
      $$preview: this
    };
  },
  data() {
    return {
      form: {
        printerName: -1,
        printerType: 'laser',
        copies: 1,
        scale: 1,
        setting: {
          distance: {
            left: config.defaultDistance,
            right: config.defaultDistance,
            top: config.defaultDistance,
            bottom: config.defaultDistance
          },
          pageSize: '210*297',
          direction: 'vertical',
          doubleSide: 0,
          fixedLogo: 0
        }
      },
      printPage: undefined,
      currentPage: 1,
      totalPage: 0,
      visible: !1
    };
  },
  computed: {
    $$container() {
      return this.$refs[`container`];
    },
    printerTypeItems() {
      return [
        { text: '激光打印机', value: 'laser' },
        { text: '针式打印机', value: 'stylus' }
      ];
    },
    printerItems() {
      const LODOP = getLodop();
      const iPrinterCount = LODOP.GET_PRINTER_COUNT();
      const result = [{ text: '默认打印机', value: -1 }];
      for (let i = 0; i < iPrinterCount; i++) {
        result.push({ text: LODOP.GET_PRINTER_NAME(i), value: i });
      }
      return result;
    },
    isWindowsPrinter() {
      const {
        printerItems,
        form: { printerName }
      } = this;
      // Windows 内置打印机
      const regExp = /OneNote|Microsoft|Fax/;
      return !regExp.test(printerItems.find(x => x.value === printerName).text);
    },
    pageSize() {
      return this.form.setting.pageSize.split('*').map(x => Number(x));
    },
    printerKey() {
      return this.uniqueKey ? `cprint_${this.uniqueKey}` : '';
    }
  },
  methods: {
    settingChange(val) {
      this.form.setting = Object.assign({}, val);
    },
    printerTypeChange(val) {
      this.form.setting.pageSize = val === 'stylus' ? '241*280' : '210*297';
    },
    pageChangeHandle(val) {
      this.currentPage = val;
      this.$$container.createPreviewDom();
    },
    exportClickHandle() {
      this.doExport(this.$$container.createExportHtml());
    },
    async printClickHandle() {
      this.doPrint(this.$$container.createPrintHtml(this.printPage));
      // 存储配置信息
      try {
        await localforage.setItem(this.printerKey, {
          ...this.form,
          printerName: this.printerItems.find(x => x.value === this.form.printerName).text
        });
      } catch (err) {}
    }
  },
  async created() {
    if (!this.printerKey) return;
    try {
      const res = await localforage.getItem(this.printerKey);
      if (Object.keys(res).length) {
        this.form = Object.assign({}, this.form, {
          ...res,
          printerName: this.printerItems.find(x => x.text === res.printerName)?.value ?? -1
        });
      }
    } catch (err) {}
  },
  render() {
    const { form, printerTypeItems, printerItems, currentPage, totalPage, visible, pageSize, dataSource, templateRender } = this;
    const prefixCls = this.getPrefixCls('cpreview--wrapper');
    const dialogProps = {
      props: {
        visible,
        title: this.t('clientPrint.pageSetting'),
        width: '50%',
        showFullScreen: false,
        destroyOnClose: true,
        containerStyle: { height: 'calc(100% - 52px)', paddingBottom: '52px' }
      },
      on: {
        'update:visible': val => (this.visible = val)
      }
    };
    const cls = {
      [prefixCls]: true,
      [`${prefixCls}-sm`]: this.currentSize === 'small',
      [`${prefixCls}-lg`]: this.currentSize === 'large'
    };
    return (
      <div class={cls}>
        <div class="outer">
          <div class="header">
            <span>
              打印机：
              <el-select v-model={form.printerName} style={{ width: '200px' }}>
                {printerItems.map(x => (
                  <el-option key={x.value} label={x.text} value={x.value} />
                ))}
              </el-select>
            </span>
            <span>
              打印类型：
              <el-select v-model={form.printerType} style={{ width: '120px' }} onChange={this.printerTypeChange}>
                {printerTypeItems.map(x => (
                  <el-option key={x.value} label={x.text} value={x.value} />
                ))}
              </el-select>
            </span>
            <span>
              份数：
              <el-input-number v-model={form.copies} controls={!1} min={1} precision={0} style={{ width: '50px' }} />
            </span>
            <span>
              打印第
              <el-input-number v-model={this.printPage} controls={!1} min={1} max={totalPage} precision={0} style={{ width: '50px', marginLeft: '4px', marginRight: '4px' }} />页
            </span>
            <span>
              <el-pagination
                {...{
                  props: {
                    currentPage,
                    pageCount: totalPage,
                    pagerCount: 5,
                    layout: 'prev, pager, next'
                  },
                  on: {
                    [`current-change`]: this.pageChangeHandle
                  }
                }}
                style={{ paddingLeft: 0, paddingRight: 0 }}
              />
            </span>
            <span>
              <el-button type="text" icon="el-icon-setting" onClick={() => (this.visible = !0)}>
                设置
              </el-button>
            </span>
            <span>
              <el-button type="text" icon="iconfont icon-export-excel" onClick={this.exportClickHandle}>
                导出
              </el-button>
            </span>
            <span>
              <el-button icon="el-icon-printer" type="primary" onClick={this.printClickHandle}>
                打印
              </el-button>
            </span>
          </div>
          <div class="main">
            <Container ref="container" dataSource={dataSource} templateRender={templateRender} />
          </div>
          <div class="footer">
            <span>
              缩放：
              <el-slider v-model={form.scale} step={0.1} min={0.5} max={1.5} show-tooltip={!1} />
              <em class="scale-text">{`${Math.floor(form.scale * 100)}%`}</em>
            </span>
            <span>
              纸张：{pageSize[0]}mm * {pageSize[1]}mm
            </span>
            <span>
              页码：第{currentPage}页 / 共{totalPage}页
            </span>
          </div>
        </div>
        <BaseDialog {...dialogProps}>
          <PageSetting setting={form.setting} onChange={this.settingChange} onClose={val => (this.visible = val)} />
        </BaseDialog>
      </div>
    );
  }
};
