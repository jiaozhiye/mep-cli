/*
 * @Author: 焦质晔
 * @Date: 2020-02-28 23:04:58
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-04-07 17:16:54
 */
import PropTypes from '../../../_utils/vue-types';

const columnItem = {
  dataIndex: PropTypes.string.isRequired,
  title: PropTypes.any.isRequired,
  width: PropTypes.number, // 列宽度/最小宽度
  fixed: PropTypes.oneOf(['left', 'right']), // 列固定（IE 下无效）
  colSpan: PropTypes.number, // 表头列合并,设置为 0 时，不渲染
  align: PropTypes.oneOf(['left', 'center', 'right']), // 设置列的对齐方式
  theadAlign: PropTypes.oneOf(['left', 'center', 'right']), // 设置表头的对齐方式
  hidden: PropTypes.bool, // 是否隐藏列
  ellipsis: PropTypes.bool, // 超过宽度将自动省略
  className: PropTypes.string, // 列样式类名
  children: PropTypes.array, // 内嵌 children，以渲染分组表头
  sorter: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]), // 列排序
  // 列筛选
  filter: PropTypes.shape({
    type: PropTypes.oneOf(['text', 'checkbox', 'radio', 'number', 'date']).isRequired, // 列筛选类型
    // 筛选字典项
    items: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      }).loose
    )
  }),
  precision: PropTypes.number, // 数值类型字段的精度
  formatType: PropTypes.oneOf(['date', 'datetime', 'dateShortTime', 'finance', 'secret-name', 'secret-phone', 'secret-IDnumber']), // 字段的格式化类型
  required: PropTypes.bool, // 可编辑列是否必填
  editRender: PropTypes.func, // 可编辑单元格，参数: row, column; 返回值类型: object
  // 数据字典项
  dictItems: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    }).loose
  ),
  // 底部合计
  summation: PropTypes.shape({
    sumBySelection: PropTypes.bool, // 是否通过选择列合计
    dataKey: PropTypes.string, // 服务端合计的数据字段名(路径)
    unit: PropTypes.string, // 合计字段的单位
    render: PropTypes.func, // 自定义渲染方法
    onChange: PropTypes.func // 字段合计变化时触发
  }),
  groupSummary: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.shape({
      dataKey: PropTypes.string, // 服务端合计的数据字段名(路径)
      unit: PropTypes.string, // 合计字段的单位
      render: PropTypes.func // 自定义渲染方法
    })
  ]).def(false), // 分组汇总
  render: PropTypes.func, // 列渲染方法，参数: text, row, column, rowIndex, cellIndex; 返回值类型: JSX
  extraRender: PropTypes.func // 额外的渲染方法，用于处理导出或打印单元格的值，参数: text, row, column, rowIndex, cellIndex; 返回值类型: string/number
};

/**
 * editRender: 返回值
 * {
 *   type: PropTypes.oneOf(['text', 'number', 'select', 'select-multiple', 'checkbox', 'search-helper', 'date', 'datetime', 'time']).isRequired,
 *   items: PropTypes.arrayOf(PropTypes.shape({
 *     text: PropTypes.string,
 *     value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
 *   })),
 *   editable: PropTypes.bool,
 *   disabled: PropTypes.bool, // true -> 禁用编辑功能，默认为非编辑状态，且禁止切换
 *   extra: PropTypes.shape({
 *     maxlength: PropTypes.number,
 *     max: PropTypes.number,
 *     min: PropTypes.number.def(0),
 *     trueValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
 *     falseValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
 *     minDateTime: PropTypes.string,
 *     maxDateTime: PropTypes.string,
 *     text: PropTypes.string,
 *     disabled: PropTypes.bool // 表单禁用状态
 *     clearable: PropTypes.bool
 *   }),
 *   helper: PropTypes.shape({
 *     filters: PropTypes.object,
 *     table: PropTypes.object,
 *     fieldAliasMap: PropTypes.func,
 *     beforeOpen: PropTypes.func,
 *     opened: PropTypes.func,
 *     beforeClose: PropTypes.func,
 *     closed: PropTypes.func
 *   }),
 *   rules: PropTypes.arrayOf(PropTypes.shape({
 *     required: PropTypes.bool,
 *     message: PropTypes.string,
 *     validator: PropTypes.func // 自定义校验规则，参数: val(表单项的值); 返回值类型: bool
 *   })),
 *   onInput: PropTypes.func,
 *   onChange: PropTypes.func,
 *   onEnter: PropTypes.func,
 *   onClick: PropTypes.func
 * }
 */

export default {
  // 列配置，必要参数
  columns: PropTypes.arrayOf(PropTypes.shape(columnItem).loose).def([]).isRequired,
  // 表格列变化事件，必要参数
  columnsChange: PropTypes.func.isRequired,
  // 数据数组
  dataSource: PropTypes.array.def([]),
  // 表格行 key 的取值
  rowKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).def('uid'),
  // 向后台请求数据的接口
  fetch: PropTypes.shape({
    api: PropTypes.func.isRequired, // api 接口
    params: PropTypes.object.isRequired, // 接口参数
    beforeFetch: PropTypes.func, // 接口前置钩子
    xhrAbort: PropTypes.bool, // 是否取消请求 - 未来可取消此参数
    stopToFirst: PropTypes.bool, // 是否返回第一页
    dataKey: PropTypes.string, // 数据路径
    callback: PropTypes.func // 请求的回调
  }),
  // 是否带有纵向边框
  border: PropTypes.bool.def(true),
  // 表格的高度
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  // 表格的最小高度
  minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).def(150),
  // 表格的最大高度
  maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  // 页面是否加载中
  loading: PropTypes.bool.def(false),
  // 所有列是否允许拖动列宽调整大小
  resizable: PropTypes.bool.def(true),
  // 表格尺寸
  size: PropTypes.oneOf(['default', 'medium', 'small', 'mini']),
  // 各种配置的本地存储，值不能重复
  uniqueKey: PropTypes.string,
  // 是否显示表头
  showHeader: PropTypes.bool.def(true),
  // 设置所有内容过长时显示为省略号
  ellipsis: PropTypes.bool.def(true),
  // 给行附加样式
  rowStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  // 给单元格附加样式
  cellStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  // 合并行或列的计算方法
  spanMethod: PropTypes.func,
  // 列表项拖拽排序
  rowDraggable: PropTypes.bool.def(false),
  // 列表项是否可选择
  rowSelection: PropTypes.shape({
    type: PropTypes.oneOf(['checkbox', 'radio']).isRequired, // 选择类型
    selectedRowKeys: PropTypes.array, // 选中项的 key 数组，支持动态赋值
    checkStrictly: PropTypes.bool.def(true), // true -> 节点选择完全受控（父子数据选中状态不再关联）
    defaultSelectFirstRow: PropTypes.bool.def(false), // 是否默认选中第一行（单选时生效）
    disabled: PropTypes.func, // 是否允许行选择，参数：row，返回值 bool
    onChange: PropTypes.func // 选中项发生变化时触发
  }),
  // 列表行高亮选中
  rowHighlight: PropTypes.shape({
    currentRowKey: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), // 当前高亮行的 key
    disabled: PropTypes.func, // 是否允许行高亮，参数：row，返回值 bool
    onChange: PropTypes.func // 高亮行发生变化时触发
  }),
  // 展开行配置项
  expandable: PropTypes.shape({
    defaultExpandAllRows: PropTypes.bool, // 默认展开所有行
    expandedRowKeys: PropTypes.array, // 展开行的 key 数组，支持动态赋值
    rowExpandable: PropTypes.func, // 是否允许行展开，参数：row，返回值 bool
    expandedRowRender: PropTypes.func.isRequired, // 额外的展开行渲染方法
    onExpand: PropTypes.func, // 点击展开图标时触发
    onChange: PropTypes.func // 展开的行变化时触发
  }),
  // 树结构配置项
  treeStructure: PropTypes.shape({
    defaultExpandAllRows: PropTypes.bool, // 默认展开所有行
    expandedRowKeys: PropTypes.array // 展开行的 key 数组，支持动态赋值
  }),
  // 多列排序
  multipleSort: PropTypes.bool.def(true),
  // 是否为前端内存分页
  webPagination: PropTypes.bool.def(false),
  // 分页配置参数
  paginationConfig: PropTypes.shape({
    layouts: PropTypes.array, // 分页组件布局
    currentPage: PropTypes.number, // 当前页数
    pageSize: PropTypes.number, // 每页显示条目个数
    pagerCount: PropTypes.number, // 页码按钮的数量
    pageSizeOptions: PropTypes.array // 个数选择器的选项设置
  }),
  // 是否显示表格顶部信息
  showAlert: PropTypes.bool.def(true),
  // 表格顶部信息放置的位置
  alertPosition: PropTypes.oneOf(['top', 'bottom']).def('top'),
  // 顶部按钮插槽的对其方式
  topSpaceAlign: PropTypes.oneOf(['left', 'right']).def('right'),
  // 是否显示全屏按钮
  showFullScreen: PropTypes.bool.def(true),
  // 是否显示刷新按钮
  showRefresh: PropTypes.bool.def(true),
  // 导出表格数据
  exportExcel: PropTypes.shape({
    fileName: PropTypes.string, // 导出的文件名，需包含扩展名[xlsx|csv]
    fetch: PropTypes.shape({
      api: PropTypes.func.isRequired, // api 接口
      params: PropTypes.object // 接口参数
    }),
    cellStyle: PropTypes.bool // 是否给单元格添加样式
  }),
  // 表格打印
  tablePrint: PropTypes.shape({
    showLogo: PropTypes.bool, // 是否显示 Logo
    showSign: PropTypes.bool // 是否显示签名
  }),
  // 是否显示高级检索
  showSuperSearch: PropTypes.bool.def(true),
  // 是否显示列定义
  showColumnDefine: PropTypes.bool.def(true),
  // 只显示图标，不显示文字
  onlyShowIcon: PropTypes.bool,
  // 加载表格之前的拦截器，适用于 fetch.api 情况
  beforeLoadTable: PropTypes.func
};

/**
 * 事件：
 * change: 分页、排序、筛选变化时触发，参数：pagination, filters, sorter, { currentDataSource: tableData, allDataSource: allTableData }
 * dataChange: 表格数据变化时触发，参数 tableData
 * dataLoaded: 表格数据加载之后触发，参数 tableData
 * rowClick: 行单击事件，参数 row, column, event
 * rowDblclick: 行双击事件，参数 row, column, event
 * rowEnter: 行选中(单选) 或 行高亮 回车时触发，参数 row, event
 */

/**
 * 方法：
 * CALCULATE_HEIGHT: 计算表格高度
 * DO_REFRESH: 刷新表格数据，同时会清空列选中状态
 * INSERT_RECORDS: 插入表格行数据，参数 row|rows, bottom(默认)|top
 * REMOVE_RECORDS: 移除表格数据，参数 rowKeys|rows|row
 * FORM_VALIDATE: 触发表格中的表单校验，返回值：object
 * OPEN_SEARCH_HELPER: 打开单元格搜索帮助面板，参数 rowKey, dataIndex
 * GET_LOG: 获取操作记录，非空校验、格式校验、数据操作记录，返回值：object
 * CLEAR_LOG: 清空表格操作记录
 * CLEAR_TABLE_DATA: 清空表格数据
 * SCROLL_TO_RECORD: 滚动到指定数据行，参数 rowKey
 * SCROLL_TO_COLUMN: 滚动到指定表格列，参数 dataIndex
 * SELECT_FIRST_RECORD: 选中表格首行，只针对单选类型有效
 * CLEAR_TABLE_FOCUS: 清空表格焦点
 */

// 清空高级检索: 1. fetch.params 变化  2. headFilters 变化  3. 点击清空按钮
