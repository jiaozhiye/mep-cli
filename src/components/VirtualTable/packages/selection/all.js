/*
 * @Author: 焦质晔
 * @Date: 2020-03-06 21:30:12
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-06-23 18:41:52
 */
import { cloneDeep, get, intersection, union, xor } from 'lodash';
import Locale from '../locale/mixin';
import Checkbox from '../checkbox';
import Popper from '../popper';

// element-ui -> zIndex
import { PopupManager } from 'element-ui/lib/utils/popup';

const noop = () => {};

export default {
  name: 'AllSelection',
  mixins: [Locale],
  props: ['selectionKeys'],
  inject: ['$$table'],
  computed: {
    filterAllRowKeys() {
      const { allTableData, getRowKey, rowSelection } = this.$$table;
      const { disabled = noop } = rowSelection;
      return allTableData.filter(row => !disabled(row)).map(row => getRowKey(row, row.index));
    },
    indeterminate() {
      return this.selectionKeys.length > 0 && intersection(this.selectionKeys, this.filterAllRowKeys).length < this.filterAllRowKeys.length;
    },
    selectable() {
      return !this.indeterminate && this.selectionKeys.length > 0;
    },
    isFilterable() {
      const { rowSelection } = this.$$table;
      return rowSelection.filterable ?? !0;
    },
    size() {
      return this.$$table.tableSize !== 'mini' ? 'small' : 'mini';
    }
  },
  methods: {
    async getAllSelectionKeys() {
      const { fetchParams, getRowKey } = this.$$table;
      let rowKeys = [];
      if (process.env.MOCK_DATA === 'true') {
        const { data } = cloneDeep(require('@/mock/tableData').default);
        rowKeys = data.items.map((row, index) => getRowKey(row, index));
      } else {
        const { fetchAllRowKeys: fetch } = this.$$table.rowSelection;
        this.$$table.showLoading = !0;
        try {
          const res = await fetch.api(fetchParams);
          if (res.code === 200) {
            rowKeys = Array.isArray(res.data) ? res.data : get(res.data, fetch.dataKey) ?? [];
          }
        } catch (err) {}
        this.$$table.showLoading = !1;
      }
      return rowKeys;
    },
    async changeHandle(val) {
      const { selectionKeys, filterAllRowKeys } = this;
      const { rowSelection } = this.$$table;
      if (rowSelection.fetchAllRowKeys) {
        this.$$table.selectionKeys = val ? await this.getAllSelectionKeys() : [];
      } else {
        this.$$table.selectionKeys = val ? union(selectionKeys, filterAllRowKeys) : selectionKeys.filter(x => !filterAllRowKeys.includes(x));
      }
    },
    selectAllHandle() {
      this.changeHandle(true);
    },
    async invertHandle() {
      const { rowSelection } = this.$$table;
      if (rowSelection.fetchAllRowKeys) {
        this.$$table.selectionKeys = xor(this.selectionKeys, await this.getAllSelectionKeys());
      } else {
        this.$$table.selectionKeys = xor(this.selectionKeys, this.filterAllRowKeys);
      }
    },
    clearAllHandle() {
      this.changeHandle(false);
    },
    renderDropdown() {
      return (
        <ul class={`el-dropdown-menu--${this.size}`}>
          <li class="el-dropdown-menu__item" onClick={() => this.selectAllHandle()}>
            {this.t('table.selection.all')}
          </li>
          <li class="el-dropdown-menu__item" onClick={() => this.invertHandle()}>
            {this.t('table.selection.invert')}
          </li>
          <li class="el-dropdown-menu__item" onClick={() => this.clearAllHandle()}>
            {this.t('table.selection.clear')}
          </li>
        </ul>
      );
    }
  },
  render() {
    const { isFilterable } = this;
    const wrapProps = {
      ref: 'vPopper',
      props: {
        trigger: 'clickToToggle',
        rootClass: 'v-popper--wrapper',
        transition: 'v-zoom-in-top',
        options: { placement: 'bottom-start' },
        containerStyle: { zIndex: PopupManager.nextZIndex() || 1000 },
        appendToBody: true
      }
    };
    return (
      <div class="selection">
        <Checkbox indeterminate={this.indeterminate} disabled={!this.filterAllRowKeys.length} value={this.selectable} onInput={this.changeHandle} />
        {isFilterable ? (
          <Popper {...wrapProps}>
            <i slot="reference" class="icon el-icon-arrow-down" />
            <div class="v-popper" style="width: 90px; min-width: auto; padding: 0;">
              {this.renderDropdown()}
            </div>
          </Popper>
        ) : null}
      </div>
    );
  }
};
