<template>
  <div>
    <VirtualTable
      ref="table"
      maxHeight="600"
      rowKey="id"
      :columns="columns"
      :dataSource="list"
      :groupSubtotal="groupSubtotal"
      :treeStructure="treeStructure"
      :exportExcel="exportExcel"
      :spanMethod="spanMethod"
      :webPagination="true"
      :columnsChange="columnsChange"
    />
  </div>
</template>

<script>
const tableData = [
  {
    id: 1,
    pinpaiId: '1',
    pinpaiText: '大众',
    chexingId: '101',
    chexingText: '轿车',
    chexiId: '1001',
    chexiText: '车系1',
    name: '速腾',
    p1: 1000,
    p2: 1500,
    p3: 2000
  },
  {
    id: 2,
    pinpaiId: '1',
    pinpaiText: '大众',
    chexingId: '101',
    chexingText: '轿车',
    chexiId: '1001',
    chexiText: '车系1',
    name: '迈腾',
    p1: 1000,
    p2: 1500,
    p3: 2000
  },
  {
    id: 3,
    pinpaiId: '1',
    pinpaiText: '大众',
    chexingId: '102',
    chexingText: 'SUV',
    chexiId: '1002',
    chexiText: '车系2',
    name: '探岳',
    p1: 1000,
    p2: 1500,
    p3: 2000
  },
  {
    id: 4,
    pinpaiId: '1',
    pinpaiText: '大众',
    chexingId: '102',
    chexingText: 'SUV',
    chexiId: '1002',
    chexiText: '车系2',
    name: '探歌',
    p1: 1000,
    p2: 1500,
    p3: 2000
  },
  {
    id: 5,
    pinpaiId: '2',
    pinpaiText: '奥迪',
    chexingId: '101',
    chexingText: '轿车',
    chexiId: '1001',
    chexiText: '车系1',
    name: 'A4L',
    p1: 1000,
    p2: 1500,
    p3: 2000
  },
  {
    id: 6,
    pinpaiId: '2',
    pinpaiText: '奥迪',
    chexingId: '101',
    chexingText: '轿车',
    chexiId: '1001',
    chexiText: '车系1',
    name: 'A6L',
    p1: 1000,
    p2: 1500,
    p3: 2000
  },
  {
    id: 7,
    pinpaiId: '2',
    pinpaiText: '奥迪',
    chexingId: '102',
    chexingText: 'SUV',
    chexiId: '1002',
    chexiText: '车系2',
    name: 'Q5L',
    p1: 1000,
    p2: 1500,
    p3: 2000
  },
  {
    id: 8,
    pinpaiId: '2',
    pinpaiText: '奥迪',
    chexingId: '102',
    chexingText: 'SUV',
    chexiId: '1002',
    chexiText: '车系2',
    name: 'Q7L',
    p1: 1000,
    p2: 1500,
    p3: 2000
  }
];

// for (let i = 9; i < 301; i++) {
//   tableData.push({
//     id: i,
//     pinpaiId: '2',
//     pinpaiText: '奥迪',
//     chexingId: '102',
//     chexingText: 'SUV',
//     chexiId: '1002',
//     chexiText: '车系2',
//     name: 'Q7L',
//     p1: 1000,
//     p2: 1500,
//     p3: 2000
//   });
// }

export default {
  name: 'Demo3',
  data() {
    return {
      list: tableData,
      treeStructure: {
        defaultExpandAllRows: true
      },
      groupSubtotal: [{ dataIndex: 'pinpaiText' }, { dataIndex: 'chexingText' }, { dataIndex: 'chexiText' }],
      exportExcel: {
        fileName: '导出文件.xlsx'
      },
      columns: this.createTableColumns()
    };
  },
  methods: {
    spanMethod({ row, column, rowIndex, columnIndex }) {
      if (this.groupSubtotal.map(x => x.titleIndex || x.dataIndex).includes(column.dataIndex)) {
        return [row._rowSpan ?? 1, 1];
      }
      return [1, 1];
    },
    createTableColumns() {
      return [
        {
          title: '序号',
          dataIndex: 'index',
          width: 120,
          fixed: 'left',
          sorter: true,
          render: text => {
            return text !== '' ? text + 1 : '小计';
          }
        },
        {
          title: '品牌',
          dataIndex: 'pinpaiText',
          width: 250,
          sorter: true,
          filter: {
            type: 'text'
          }
        },
        {
          title: '车型',
          dataIndex: 'chexingText',
          width: 250,
          sorter: true,
          filter: {
            type: 'text'
          }
        },
        {
          title: '车系',
          dataIndex: 'chexiText',
          width: 250,
          sorter: true,
          filter: {
            type: 'text'
          }
        },
        {
          title: '名称',
          dataIndex: 'name',
          width: 250,
          sorter: true,
          filter: {
            type: 'text'
          }
        },
        {
          title: '价格1',
          dataIndex: 'p1',
          width: 200,
          align: 'right',
          precision: 2,
          summation: {
            unit: '元'
          }
        },
        {
          title: '价格2',
          dataIndex: 'p2',
          width: 200,
          align: 'right',
          precision: 2,
          summation: {
            unit: '元'
          }
        },
        {
          title: '价格3',
          dataIndex: 'p3',
          width: 200,
          align: 'right',
          precision: 2,
          summation: {
            unit: '元'
          }
        }
      ];
    },
    columnsChange(columns) {
      this.columns = columns;
    }
  }
};
</script>
