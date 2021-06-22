/*
 * @Author: 焦质晔
 * @Date: 2020-05-19 15:58:23
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-06-22 10:20:01
 */
import { cloneDeep, get } from 'lodash';
import Locale from '../locale/mixin';

import BaseDialog from '../../../BaseDialog';
import SelectCollectionResult from './result';

const noop = () => {};

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
  mounted() {
    this.getSelectionRows();
  },
  methods: {
    async getSelectionRows() {
      const {
        isFetch,
        rowSelection: { fetch, disabled = noop },
        getRowKey
      } = this.$$table;
      if (!(isFetch && fetch)) return;
      if (process.env.MOCK_DATA === 'true') {
        const { data } = cloneDeep(require('@/mock/tableData').default);
        this.$$table.selectionRows = data.items.filter(row => !disabled(row));
        this.$$table.selectionKeys = this.$$table.selectionRows.map((row, index) => getRowKey(row, index));
      } else {
        try {
          const res = await fetch.api(fetch.params);
          if (res.code === 200) {
            const records = Array.isArray(res.data) ? res.data : get(res.data, fetch.dataKey) ?? [];
            this.$$table.selectionRows = records.filter(row => !disabled(row));
            this.$$table.selectionKeys = this.$$table.selectionRows.map((row, index) => getRowKey(row, index));
          }
        } catch (err) {}
      }
    },
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
