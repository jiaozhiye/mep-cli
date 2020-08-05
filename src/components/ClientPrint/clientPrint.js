/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-08-05 08:34:26
 **/
import PropTypes from '../_utils/vue-types';
import { sleep } from '../_utils/tool';
import Locale from '../_utils/mixins/locale';

import BaseDialog from '../BaseDialog';
import Preview from './lib/preview';

const noop = async () => {};

export default {
  name: 'ClientPrint',
  mixins: [Locale],
  props: {
    dataSource: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
    templateRender: PropTypes.func.isRequired,
    uniqueKey: PropTypes.string,
    type: PropTypes.string,
    disabled: PropTypes.bool.def(false),
    click: PropTypes.func.def(noop)
  },
  data() {
    return {
      visible: !1
    };
  },
  methods: {
    async clickHandle() {
      this.visible = !0;
      try {
        await this.click();
        await sleep(0);
        this.$refs.preview.$refs.container.SHOW_PREVIEW();
      } catch (err) {}
    }
  },
  render() {
    const { visible, $props, $slots, $attrs } = this;
    const btnProps = {
      props: {
        ...$props
      },
      attrs: {
        ...$attrs,
        icon: 'el-icon-printer'
      },
      on: {
        click: this.clickHandle
      }
    };
    const dialogProps = {
      props: {
        visible,
        title: this.t('clientPrint.preview'),
        width: '1260px',
        destroyOnClose: true
      },
      on: {
        'update:visible': val => (this.visible = val)
      }
    };
    const previewProps = {
      ref: 'preview',
      props: {
        ...$props
      }
    };
    return (
      <el-button {...btnProps}>
        {$slots['default']}
        <BaseDialog {...dialogProps}>
          <Preview {...previewProps} />
        </BaseDialog>
      </el-button>
    );
  }
};
