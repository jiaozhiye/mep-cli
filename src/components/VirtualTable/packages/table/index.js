/*
 * @Author: 焦质晔
 * @Date: 2020-02-28 22:28:35
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-06-25 16:48:47
 */
import baseProps from './props';
import Store from '../store';
import TableManager from '../manager';
import config from '../config';
import { isEqual, cloneDeep } from 'lodash';

import { columnsFlatMap, convertToRows, getAllColumns, getAllTableData, getScrollBarSize, createOrderBy, createWhereSQL, parseHeight, isEmpty, browse } from '../utils';
import warning from '../../../_utils/warning';

import sizeMixin from '../../../_utils/mixins/size';
import columnsMixin from '../columns';
import expandableMixin from '../expandable/mixin';
import selectionMixin from '../selection/mixin';
import groupSubtotalMixin from '../group-subtotal';
import validateMixin from '../edit/validate';
import localStorageMixin from '../local-storage';
import layoutMethods from './layout-methods';
import coreMethods from './core-methods';
import interfaceMethods from './interface-methods';

import TableHeader from '../header';
import TableBody from '../body';
import TableFooter from '../footer';
import Pager from '../pager';
import SpinLoading from '../../../Spin';
import EmptyContent from '../empty';
import Alert from '../alert';
import ColumnFilter from '../column-filter';
import GroupSummary from '../group-summary';
import HighSearch from '../high-search';
import SelectCollection from '../select-collection';
import FullScreen from '../full-screen';
import Export from '../export';
import PrintTable from '../print';
import Reload from '../reload';

const noop = () => {};

export default {
  name: 'VirtualTable',
  inheritAttrs: false,
  props: {
    ...baseProps
  },
  provide() {
    return {
      $$table: this
    };
  },
  mixins: [sizeMixin, columnsMixin, expandableMixin, selectionMixin, groupSubtotalMixin, validateMixin, localStorageMixin],
  data() {
    // 原始列
    this.originColumns = [];
    // 原始数据
    this.tableOriginData = [];
    // 选中的行记录
    this.selectionRows = [];
    // 高级检索的条件
    this.superFilters = [];
    return {
      // 组件 store 仓库
      store: new Store(),
      // 渲染中的数据
      tableData: [],
      // 完整数据 - 重要
      tableFullData: [],
      // 表头筛选
      filters: {},
      // 表头排序
      sorter: {},
      // 服务端合计
      summaries: {},
      // 分页
      pagination: {
        currentPage: this.paginationConfig?.currentPage || config.pagination.currentPage,
        pageSize: this.paginationConfig?.pageSize || config.pagination.pageSize
      },
      // 自适应的表格高度
      autoHeight: 0,
      // 记录总数
      total: 0,
      // 页面是否加载中
      showLoading: this.loading,
      // 是否存在横向滚动条
      scrollX: false,
      // 是否存在纵向滚动条
      scrollY: false,
      // 是否启用了纵向 Y 可视渲染方式加载
      scrollYLoad: false,
      // 存放纵向 Y 虚拟滚动相关信息
      scrollYStore: {
        startIndex: 0,
        visibleIndex: 0,
        renderSize: 0,
        offsetSize: 0,
        visibleSize: 0,
        rowHeight: 0
      },
      // 表格布局相关参数
      layout: {
        // 滚动条宽度
        gutterWidth: getScrollBarSize(),
        // 表格宽度
        tableWidth: 0,
        // 表格体宽度
        tableBodyWidth: 0,
        // 表格体内容高度
        tableBodyHeight: 0,
        // 表格体父容器（视口）高度
        viewportHeight: 0,
        // 头部高度
        headerHeight: 0,
        // 底部高度
        footerHeight: 0
      },
      // 选择列，已选中行的 keys
      selectionKeys: this.rowSelection?.selectedRowKeys ?? [],
      // 行高亮，已选中的 key
      highlightKey: this.rowHighlight?.currentRowKey ?? '',
      // 已展开行的 keys
      rowExpandedKeys: this.expandable?.expandedRowKeys ?? [],
      // X 滚动条是否离开左边界
      isPingLeft: false,
      // X 滚动条是否离开右边界
      isPingRight: false,
      // 响应式变化的状态
      resizeState: {
        width: 0,
        height: 0
      },
      // 是否是 IE11
      isIE: browse()['msie'],
      // 全屏样式
      isFullScreen: false
    };
  },
  computed: {
    $vTable() {
      return this.$refs[`v-table`];
    },
    $$tableBody() {
      return this.$refs[`tableBody`];
    },
    tableColumns() {
      return this.createTableColumns(this.columns);
    },
    flattenColumns() {
      return columnsFlatMap(this.tableColumns);
    },
    allColumns() {
      return getAllColumns(this.tableColumns);
    },
    allTableData() {
      return !this.isTreeTable ? this.tableFullData : getAllTableData(this.tableFullData);
    },
    allRowKeys() {
      return this.allTableData.map(row => this.getRowKey(row, row.index));
    },
    deriveRowKeys() {
      return this.createDeriveRowKeys(this.tableFullData, null);
    },
    tableChange() {
      return [this.pagination, this.filters, this.sorter, { currentDataSource: [...this.tableFullData], allDataSource: [...this.tableOriginData] }];
    },
    leftFixedColumns() {
      return this.flattenColumns.filter(column => column.fixed === 'left');
    },
    rightFixedColumns() {
      return this.flattenColumns.filter(column => column.fixed === 'right');
    },
    showFooter() {
      return this.showSummary && this.flattenColumns.some(x => !!x.summation);
    },
    showPagination() {
      return this.isFetch || this.webPagination;
    },
    isGroup() {
      return convertToRows(this.tableColumns).length > 1;
    },
    isHeadSorter() {
      return this.flattenColumns.some(column => column.sorter);
    },
    isHeadFilter() {
      return this.flattenColumns.some(column => column.filter);
    },
    isServiceSummation() {
      this.serviceSummation = this.flattenColumns.some(x => !!x.summation?.dataKey);
      return this.serviceSummation;
    },
    isSelectCollection() {
      return this.rowSelection?.type === 'checkbox';
    },
    isSuperSearch() {
      return this.showSuperSearch && this.isHeadFilter;
    },
    isGroupSummary() {
      return this.flattenColumns.some(column => !!column.groupSummary);
    },
    isGroupSubtotal() {
      return !!this.groupSubtotal?.length;
    },
    isTreeTable() {
      return this.tableFullData.some(x => Array.isArray(x.children) && x.children.length);
    },
    isTableEmpty() {
      return !this.tableData.length;
    },
    isFetch() {
      return !!this.fetch;
    },
    fetchParams() {
      const orderby = createOrderBy(this.sorter);
      const query = createWhereSQL(this.filters, config.showFilterType) || createWhereSQL(this.superFilters, config.showFilterType);
      const params = this.isFetch ? this.fetch.params : null;
      const sorter = orderby ? { [config.sorterFieldName]: orderby } : null;
      const filter = query ? { [config.filterFieldName]: query } : null;
      const summary = this.serviceSummation ? { [config.groupSummary.summaryFieldName]: this.createColumnSummary(), usedJH: 1 } : null;
      return {
        ...sorter,
        ...filter,
        ...summary,
        ...params,
        ...this.pagination
      };
    },
    bordered() {
      return this.border || this.isGroup;
    },
    tableSize() {
      const size = this.size || config.toTableSize[this.currentSize];
      Object.assign(this.scrollYStore, { rowHeight: config.rowHeightMaps[size] });
      return size;
    },
    shouldUpdateHeight() {
      return this.height || this.maxHeight || this.isTableEmpty;
    },
    fullHeight() {
      const pagerHeight = this.showPagination ? 40 : 0;
      if (this.isFullScreen && this.shouldUpdateHeight) {
        return window.innerHeight - 30 - this.$refs[`table-toper`].offsetHeight - pagerHeight;
      }
      return null;
    },
    tableStyles() {
      const { fullHeight, autoHeight } = this;
      const height = parseHeight(this.height);
      const minHeight = parseHeight(this.minHeight);
      const maxHeight = parseHeight(this.maxHeight);
      const result = {};
      if (minHeight) {
        Object.assign(result, { minHeight: `${minHeight}px` });
      }
      if (maxHeight) {
        Object.assign(result, { maxHeight: `${maxHeight}px` });
      }
      if (fullHeight) {
        return { ...result, height: `${fullHeight}px` };
      }
      if (height) {
        return { ...result, height: this.height !== 'auto' ? `${height}px` : `${autoHeight}px` };
      }
      return result;
    }
  },
  watch: {
    dataSource(next) {
      if (isEqual(next, this.tableFullData)) return;
      this.clearTableSorter();
      this.clearTableFilter();
      this.clearSuperSearch();
      this.createTableData(next);
    },
    tableFullData() {
      // 加载表格数据
      this.loadTableData().then(() => {
        this.doLayout();
      });
      // 触发 dataChange 事件
      this.dataChangeDebouncer();
    },
    columns(next) {
      this.setLocalColumns(next);
    },
    tableColumns() {
      this.doLayout();
    },
    filters() {
      this.$emit('change', ...this.tableChange);
    },
    sorter() {
      this.$emit('change', ...this.tableChange);
    },
    pagination: {
      handler() {
        this.$emit('change', ...this.tableChange);
      },
      deep: true
    },
    [`fetch.params`]() {
      this.clearTableSorter();
      this.clearTableFilter();
      this.clearSuperSearch();
    },
    fetchParams(next, prev) {
      const { clearableAfterFetched = !0 } = this.rowSelection || {};
      const isOnlyPageChange = this.onlyPaginationChange(next, prev);
      if (!isOnlyPageChange) {
        this.isFetch && clearableAfterFetched && this.clearRowSelection();
      }
      if (!isOnlyPageChange && next.currentPage > 1 && !this.fetch?.stopToFirst) {
        this.toFirstPage();
      } else {
        this.isFetch && this.getTableDataDebouncer();
      }
    },
    selectionKeys(next, prev) {
      if (!this.rowSelection || isEqual(next, prev)) return;
      const { onChange = noop } = this.rowSelection;
      // 设置选中的行数据
      this.selectionRows = this.createSelectionRows(next);
      onChange(next, this.selectionRows);
    },
    [`rowSelection.selectedRowKeys`](next) {
      if (this.rowSelection.type === 'radio') {
        this.$$tableBody.setClickedValues(next.length ? [next[0], '__selection__'] : []);
      }
      this.selectionKeys = this.createSelectionKeys(next);
      if (this.isTreeTable) {
        this.rowExpandedKeys = this.createRowExpandedKeys();
      }
    },
    [`expandable.expandedRowKeys`]() {
      this.rowExpandedKeys = this.createRowExpandedKeys();
    },
    [`treeStructure.expandedRowKeys`]() {
      this.rowExpandedKeys = this.createRowExpandedKeys();
    },
    rowExpandedKeys(next, prev) {
      if (!this.expandable || isEqual(next, prev)) return;
      const { onChange = noop } = this.expandable;
      onChange(
        next,
        next.map(x => this.allTableData[this.allRowKeys.findIndex(k => k === x)])
      );
    },
    highlightKey(next) {
      if (!this.rowHighlight) return;
      const { onChange = noop } = this.rowHighlight;
      onChange(next, this.allTableData[this.allRowKeys.findIndex(x => x === next)] ?? null);
    },
    [`rowHighlight.currentRowKey`](next) {
      this.$$tableBody.setClickedValues(!isEmpty(next) ? [next, 'index'] : []);
      this.highlightKey = this.rowHighlight?.currentRowKey ?? this.highlightKey;
    },
    [`layout.viewportHeight`](next) {
      const visibleYSize = Math.ceil(next / this.scrollYStore.rowHeight);
      const renderSize = browse()['webkit'] ? visibleYSize + 3 : visibleYSize + 5;
      Object.assign(this.scrollYStore, { visibleSize: visibleYSize, offsetSize: visibleYSize, renderSize });
    },
    scrollYLoad(next) {
      !next ? this.updateScrollYSpace(!0) : this.loadScrollYData(this.$$tableBody.prevST);
    },
    scrollX(next) {
      this.isPingRight = next;
    },
    loading(next) {
      this.showLoading = next;
    }
  },
  created() {
    TableManager.register(this._uid, this);
    this.originColumns = cloneDeep(this.columns);
    this.createDebouncer();
    // 获取表格数据
    if (!this.isFetch) {
      this.createTableData(this.dataSource);
    } else {
      this.getTableDataDebouncer();
    }
    // 加载表格数据
    this.loadTableData().then(() => {
      this.doLayout();
    });
  },
  mounted() {
    this.doLayout();
    this.bindEvents();
    this.createResizeState();
  },
  activated() {
    TableManager.focus(this._uid);
    this.scrollYLoad && this.loadScrollYData(0);
    setTimeout(() => this.calcTableHeight());
  },
  destroyed() {
    TableManager.deregister(this._uid);
    this.destroy();
  },
  methods: {
    ...coreMethods,
    ...layoutMethods,
    ...interfaceMethods,
    getRowKey(row, index) {
      const { rowKey } = this;
      const key = typeof rowKey === 'function' ? rowKey(row, index) : row[rowKey];
      if (key === undefined) {
        warning(false, 'Table', 'Each record in table should have a unique `key` prop, or set `rowKey` to an unique primary key.');
        return index;
      }
      return key;
    }
  },
  render() {
    const {
      isFullScreen,
      tableData,
      columns,
      tableColumns,
      flattenColumns,
      tableSize,
      showLoading,
      bordered,
      stripe,
      tableStyles,
      rowStyle,
      cellStyle,
      showHeader,
      showFooter,
      showPagination,
      isGroup,
      isHeadSorter,
      isHeadFilter,
      isTableEmpty,
      scrollX,
      scrollY,
      scrollYLoad,
      isFetch,
      isPingLeft,
      isPingRight,
      leftFixedColumns,
      rightFixedColumns,
      pagination,
      paginationConfig,
      total,
      selectionKeys,
      showAlert,
      alertPosition,
      topSpaceAlign,
      showFullScreen,
      showRefresh,
      tablePrint,
      exportExcel,
      isSelectCollection,
      isSuperSearch,
      isGroupSummary,
      showColumnDefine
    } = this;
    const vWrapperCls = { [`v-is--maximize`]: isFullScreen };
    const vTableCls = [
      `v-table`,
      {
        [`size--${tableSize}`]: !0,
        [`is--border`]: bordered,
        [`is--striped`]: stripe,
        [`is--fixed`]: leftFixedColumns.length || rightFixedColumns.length,
        [`is--group`]: isGroup,
        [`is--sortable`]: isHeadSorter,
        [`is--filterable`]: isHeadFilter,
        [`is--empty`]: isTableEmpty,
        [`show--head`]: showHeader,
        [`show--foot`]: showFooter,
        [`ping--left`]: isPingLeft,
        [`ping--right`]: isPingRight,
        [`scroll--x`]: scrollX,
        [`scroll--y`]: scrollY,
        [`virtual--y`]: scrollYLoad
      }
    ];
    const vBottomCls = [
      'v-table-bottom',
      {
        [`is-pager`]: showPagination,
        [`is-alert`]: showAlert && alertPosition === 'bottom'
      }
    ];
    const tableHeaderProps = {
      ref: 'tableHeader',
      props: {
        tableColumns,
        flattenColumns
      }
    };
    const tableBodyProps = {
      ref: 'tableBody',
      props: {
        tableData,
        flattenColumns,
        rowStyle,
        cellStyle
      }
    };
    const tableFooterProps = {
      ref: 'tableFooter',
      props: {
        flattenColumns
      }
    };
    const alertProps = {
      props: {
        total,
        selectionKeys
      }
    };
    const printProps = tablePrint
      ? {
          props: {
            tableColumns,
            flattenColumns,
            showHeader,
            showFooter,
            showLogo: tablePrint.showLogo ?? !0,
            showSign: tablePrint.showSign ?? !1
          }
        }
      : null;
    const exportProps = exportExcel
      ? {
          props: {
            tableColumns,
            flattenColumns,
            fileName: exportExcel.fileName
          }
        }
      : null;
    const pagerProps = {
      ref: 'pager',
      props: Object.assign({}, paginationConfig, {
        size: tableSize,
        total,
        currentPage: pagination.currentPage,
        pageSize: pagination.pageSize
      }),
      on: {
        change: this.pagerChangeHandle
      }
    };
    return (
      <div class={vWrapperCls}>
        <div ref="table-toper" class="v-table-toper">
          <div class="v-space">
            {/* 顶部信息 */}
            {showAlert && alertPosition === 'top' && <Alert {...alertProps} />}
            <div class="v-slot" style={{ textAlign: topSpaceAlign }}>
              {/* 默认槽口 */}
              {this.$slots[`default`]}
            </div>
          </div>
          <div class="v-actions">
            {/* 全屏 */}
            {showFullScreen && <FullScreen />}
            {/* 刷新 */}
            {showRefresh && isFetch && <Reload />}
            {/* 打印 */}
            {tablePrint && <PrintTable {...printProps} />}
            {/* 导出 */}
            {exportExcel && <Export {...exportProps} />}
            {/* 多选集合 */}
            {isSelectCollection && <SelectCollection columns={columns} />}
            {/* 高级检索 */}
            {isSuperSearch && <HighSearch columns={flattenColumns} />}
            {/* 分组汇总 */}
            {isGroupSummary && <GroupSummary columns={flattenColumns} />}
            {/* 列定义 */}
            {showColumnDefine && <ColumnFilter columns={columns} />}
          </div>
        </div>
        <SpinLoading spinning={showLoading} tip="Loading...">
          <div ref="v-table" class={vTableCls} style={tableStyles}>
            {/* 主要内容 */}
            <div class="v-table--main-wrapper">
              {/* 头部 */}
              {showHeader && <TableHeader {...tableHeaderProps} />}
              {/* 表格体 */}
              <TableBody {...tableBodyProps} />
              {/* 底部 */}
              {showFooter && <TableFooter {...tableFooterProps} />}
            </div>
            {/* 边框线 */}
            {this.renderBorderLine()}
            {/* 空数据 */}
            {isTableEmpty && <EmptyContent />}
            {/* 列宽线 */}
            {this.renderResizableLine()}
          </div>
        </SpinLoading>
        {/* 分页 */}
        <div class={vBottomCls}>
          {showAlert && alertPosition === 'bottom' && <Alert {...alertProps} />}
          {showPagination && <Pager {...pagerProps} />}
        </div>
      </div>
    );
  }
};
