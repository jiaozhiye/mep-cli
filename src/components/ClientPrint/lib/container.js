/*
 * @Author: 焦质晔
 * @Date: 2020-08-02 09:34:35
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-08-05 08:31:12
 */
import { sleep } from '../../_utils/tool';
import { mmToPx, pxToMm, insertBefore, isPageBreak } from './utils';
import PrefixCls from '../../_utils/mixins/prefix-cls';
import config from './config';

import Spin from '../../Spin';

export default {
  name: 'Container',
  mixins: [PrefixCls],
  props: ['dataSource', 'templateRender'],
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
    realWidth() {
      const {
        pageSize,
        form: {
          setting: { direction, distance }
        }
      } = this.$$preview;
      const width = mmToPx(direction === 'vertical' ? pageSize[0] : pageSize[1]);
      return width - mmToPx((distance.left - config.defaultDistance) * 10) - mmToPx((distance.right - config.defaultDistance) * 10);
    },
    realHeight() {
      const {
        pageSize,
        form: {
          setting: { direction, distance }
        }
      } = this.$$preview;
      const height = mmToPx(direction === 'vertical' ? pageSize[1] : pageSize[0]);
      return height - mmToPx((distance.top - config.defaultDistance) * 10) - mmToPx((distance.bottom - config.defaultDistance) * 10);
    },
    workspaceWidth() {
      return `${this.realWidth}px`;
    },
    workspaceHeight() {
      const { form } = this.$$preview;
      // 针式打印机  连续打印
      if (form.printerType === 'stylus') {
        return 'auto';
      }
      return `${this.realHeight}px`;
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
    scaleSize() {
      return this.$$preview.form.scale;
    },
    workspaceStyle() {
      return {
        width: this.workspaceWidth,
        height: this.workspaceHeight,
        paddingLeft: `${this.pageDistance.left}px`,
        paddingRight: `${this.pageDistance.right}px`,
        paddingTop: `${this.pageDistance.top}px`,
        paddingBottom: `${this.pageDistance.bottom}px`,
        transform: `scale(${this.scaleSize})`,
        opacity: this.loading ? 0 : 1
      };
    },
    isManualPageBreak() {
      return this.elementHtmls.some(x => isPageBreak(x));
    }
  },
  watch: {
    realHeight() {
      this.createWorkspace();
    },
    [`$$preview.form.setting.fixedLogo`]() {
      this.createWorkspace();
    }
  },
  methods: {
    createPageBreak() {
      return `<tr type="page-break" style="page-break-after: always;"></tr>`;
    },
    createLogo() {
      const __html__ = [
        `<tr style="height: ${config.logoHeight}px;">`,
        `<td colspan="12" align="left" valign="top">`,
        `<img src="/static/img/logo_l.png" border="0" height="26" style="margin-left: 10px;" />`,
        `</td>`,
        `<td colspan="12" align="right" valign="top">`,
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
      if (this.templateEl?.tagName !== 'TABLE') {
        return this.throwError();
      }
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

      // 页面高度
      let pageHeight = setting.fixedLogo ? this.realHeight - config.logoHeight : this.realHeight;

      let tmpArr = [];
      this.previewHtmls = [];

      // 针式打印机  连续打印
      if (printerType === 'stylus') {
        this.previewHtmls.push([...(setting.fixedLogo ? [this.createLogo()] : []), this.createTdCols(), ...this.elementHtmls]);
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
            this.previewHtmls.push([...(setting.fixedLogo ? [this.createLogo()] : []), this.createTdCols(), ...tmpArr]);
            tmpArr = [];
            sum = 0;
            i -= 1;
          }

          // 最后一页
          if (i === len - 1 && tmpArr.length) {
            this.previewHtmls.push([...(setting.fixedLogo ? [this.createLogo()] : []), this.createTdCols(), ...tmpArr]);
          }
        }
      }

      // 不固定 logo
      if (!setting.fixedLogo) {
        this.previewHtmls[0]?.unshift(this.createLogo());
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
      return '<table>' + this.createTdCols() + this.createLogo() + this.elementHtmls.join('') + '</table>';
    },
    // 加载完成打印模板组件，创建预览工作区
    async SHOW_PREVIEW() {
      this.createTemplateCols();
      await sleep(0);
      this.createNodeStyle();
      this.createWorkspace();
      this.loading = !1;
    },
    throwError() {
      console.error('[PrintTemplate] 打印模板组件的根元素必须是 `table` 节点');
    }
  },
  render() {
    const { loading, templateRender: TemplateRender, dataSource, realWidth, workspaceWidth, workspaceStyle } = this;
    const prefixCls = this.getPrefixCls('cviewport--wrapper');
    const cls = { [prefixCls]: true };
    return (
      <div class={cls}>
        <Spin spinning={loading} tip="Loading..." containerStyle={{ height: `100%` }}>
          <div class="preview">
            {/* 隐藏原始的打印模板内容 */}
            <div class="origin-template" style={{ width: workspaceWidth, marginLeft: `-${Math.floor(realWidth / 2)}px` }}>
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
