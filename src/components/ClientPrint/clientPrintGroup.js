/*
 * @Author: 焦质晔
 * @Date: 2020-09-23 13:57:30
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-10-15 13:59:50
 */
import PropTypes from '../_utils/vue-types';
import { filterEmpty } from '../_utils/props-util';
import { sleep } from '../_utils/tool';
import Locale from '../_utils/mixins/locale';
import config from './lib/config';

import BaseDialog from '../BaseDialog';
import ClientPrintItem from './clientPrintItem';

export default {
  name: 'ClientPrintGroup',
  mixins: [Locale],
  props: {
    uniqueKey: PropTypes.string
  },
  data() {
    return {
      visible: !1
    };
  },
  methods: {
    async DO_PRINT() {
      this.visible = !0;
      await sleep(500);
      this.tabChangeHandle('0');
    },
    tabChangeHandle(key) {
      this.$refs[`print-item-${key}`].$children[0].$refs.container.SHOW_PREVIEW();
    }
  },
  render() {
    const { visible, uniqueKey, $slots } = this;
    const children = filterEmpty($slots.default).filter(x => x.tag === 'client-print-item' || x.tag === 'ClientPrintItem');
    const dialogProps = {
      props: {
        visible,
        title: this.t('clientPrint.preview'),
        width: `${config.previewWidth}px`,
        showFullScreen: false,
        destroyOnClose: true
      },
      on: {
        'update:visible': val => (this.visible = val),
        open: () => this.$emit('open'),
        closed: () => this.$emit('close')
      }
    };
    return (
      <BaseDialog {...dialogProps}>
        <div style="margin: -10px">
          <SuperTabs initialValue={'0'} size="small" tabNavOffsetLeft={15} tabClassName="v-cpreview--tab" lazyLoad={false} onChange={this.tabChangeHandle}>
            {children.map((x, i) => (
              <tab-panel key={i.toString()} label={x.data.attrs.label} disabled={x.data.attrs.disabled}>
                <ClientPrintItem ref={`print-item-${i}`} uniqueKey={`${uniqueKey}_tab_${i}`} dataSource={x.data.attrs.dataSource} templateRender={x.data.attrs.templateRender} style={{ margin: 0 }} />
              </tab-panel>
            ))}
          </SuperTabs>
        </div>
      </BaseDialog>
    );
  }
};
