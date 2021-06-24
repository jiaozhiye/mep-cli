<template>
  <div>
    <el-button @click="clickHandle">按钮</el-button>
    <div v-if="visible">
      <VirtualTable
        ref="table"
        uniqueKey="jzyDemoTable2"
        :exportExcel="{
          fileName: 'aaa.xlsx'
        }"
        :tablePrint="{
          showLogo: true
        }"
        :columns="columns"
        :dataSource="list"
        rowKey="key"
        maxHeight="400"
        :rowSelection="selection"
        :columnsChange="columnsChange"
        @dataChange="changeHandle"
      >
        <span></span>
      </VirtualTable>
    </div>
  </div>
</template>

<script>
const data = [
  {
    key: 1,
    name: 'John Brown sr.',
    age: 60,
    address: 'New York No. 1 Lake Park',
    children: [
      {
        key: 11,
        name: 'John Brown',
        age: 42,
        address: 'New York No. 2 Lake Park'
      },
      {
        key: 12,
        name: 'John Brown jr.',
        age: 30,
        address: 'New York No. 3 Lake Park',
        children: [
          {
            key: 121,
            name: 'Jimmy Brown',
            age: 16,
            address: 'New York No. 3 Lake Park'
          }
        ]
      },
      {
        key: 13,
        name: 'Jim Green sr.',
        age: 72,
        address: 'London No. 1 Lake Park',
        children: [
          {
            key: 131,
            name: 'Jim Green',
            age: 42,
            address: 'London No. 2 Lake Park',
            children: [
              {
                key: 1311,
                name: 'Jim Green jr.',
                age: 25,
                address: 'London No. 3 Lake Park'
              },
              {
                key: 1312,
                name: 'Jimmy Green sr.',
                age: 18,
                address: 'London No. 4 Lake Park'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    key: 2,
    name: 'Joe Black',
    age: 32,
    address: 'Sidney No. 1 Lake Park'
  }
];

export default {
  name: 'Demo2',
  data() {
    return {
      visible: true,
      list: data,
      height: 400,
      fetch: {
        api: () => {},
        params: {},
        dataKey: 'items'
      },
      columns: [
        {
          title: '序号',
          dataIndex: 'index',
          width: 100,
          fixed: 'left',
          sorter: true,
          render: text => {
            return text + 1;
          }
        },
        {
          title: '创建时间',
          dataIndex: 'name',
          width: 200
        },
        {
          title: '创建时间',
          dataIndex: 'age',
          width: 200
        },
        {
          title: '创建时间',
          dataIndex: 'address'
        }
      ],
      selection: {
        type: 'checkbox',
        checkStrictly: false,
        selectedRowKeys: [1312, 200, 201, 202, 203],
        disabled: row => {
          return row.id === 3;
        },
        onChange: val => {
          console.log(222, val);
        }
      },
      expandable: {
        // defaultExpandAllRows: true,
        expandedRowRender: () => {
          return <span>asdasd</span>;
        },
        onChange: val => {
          // console.log(val);
        }
      }
    };
  },
  computed: {
    $table() {
      return this.$refs[`table`];
    }
  },
  methods: {
    changeHandle() {
      // console.log(111);
    },
    columnsChange(columns) {
      this.columns = columns;
    },
    clickHandle() {
      // this.list.push({ id: Math.random(), books: 10 });
      // this.list.splice(0, 1);
      // this.selection.selectedRowKeys = [4];
      // console.log(this.$refs.table.GET_LOG());
      // this.visible = !this.visible;
      // this.$table.INSERT_RECORDS({ id: Math.random(), books: 10 });
    }
  }
};
</script>
