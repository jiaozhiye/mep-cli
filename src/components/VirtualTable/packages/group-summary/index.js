/*
 * @Author: 焦质晔
 * @Date: 2020-05-19 15:58:23
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-03-12 12:37:16
 */
import config from '../config';
import Locale from '../locale/mixin';

import BaseDialog from '../../../BaseDialog';
import GroupSummarySetting from './setting';

export default {
  name: 'GroupSummary',
  mixins: [Locale],
  props: ['columns'],
  inject: ['$$table'],
  data() {
    return {
      visible: false
    };
  },
  computed: {
    disabledState() {
      return !this.$$table.total;
    }
  },
  methods: {
    clickHandle() {
      this.visible = true;
    },
    closeHandle(val) {
      this.visible = val;
    }
  },
  render() {
    const { visible, disabledState } = this;
    const wrapProps = {
      props: {
        visible,
        title: this.t('table.groupSummary.settingTitle'),
        showFullScreen: false,
        width: '1000px',
        destroyOnClose: true,
        containerStyle: { height: 'calc(100% - 52px)', paddingBottom: '52px' }
      },
      on: {
        'update:visible': val => (this.visible = val)
      }
    };
    const columns = this.columns.filter(x => !['__expandable__', '__selection__', 'index', 'pageIndex', config.operationColumn].includes(x.dataIndex));
    const cls = [
      `v-group-summary--wrapper`,
      `size--${this.$$table.tableSize}`,
      {
        disabled: disabledState
      }
    ];
    return (
      <div class={cls}>
        <span
          class="summary-button"
          title={this.t('table.groupSummary.text')}
          onClick={() => {
            if (disabledState) return;
            this.clickHandle();
          }}
        >
          <i class="iconfont icon-piechart" />
        </span>
        <BaseDialog {...wrapProps}>
          <GroupSummarySetting columns={columns} onClose={this.closeHandle} />
        </BaseDialog>
      </div>
    );
  }
};
