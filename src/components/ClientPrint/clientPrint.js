/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-11-10 18:59:30
 **/
import PropTypes from '../_utils/vue-types';
import { sleep } from '../_utils/tool';
import Locale from '../_utils/mixins/locale';
import config from './lib/config';

import BaseDialog from '../BaseDialog';
import Preview from './lib/preview';

const noop = async () => {};

export default {
  name: 'ClientPrint',
  componentName: 'ClientPrint',
  mixins: [Locale],
  props: {
    dataSource: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
    templateRender: PropTypes.any.isRequired,
    uniqueKey: PropTypes.string,
    defaultConfig: PropTypes.object,
    preview: PropTypes.bool.def(true),
    closeOnPrinted: PropTypes.bool.def(false),
    type: PropTypes.string,
    disabled: PropTypes.bool.def(false),
    click: PropTypes.func.def(noop)
  },
  data() {
    return {
      visible: !1,
      loading: !1
    };
  },
  methods: {
    async clickHandle() {
      this.loading = !0;
      try {
        const res = await this.click();
        this.loading = !1;
        if (typeof res === 'boolean' && !res) return;
        await this.DO_PRINT();
      } catch (err) {}
      this.loading = !1;
    },
    async DO_PRINT() {
      await sleep(0);
      this.visible = !0;
      await sleep(this.preview ? 500 : 0);
      const { SHOW_PREVIEW, DIRECT_PRINT } = this.$refs.preview.$refs.container;
      this.preview ? SHOW_PREVIEW() : DIRECT_PRINT();
    },
    createRender() {
      const dialogProps = {
        props: {
          visible: this.visible,
          title: this.t('clientPrint.preview'),
          width: `${config.previewWidth}px`,
          destroyOnClose: true
        },
        on: {
          'update:visible': val => (this.visible = val),
          open: () => this.$emit('open'),
          closed: () => this.$emit('close')
        }
      };
      const previewProps = {
        ref: 'preview',
        props: {
          ...this.$props
        },
        on: {
          close: () => (this.visible = !1)
        }
      };
      return this.preview ? (
        <BaseDialog {...dialogProps}>
          <Preview {...previewProps} />
        </BaseDialog>
      ) : this.visible ? (
        <Preview {...previewProps} />
      ) : null;
    }
  },
  render() {
    const { loading, $props, $slots, $attrs } = this;
    const btnProps = {
      props: {
        ...$props,
        loading
      },
      attrs: {
        icon: 'el-icon-printer',
        ...$attrs
      },
      on: {
        click: this.clickHandle
      }
    };
    return $slots['default'] ? (
      <el-button {...btnProps}>
        {$slots['default']}
        {this.createRender()}
      </el-button>
    ) : (
      this.createRender()
    );
  }
};
