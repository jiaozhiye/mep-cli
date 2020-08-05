/*
 * @Author: 焦质晔
 * @Date: 2020-08-02 15:37:32
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-08-03 20:39:10
 */
import { getLodop } from '../../BasePrint/LodopFuncs';
import config from './config';

export default {
  methods: {
    createStyle() {
      return `
        <style type="text/css">
          table {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
          }
          table tr td {
            padding: 4px;
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
        pageSize
      } = this;
      const { left, right, top, bottom } = setting.distance;

      // 初始化
      LODOP.PRINT_INIT(
        this.uniqueKey ??
          Math.random()
            .toString()
            .slice(2)
      );

      // 纵向
      if (setting.direction === 'vertical') {
        // 按内容走纸，连续打印
        if (printerType === 'stylus') {
          LODOP.SET_PRINT_PAGESIZE(3, pageSize[0] * 10, 0, ''); // 9mm -> 打印的下边距
        } else {
          // 整张打印
          LODOP.SET_PRINT_PAGESIZE(1, pageSize[0] * 10, pageSize[1] * 10, '');
        }
      }

      // 横向
      if (setting.direction === 'horizontal') {
        LODOP.SET_PRINT_PAGESIZE(2, pageSize[0] * 10, pageSize[1] * 10, '');
        LODOP.SET_SHOW_MODE('LANDSCAPE_DEFROTATED', 1);
      }

      // 设置打印机
      LODOP.SET_PRINTER_INDEX(printerName);

      // 指定打印份数
      LODOP.SET_PRINT_COPIES(copies);

      // 双面打印
      LODOP.SET_PRINT_MODE('DOUBLE_SIDED_PRINT', !!setting.doubleSide);

      // 设置设置完打印后 是否关闭预览窗口;
      LODOP.SET_PRINT_MODE('AUTO_CLOSE_PREWINDOW', 1);

      // 设置边距 增加表格项
      LODOP.ADD_PRINT_TABLE(
        `${(top - config.defaultDistance) * 10}mm`,
        `${(left - config.defaultDistance) * 10}mm`,
        `RightMargin: ${(right - config.defaultDistance) * 10}mm`,
        `BottomMargin: ${(bottom - config.defaultDistance) * 10}mm`,
        this.createStyle() + __html__
      );

      // 打印
      LODOP.PREVIEW();

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
      const uniqueKey =
        this.uniqueKey ??
        Math.random()
          .toString()
          .slice(2);
      LODOP.PRINT_INIT(uniqueKey);
      LODOP.ADD_PRINT_TABLE(0, 0, 'RightMargin: 0', 'BottomMargin: 0', this.createStyle() + __html__);
      LODOP.SAVE_TO_FILE(`${uniqueKey}.xlsx`);
    }
  }
};
