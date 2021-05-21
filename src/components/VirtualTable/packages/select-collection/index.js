/*
 * @Author: 焦质晔
 * @Date: 2020-05-19 15:58:23
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-05-21 12:41:52
 */
import Locale from '../locale/mixin';

import BaseDialog from '../../../BaseDialog';
import SelectCollectionResult from './result';

export default {
  name: 'SelectCollection',
  mixins: [Locale],
  props: ['columns'],
  inject: ['$$table'],
  data() {
    return {
      visible: false
    };
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
    const { visible } = this;
    const { selectionKeys, selectionRows } = this.$$table;
    const wrapProps = {
      props: {
        visible,
        title: this.t('table.selectCollection.settingTitle'),
        showFullScreen: false,
        width: '1100px',
        destroyOnClose: true,
        containerStyle: { height: 'calc(100% - 52px)', paddingBottom: '52px' }
      },
      on: {
        'update:visible': val => (this.visible = val)
      }
    };
    const cls = [`v-select-collection--wrapper`, `size--${this.$$table.tableSize}`];
    return (
      <div class={cls}>
        <span class="select-button" title={this.t('table.selectCollection.text')} onClick={this.clickHandle}>
          <i class="iconfont icon-check-square" />
        </span>
        <BaseDialog {...wrapProps}>
          <SelectCollectionResult columns={this.columns} selectionKeys={selectionKeys} selectionRows={selectionRows} onClose={this.closeHandle} />
        </BaseDialog>
      </div>
    );
  }
};
