/*
 * @Author: 焦质晔
 * @Date: 2020-08-01 23:36:04
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-01-06 19:54:01
 */
import { getLodop } from '../../BasePrint/LodopFuncs';
import localforage from 'localforage';
import { merge, isObject } from 'lodash';
import Size from '../../_utils/mixins/size';
import Locale from '../../_utils/mixins/locale';
import PrefixCls from '../../_utils/mixins/prefix-cls';
import Emitter from '../../_utils/mixins/emitter';
import { getConfig } from '../../_utils/globle-config';
import config from './config';
import Print from './print';

import BaseDialog from '../../BaseDialog';
import Container from './container';
import PageSetting from './setting';

export default {
  name: 'Preview',
  mixins: [Size, Locale, PrefixCls, Emitter, Print],
  props: ['dataSource', 'templateRender', 'preview', 'uniqueKey', 'defaultConfig', 'closeOnPrinted'],
  provide() {
    return {
      $$preview: this
    };
  },
  data() {
    return {
      form: {
        printerName: -1,
        printerType: this.defaultConfig?.printerType || 'laser',
        copies: this.defaultConfig?.copies || 1,
        scale: 1,
        setting: {
          distance: {
            left: config.defaultDistance,
            right: config.defaultDistance,
            top: config.defaultDistance,
            bottom: config.defaultDistance
          },
          pageSize: '210*297',
          direction: this.defaultConfig?.direction || 'vertical',
          doubleSide: 0,
          doubleSideType: 'auto',
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
      const result = [{ text: '默认打印机', value: -1 }];
      try {
        const iPrinterCount = LODOP.GET_PRINTER_COUNT();
        for (let i = 0; i < iPrinterCount; i++) {
          result.push({ text: LODOP.GET_PRINTER_NAME(i), value: i });
        }
      } catch (err) {
        console.error(`[ClientPrint]: 请安装 LODOP 打印插件`);
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
  async created() {
    if (!this.printerKey) return;
    try {
      let res = await localforage.getItem(this.printerKey);
      if (!res) {
        res = await this.getPrintConfig(this.printerKey);
        if (isObject(res)) {
          await localforage.setItem(this.printerKey, res);
        }
      }
      if (isObject(res) && Object.keys(res).length) {
        this.form = merge({}, this.form, {
          ...res,
          printerName: this.printerItems.find(x => x.text === res.printerName)?.value ?? -1
        });
      }
    } catch (err) {}
  },
  methods: {
    settingChange(val) {
      this.form.setting = val;
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
        const printConfig = {
          ...this.form,
          printerName: this.printerItems.find(x => x.value === this.form.printerName).text
        };
        await localforage.setItem(this.printerKey, printConfig);
        await this.savePrintConfig(this.printerKey, printConfig);
      } catch (err) {}
    },
    async getPrintConfig(key) {
      if (process.env.MOCK_DATA === 'true') return;
      const fetchFn = getConfig('getComponentConfigApi');
      if (!fetchFn) return;
      try {
        const res = await fetchFn({ key });
        if (res.code === 200) {
          return res.data;
        }
      } catch (err) {}
      return null;
    },
    async savePrintConfig(key, value) {
      if (process.env.MOCK_DATA === 'true') return;
      const fetchFn = getConfig('saveComponentConfigApi');
      if (!fetchFn) return;
      try {
        await fetchFn({ [key]: value });
      } catch (err) {}
    },
    doClose() {
      this.$emit('close', !0);
    }
  },
  render() {
    const { form, preview, printerTypeItems, printerItems, currentPage, totalPage, visible, pageSize, dataSource, templateRender } = this;
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
    return preview ? (
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
            <Container ref="container" dataSource={dataSource} templateRender={templateRender} directPrint={!1} />
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
    ) : (
      <Container ref="container" dataSource={dataSource} templateRender={templateRender} directPrint={!0} />
    );
  }
};
