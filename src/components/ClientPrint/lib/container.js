/*
 * @Author: 焦质晔
 * @Date: 2020-08-02 09:34:35
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-12-19 12:30:53
 */
import { sleep } from '../../_utils/tool';
import { mmToPx, pxToMm, insertBefore, isPageBreak } from './utils';
import PrefixCls from '../../_utils/mixins/prefix-cls';
import config from './config';

import Spin from '../../Spin';

export default {
  name: 'Container',
  mixins: [PrefixCls],
  props: ['dataSource', 'templateRender', 'directPrint'],
  inject: ['$$preview'],
  data() {
    return {
      loading: !0,
      elementHeights: [], // tr 高度数组
      elementHtmls: [], // tr 标签片段数组
      previewHtmls: [] // 预览显示的 html 数组，用于分页展示
    };
  },
  computed: {
    templateEl() {
      return this.$el.querySelector('.origin-template').children[0];
    },
    previewEl() {
      return this.$el.querySelector('.workspace');
    },
    pagePrintWidth() {
      const {
        pageSize,
        isWindowsPrinter,
        form: {
          setting: { direction }
        }
      } = this.$$preview;
      const paddingX = isWindowsPrinter ? config.defaultDistance * 10 + config.defaultDistance * 10 : 0;
      const pageWidth = direction === 'vertical' ? pageSize[0] : pageSize[1];
      return pageWidth - paddingX;
    },
    pagePrintHeight() {
      const {
        pageSize,
        isWindowsPrinter,
        form: {
          setting: { direction }
        }
      } = this.$$preview;
      const paddingY = isWindowsPrinter ? config.defaultDistance * 10 + config.defaultDistance * 10 : 0;
      const pageHeight = direction === 'vertical' ? pageSize[1] : pageSize[0];
      return pageHeight - paddingY;
    },
    workspaceWidth() {
      const { distance } = this.$$preview.form.setting;
      return mmToPx(this.pagePrintWidth - (distance.left - config.defaultDistance) * 10 - (distance.right - config.defaultDistance) * 10);
    },
    workspaceHeight() {
      const { distance } = this.$$preview.form.setting;
      return mmToPx(this.pagePrintHeight - (distance.top - config.defaultDistance) * 10 - (distance.bottom - config.defaultDistance) * 10);
    },
    scaleSize() {
      return this.$$preview.form.scale;
    },
    pageDistance() {
      const {
        form: {
          setting: { distance }
        }
      } = this.$$preview;
      return {
        left: mmToPx(distance.left * 10),
        right: mmToPx(distance.right * 10),
        top: mmToPx(distance.top * 10),
        bottom: mmToPx(distance.bottom * 10)
      };
    },
    workspaceStyle() {
      const {
        form: { printerType }
      } = this.$$preview;
      const offsetWidth = this.workspaceWidth + this.pageDistance.left + this.pageDistance.right;
      const defaultOffsetLeft = config.previewWidth - offsetWidth <= 0 ? 0 : (config.previewWidth - offsetWidth) / 2;
      const stepOffsetLeft = Math.abs(((1 - this.scaleSize) * offsetWidth) / 2);
      let offsetLeft = 0;
      if (this.scaleSize > 1) {
        offsetLeft = stepOffsetLeft > defaultOffsetLeft ? -1 * defaultOffsetLeft : -1 * stepOffsetLeft;
      }
      if (this.scaleSize < 1) {
        offsetLeft = offsetWidth - stepOffsetLeft * 2 > config.previewWidth ? 0 : defaultOffsetLeft > 0 ? stepOffsetLeft : (config.previewWidth - (offsetWidth - stepOffsetLeft * 2)) / 2;
      }
      return {
        width: `${this.workspaceWidth}px`,
        height: `${printerType === 'stylus' ? 'auto' : this.workspaceHeight + 'px'}`,
        paddingLeft: `${this.pageDistance.left}px`,
        paddingRight: `${this.pageDistance.right}px`,
        paddingTop: `${this.pageDistance.top}px`,
        paddingBottom: `${this.pageDistance.bottom}px`,
        transform: `translateX(${offsetLeft}px) scale(${this.scaleSize})`,
        opacity: this.loading ? 0 : 1
      };
    },
    isManualPageBreak() {
      return this.elementHtmls.some(x => isPageBreak(x));
    }
  },
  watch: {
    workspaceHeight() {
      this.createWorkspace();
    },
    [`$$preview.form.setting.fixedLogo`]() {
      this.createWorkspace();
    }
  },
  mounted() {
    if (this.directPrint) {
      document.body.appendChild(this.$el);
    }
  },
  destroyed() {
    if (this.directPrint && this.$el && this.$el.parentNode) {
      this.$el.parentNode.removeChild(this.$el);
    }
  },
  methods: {
    createPageBreak() {
      return `<tr type="page-break" style="page-break-after: always;"></tr>`;
    },
    createLogo() {
      const __html__ = [
        `<tr style="height: ${config.logoHeight}px;">`,
        `<td colspan="12" align="left">`,
        `<img src="/static/img/logo_l.png" border="0" height="26" style="margin-left: 10px;" />`,
        `</td>`,
        `<td colspan="12" align="right">`,
        `<img src="/static/img/logo_r.png" border="0" height="38" style="margin-right: 10px;" />`,
        `</td>`,
        `</tr>`
      ];
      return __html__.join('');
    },
    createTdCols() {
      let __html__ = '<tr style="height: 0;">';
      // 24 栅格列
      for (let i = 0; i < 24; i++) {
        __html__ += `<td width="${100 / 24}%" style="width: ${100 / 24}%; padding: 0;"></td>`;
      }
      __html__ += '</tr>';
      return __html__;
    },
    createTemplateCols() {
      let oNewTr = document.createElement('tr');
      oNewTr.setAttribute('type', 'template-cols');
      oNewTr.style.height = 0;
      oNewTr.innerHTML = this.createTdCols()
        .replace(/<tr[^>]+>/, '')
        .replace(/<\/tr>/, '');
      insertBefore(oNewTr, this.templateEl);
      oNewTr = null;
    },
    createNodeStyle() {
      const allTableTrs = this.templateEl.children;
      for (let i = 0; i < allTableTrs.length; i++) {
        let type = allTableTrs[i].getAttribute('type');
        if (type === 'template-cols') continue;
        let height = allTableTrs[i].clientHeight;
        allTableTrs[i].style.height = height + 'px';
        this.elementHeights.push(height);
        this.elementHtmls.push(allTableTrs[i].outerHTML);
      }
    },
    createWorkspace() {
      if (!this.elementHtmls.length) return;

      const {
        form: { setting, printerType }
      } = this.$$preview;

      // 直接打印
      if (this.directPrint) {
        return this.previewHtmls.push([this.createTdCols(), this.createLogo(), ...this.elementHtmls]);
      }

      // 页面高度
      let pageHeight = setting.fixedLogo ? this.workspaceHeight - config.logoHeight : this.workspaceHeight;

      // 临时数组
      let tmpArr = [];
      this.previewHtmls = [];

      // 针式打印机  连续打印
      if (printerType === 'stylus') {
        this.previewHtmls.push([this.createTdCols(), ...(setting.fixedLogo ? [this.createLogo()] : []), ...this.elementHtmls]);
      } else {
        let sum = 0;
        for (let i = 0, len = this.elementHeights.length; i < len; i++) {
          const item = this.elementHtmls[i];
          const h = this.elementHeights[i];

          if (!setting.fixedLogo && i === 0) {
            sum += config.logoHeight;
          }

          sum += h;

          // 计算
          if (sum <= pageHeight) {
            tmpArr.push(item);
          } else {
            this.previewHtmls.push([this.createTdCols(), ...(setting.fixedLogo ? [this.createLogo()] : []), ...tmpArr]);
            tmpArr = [];
            sum = 0;
            i -= 1;
          }

          // 最后一页
          if (i === len - 1 && tmpArr.length) {
            this.previewHtmls.push([this.createTdCols(), ...(setting.fixedLogo ? [this.createLogo()] : []), ...tmpArr]);
          }
        }
      }

      // 不固定 logo
      if (!setting.fixedLogo) {
        this.previewHtmls[0]?.splice(1, 0, this.createLogo());
      }

      // 分页符
      for (let i = 0, len = this.previewHtmls.length; i < len; i++) {
        if (i === len - 1) break;
        this.previewHtmls[i].push(this.createPageBreak());
      }

      // 处理分页
      this.$$preview.currentPage = 1;
      this.$$preview.totalPage = this.previewHtmls.length;

      // 预览
      this.createPreviewDom();
    },
    createPreviewDom() {
      const { currentPage } = this.$$preview;
      let __html__ = `<table cellspacing="0" cellpadding="0" border="0" class="${this.templateEl.className}">`;
      __html__ += this.previewHtmls[currentPage - 1]?.join('') ?? '';
      __html__ += `</table>`;
      this.previewEl.innerHTML = __html__;
      // 滚动条返回顶部
      this.previewEl.parentNode.scrollTop = 0;
    },
    createPrintHtml(printPageNumber) {
      let __html__ = `<table cellspacing="0" cellpadding="0" border="0" class="${this.templateEl.className}">`;
      if (typeof printPageNumber !== 'undefined') {
        let curData = [...this.previewHtmls[printPageNumber - 1]];
        __html__ += curData.join('');
      } else {
        for (let i = 0; i < this.previewHtmls.length; i++) {
          __html__ += this.previewHtmls[i].join('');
        }
      }
      __html__ += `</table>`;
      return __html__;
    },
    createExportHtml() {
      let exportHtmls = [];
      for (let i = 0; i < this.elementHtmls.length; i++) {
        exportHtmls[i] = this.elementHtmls[i]
          .replace(/[\r\n]/g, '')
          .replace(/\s+/g, ' ')
          .replace(/(<td[^>]+>)\s+/, '$1')
          .replace(/\s+(<\/td>)/, '$1');
      }
      return '<table>' + this.createLogo() + this.createTdCols() + exportHtmls.join('') + '</table>';
    },
    // 加载完成打印模板组件，创建预览工作区
    async SHOW_PREVIEW() {
      if (this.templateEl?.tagName !== 'TABLE') {
        return this.throwError();
      }
      if (this.previewEl.innerHTML) return;
      this.createTemplateCols();
      await sleep(0);
      this.createNodeStyle();
      this.createWorkspace();
      this.loading = !1;
    },
    async DIRECT_PRINT() {
      if (this.templateEl?.tagName !== 'TABLE') {
        return this.throwError();
      }
      this.createTemplateCols();
      await sleep(0);
      this.createNodeStyle();
      this.createWorkspace();
      this.loading = !1;
      this.$$preview.doPrint(this.createPrintHtml());
      await sleep(0);
      this.$$preview.doClose();
    },
    throwError() {
      console.error('[PrintTemplate] 打印模板组件的根元素必须是 `table` 节点');
    }
  },
  render() {
    const { directPrint, loading, templateRender: TemplateRender, dataSource, workspaceWidth, workspaceStyle } = this;
    const prefixCls = this.getPrefixCls('cviewport--wrapper');
    const cls = { [prefixCls]: true, 'no-visible': directPrint };
    return (
      <div class={cls}>
        <Spin spinning={loading} tip="Loading..." containerStyle={{ height: `100%` }}>
          <div class="preview">
            {/* 隐藏原始的打印模板内容 */}
            <div class="origin-template" style={{ width: `${workspaceWidth}px`, marginLeft: `-${Math.floor(workspaceWidth / 2)}px` }}>
              <TemplateRender dataSource={dataSource} />
            </div>
            {/* 预览工作区 */}
            <div class="workspace" style={workspaceStyle} />
          </div>
        </Spin>
      </div>
    );
  }
};
