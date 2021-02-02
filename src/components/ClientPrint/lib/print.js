/*
 * @Author: 焦质晔
 * @Date: 2020-08-02 15:37:32
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-02-01 13:51:33
 */
import { getLodop } from '../../BasePrint/LodopFuncs';
import dayjs from 'dayjs';
import config from './config';

export default {
  methods: {
    createStyle() {
      return `
        <style type="text/css">
          table {
            width: 100%;
            border-spacing: 0;
            border-collapse: collapse;
            table-layout: fixed;
          }
          table tr td {
            padding: 2px;
            line-height: 1.2;
            word-wrap: break-word;
          }
          .fs12 {
            font-size: 12px;
          }
          .fs13 {
            font-size: 13px;
          }
          .fs14 {
            font-size: 14px;
          }
          .fw500 {
            font-weight: 500;
          }
          .fw700 {
            font-weight: 700;
          }
          .fl {
            float: left;
          }
          .fr {
            float: right;
          }
          .tc {
            text-align: center;
          }
          .tr {
            text-align: right;
          }
          .bor {
            border: 1px solid #000;
          }
          .bor-t {
            border-top: 1px solid #000;
          }
          .bor-b {
            border-bottom: 1px solid #000;
          }
          .bor-l {
            border-left: 1px solid #000;
          }
          .bor-r {
            border-right: 1px solid #000;
          }
          .no-bor {
            border: none !important;
          }
        </style>
      `;
    },
    doPrint(__html__) {
      const LODOP = getLodop();

      if (!LODOP) return;

      const {
        form: { setting, printerName, printerType, copies },
        pageSize,
        uniqueKey,
        closeOnPrinted
      } = this;
      const { defaultDistance } = config;
      const { left, right, top, bottom } = setting.distance;

      // 初始化
      LODOP.PRINT_INIT(
        uniqueKey ??
          Math.random()
            .toString()
            .slice(2)
      );

      // 设置打印机
      LODOP.SET_PRINTER_INDEX(printerName);

      // 指定打印份数
      LODOP.SET_PRINT_COPIES(copies);

      // 双面打印
      if (setting.doubleSide) {
        if (setting.doubleSideType === 'auto') {
          LODOP.SET_PRINT_MODE('PRINT_DUPLEX', 2);
          LODOP.SET_PRINT_MODE('PRINT_DEFAULTSOURCE', 1);
        } else {
          LODOP.SET_PRINT_MODE('DOUBLE_SIDED_PRINT', 1);
        }
      }

      // 完打印后，关闭预览窗口
      LODOP.SET_PRINT_MODE('AUTO_CLOSE_PREWINDOW', 1);

      // 激光打印机，分页
      if (printerType === 'laser') {
        // 纵向
        if (setting.direction === 'vertical') {
          LODOP.SET_PRINT_PAGESIZE(1, pageSize[0] * 10, pageSize[1] * 10, '');
        }
        // 横向
        if (setting.direction === 'horizontal') {
          LODOP.SET_PRINT_PAGESIZE(2, pageSize[0] * 10, pageSize[1] * 10, '');
          LODOP.SET_SHOW_MODE('LANDSCAPE_DEFROTATED', 1);
        }
      }

      // 针式打印机，连续打印
      if (printerType === 'stylus') {
        LODOP.SET_PRINT_PAGESIZE(3, pageSize[0] * 10, bottom * 100 * 2, '');
      }

      // 设置边距 增加表格项
      LODOP.ADD_PRINT_TABLE(
        `${(top - defaultDistance) * 10}mm`,
        `${(left - defaultDistance) * 10}mm`,
        `RightMargin: ${(right - defaultDistance) * 10}mm`,
        `BottomMargin: ${printerType !== 'stylus' ? (bottom - defaultDistance) * 10 : 0}mm`,
        this.createStyle() + __html__
      );

      // 监听事件
      LODOP.On_Return = (TaskID, Value) => {
        this.dispatch('ClientPrint', 'print', Value);
        if (Value) {
          closeOnPrinted && this.doClose();
        } else {
          this.$message.error(this.t('clientPrint.printError'));
        }
      };

      // 打印
      if (process.env.MOCK_DATA === 'true') {
        LODOP.PREVIEW();
      } else {
        LODOP.PRINT();
      }

      // // 追加打印头部
      // this.LODOP.ADD_PRINT_TABLE(0, 0, '100%', 60, css.style + this.createPrintLogo());

      // // 页眉页脚项
      // if (this.isFixedLogo) {
      //   LODOP.SET_PRINT_STYLEA(0, 'ItemType', 1);
      // }

      // // ADD_PRINT_TABLE -> 可导出
      // this.LODOP.ADD_PRINT_HTM(65, 0, 'RightMargin: 0', 'BottomMargin: 0', css.style + printHTML);

      // if (!this.isFixedLogo) {
      //   LODOP.SET_PRINT_STYLEA(0, 'Offset2Top', -60);
      // }

      // // 打印
      // !this.directPrint ? this.LODOP.PREVIEW() : this.LODOP.PRINT();
    },
    doExport(__html__) {
      const LODOP = getLodop();

      if (!LODOP) return;

      const {
        form: { setting },
        uniqueKey,
        closeOnPrinted
      } = this;

      LODOP.PRINT_INIT(
        uniqueKey ??
          Math.random()
            .toString()
            .slice(2)
      );

      LODOP.On_Return = (TaskID, Value) => {
        this.dispatch('ClientPrint', 'export', Value);
        if (Value) {
          closeOnPrinted && this.doClose();
        } else {
          this.$message.error(this.t('clientPrint.exportError'));
        }
      };

      LODOP.ADD_PRINT_TABLE(0, 0, 'RightMargin: 0', 'BottomMargin: 0', this.createStyle() + __html__);

      // 横向打印   1-纵向, 2-横向
      LODOP.SET_SAVE_MODE('Orientation', setting.direction === 'vertical' ? 1 : 2);
      // 缩放比例
      // LODOP.SET_SAVE_MODE('Zoom', 71);

      LODOP.SAVE_TO_FILE(`${dayjs().format('YYYYMMDDHHmmss')}.xlsx`);
    }
  }
};
