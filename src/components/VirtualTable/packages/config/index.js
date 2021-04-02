/*
 * @Author: 焦质晔
 * @Date: 2020-03-02 21:21:13
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-03-29 14:41:02
 */
import i18n from '../locale';

const config = {
  // 表格列的默认最小宽度
  defaultColumnWidth: 80,
  // 行高的映射表
  rowHeightMaps: {
    default: 44,
    medium: 40,
    small: 36,
    mini: 32
  },
  // table 尺寸的映射
  toTableSize: {
    large: 'medium',
    default: 'small',
    small: 'mini'
  },
  // 排序方式
  sortDirections: ['ascend', 'descend'],
  // 分页
  pagination: {
    currentPage: 1,
    pageSize: 20,
    sizes: [10, 20, 30, 40, 50]
  },
  // 汇总
  groupSummary: {
    total: { text: '记录数', value: '*' },
    recordTotalIndex: 'nRecordsCount', // 记录数对应的后台数据的 key
    summaryFieldName: 'tsummary',
    groupbyFieldName: 'tgroupby'
  },
  // 高级检索
  highSearch: {
    showSQL: false
  },
  // 树表格
  treeTable: {
    textIndent: 17 // 缩进 17px
  },
  // 后台返回数据的路径
  dataKey: 'items',
  // 后台返回总条数的 key
  totalKey: 'total',
  // 虚拟滚动的阀值
  virtualScrollY: 150,
  // 表头排序的参数名
  sorterFieldName: 'tsortby',
  // 表头筛选的参数名
  filterFieldName: 'twhere',
  // 是否显示筛选字段类型
  showFilterType: false,
  // 打印纸的宽度 A4 -> 1040px
  printWidth: 1040,
  // 可选择列
  selectionText: () => i18n.t('table.config.selectionText'),
  // 操作列 dataIndex
  operationColumn: '__action__',
  // 合计行第一列的文本
  summaryText: () => i18n.t('table.config.summaryText'),
  // 暂无数据
  emptyText: () => i18n.t('table.config.emptyText')
};

export default config;
