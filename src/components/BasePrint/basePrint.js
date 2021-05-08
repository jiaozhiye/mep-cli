/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-05-08 10:38:23
 **/
import { getLodop } from './LodopFuncs';
import css from './style.js';
import PropTypes from '../_utils/vue-types';
import PrefixCls from '../_utils/mixins/prefix-cls';

export default {
  name: 'BasePrint',
  mixins: [PrefixCls],
  props: {
    data: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired, // 打印数据
    template: PropTypes.string.def(''),
    render: PropTypes.func.def(() => {}),
    printerType: PropTypes.oneOf(['laser', 'stylus']).def('laser'), // 默认激光打印机
    direction: PropTypes.oneOf(['vertical', 'horizontal']).def('vertical'), // 默认纵向打印
    printCopies: PropTypes.number, // 打印份数
    doubleSide: PropTypes.bool.def(false), // 双面打印
    directPrint: PropTypes.bool.def(false), // 直接打印
    exportExcel: PropTypes.shape({
      fileName: PropTypes.string.isRequired // 导出的文件名，需包含扩展名[xlsx]
    }),
    isFixedLogo: PropTypes.bool.def(false), // 固定 Logo
    isPreview: PropTypes.bool.def(false)
  },
  data() {
    this.LODOP = null;
    // 打印纸尺寸
    this.pageSize = this.printerType === 'laser' ? [2100, 2970] : [2410, 2800];
    return {
      state: 'stop'
    };
  },
  computed: {
    // unique key
    uniqueKey() {
      return `sheet-${+new Date()}`;
    },
    templatePath() {
      if (!this.template) return null;
      return this.template.endsWith('.vue') ? this.template : `${this.template}.vue`;
    }
  },
  created() {
    // 动态加载组件
    this.$options.component = this.templatePath ? () => import(`@/pages/printTemplate/${this.templatePath}`) : this.render;
  },
  destroyed() {
    // 释放内存
    this.LODOP = null;
  },
  methods: {
    getPrintTable(_html_) {
      // 处理分页符
      _html_ = this.createPageBreak(_html_);
      // 页面预览
      if (this.isPreview) {
        this.createPreviewNodes(css.style + _html_);
      } else {
        // 执行打印
        this.createPrintPage(_html_);
      }
    },
    createPrintPage(printHTML) {
      if (!this.LODOP) {
        this.LODOP = getLodop();
      }

      if (!this.LODOP) return;

      this.LODOP.PRINT_INIT(this.uniqueKey);

      // 指定打印份数
      if (typeof this.printCopies !== 'undefined') {
        this.LODOP.SET_PRINT_COPIES(this.printCopies);
      }

      // 双面打印
      if (this.doubleSide) {
        LODOP.SET_PRINT_MODE('DOUBLE_SIDED_PRINT', 1);
      }

      // 针式打印机，连续打印
      if (this.printerType === 'stylus') {
        this.LODOP.SET_PRINT_PAGESIZE(3, this.pageSize[0], 90, '');
      }

      // 激光打印机，分页
      if (this.printerType === 'laser') {
        // 纵向
        if (this.direction === 'vertical') {
          LODOP.SET_PRINT_PAGESIZE(1);
        }
        // 横向
        if (setting.direction === 'horizontal') {
          LODOP.SET_PRINT_PAGESIZE(2);
          LODOP.SET_SHOW_MODE('LANDSCAPE_DEFROTATED', 1);
        }
      }

      // 设置设置完打印后 是否关闭预览窗口;
      this.LODOP.SET_PRINT_MODE('AUTO_CLOSE_PREWINDOW', 1);

      // 追加打印头部
      this.LODOP.ADD_PRINT_TABLE(0, 0, '100%', 60, css.style + this.createPrintLogo());

      // 页眉页脚项
      if (this.isFixedLogo) {
        LODOP.SET_PRINT_STYLEA(0, 'ItemType', 1);
      }

      // ADD_PRINT_TABLE -> 可导出
      this.LODOP.ADD_PRINT_HTM(65, 0, 'RightMargin: 0', 'BottomMargin: 0', css.style + printHTML);

      if (!this.isFixedLogo) {
        LODOP.SET_PRINT_STYLEA(0, 'Offset2Top', -60);
      }

      // 打印
      !this.directPrint ? this.LODOP.PREVIEW() : this.LODOP.PRINT();
    },
    createPrintLogo() {
      // 如果出现图片加载的问题，换成 base64 格式
      const logoHtml = `
        <table class="no-bor">
          <tr>
            <td width="100%" class="no-bor">
              <img src="/static/img/logo_l.png" border="0" height="26" class="fl" style="margin-top: 15px; margin-left: 10px;" />
              <img src="/static/img/logo_r.png" border="0" height="38" class="fr" style="margin-top: 10px; margin-right: 10px;" />
            </td>
          </tr>
        </table>
      `;
      return logoHtml;
    },
    createPageBreak(_html_) {
      // 正则处理分页符，vue 的 template 把 page-break-after 改成了 break-after，
      // 因此需要替换回来
      const RegExp = /break-after:\s*page/g;
      const pageBreakMark = `page-break-after: always`;
      return _html_.replace(RegExp, pageBreakMark);
    },
    createPrintComponent(h) {
      return h(this.$options.component, {
        props: {
          data: this.data
        },
        on: {
          onPrintTable: this.getPrintTable
        }
      });
    },
    createPreviewNodes(_html_) {
      const $target = document.body.querySelector('.v-lodop-print--preview');
      if (!$target) {
        let $wrapper = document.createElement('div');
        $wrapper.className = 'v-lodop-print--preview';
        $wrapper.innerHTML = _html_;
        document.body.appendChild($wrapper);
        $wrapper = null;
      } else {
        $target.innerHTML = _html_;
      }
    },
    EXCUTE_PRINT() {
      this.state = 'start';
      setTimeout(() => (this.state = 'stop'), 500);
    }
  },
  render(h) {
    const prefixCls = this.getPrefixCls('bprint--wrapper');
    const cls = {
      [prefixCls]: true
    };
    const vNode = this.state === 'start' ? this.createPrintComponent(h) : null;
    return <div class={cls}>{vNode}</div>;
  }
};
