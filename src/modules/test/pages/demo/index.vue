<template>
  <div>
    <top-filter ref="topFilter" :list="filterList" :initial-value="filterDefaultValue" @change="filterChangeHandle" @collapseChange="collapseChangeHandle" />
    <button-area :container-style="{ paddingLeft: '80px' }">
      <el-button type="primary" icon="iconfont icon-plus" @click="asdasd">新建</el-button>
      <el-button type="primary" icon="iconfont icon-edit">编辑/修改</el-button>
      <el-button type="danger" icon="el-icon-delete">删除</el-button>
      <el-button type="primary" icon="iconfont icon-save">保存/提交</el-button>
      <el-button type="primary" icon="iconfont icon-detail">详情</el-button>
      <el-button type="primary" icon="iconfont icon-printer">打印</el-button>
      <el-button type="primary" icon="iconfont icon-export">导出</el-button>
      <el-button type="primary" icon="iconfont icon-Import">导入</el-button>
      <el-button type="primary" icon="iconfont icon-upload">上传</el-button>
      <el-button type="primary" icon="iconfont icon-download">下载</el-button>
      <el-button type="primary" icon="iconfont icon-search">搜索</el-button>
      <el-button type="primary" icon="iconfont icon-reload">重置</el-button>
      <el-button type="primary" icon="iconfont icon-clear">清空</el-button>
      <el-button type="primary" icon="iconfont icon-View">预览</el-button>
    </button-area>
    <VirtualTable
      ref="table"
      uniqueKey="jzyDemoTable"
      height="auto"
      :columns="columns"
      :fetch="fetch"
      :rowKey="record => record.index"
      :rowSelection="selection"
      :rowHighlight="rowHighlight"
      :exportExcel="exportExcel"
      :tablePrint="tablePrint"
      :columnsChange="columns => (this.columns = columns)"
    >
      <template slot="default">
        <el-button type="primary" icon="el-icon-plus" @click="addInfoHandle">新建</el-button>
        <el-button icon="el-icon-printer" @click="printHandle1">方法打印</el-button>
        <client-print uniqueKey="cprint_jzy" :dataSource="printDataList" :click="printHandle3" :templateRender="templateRender">客户端打印</client-print>
        <web-print :click="printHandle">pdf 打印</web-print>
        <el-button icon="el-icon-printer" @click="printHandle2">插件打印</el-button>
        <el-button type="danger" icon="el-icon-delete" @click="removeHandle">删除</el-button>
      </template>
    </VirtualTable>
    <drawer :visible.sync="actions.visible" :title="actions.title" destroy-on-close :container-style="{ height: 'calc(100% - 52px)', paddingBottom: '52px' }" @close="closeDrawerHandle">
      <add-info :type="actions.type" :initialValue="actions.data" @close="innerCloseHandle" />
    </drawer>
    <base-dialog :visible.sync="visible" title="标题" destroyOnClose>
      <portal-page
        :containerStyle="{ minHeight: `calc(80vh - 80px)`, height: `100%` }"
        loginUrl="https://portal.faw-vw.com/pkmslogin.form"
        :loginParams="params"
        pageUrl="https://portal.faw-vw.com/asjct/SAPAfterSales/pages/dserpclxxcx/clxxcx_result.jsp?vin=LFV2A1BS6D4055070"
        @success="successHandle"
      />
    </base-dialog>
    <client-print ref="print1" uniqueKey="cprint_jzy" :dataSource="printDataList" :templateRender="templateRender" />
    <base-print ref="print" :data="printList" printerType="stylus" :render="() => import(`@test/pages/printTemplate/demo`)" />
  </div>
</template>

<script>
import { dictionary } from '@/mixins/dictMixin'; // 数据字典
import { language } from '@/mixins/langMixin'; // 多语言 - mep 没有多语言功能
import { authority } from '@/mixins/authMixin'; // 权限

import { notifyAction, confirmAction, sleep, loadScript } from '@/utils';

import AddInfo from './addInfo';
import tableData from '@/mock/tableData';
import printData from '@/mock/printData';

import PrintTemplate from '@test/pages/printTemplate/demo2';

import './lang'; // mep 没有多语言功能

export default {
  name: 'Demo1',
  components: { AddInfo },
  mixins: [dictionary, language, authority],
  data() {
    this.selectedKeys = [1, 2];
    return {
      filterList: this.createTopFilterList(),
      filterDefaultValue: {},
      columns: this.createTableColumns(),
      fetch: {
        api: () => {},
        params: {},
        dataKey: 'items'
      },
      list: tableData.data.items,
      selection: {
        type: 'checkbox',
        selectedRowKeys: this.selectedKeys,
        clearableAfterFetched: false,
        disabled: row => {
          return row.id === 3;
        },
        onChange: (val, rows) => {
          console.log(123, val, rows);
          this.selectedKeys = val;
        }
      },
      rowHighlight: {},
      exportExcel: {
        fileName: '导出文件.xlsx'
      },
      tablePrint: {
        showLogo: true
      },
      // 交互页面
      actions: {
        type: 'default',
        title: '',
        visible: false,
        data: null
      },
      printList: printData.data,
      visible: false,
      params: {
        username: 's741039r01',
        password: 'JZga2018',
        'login-form-type': 'pwd'
      },
      printDataList: [],
      templateRender: null
    };
  },
  computed: {
    $topFilter() {
      return this.$refs.topFilter;
    },
    $table() {
      return this.$refs.table;
    },
    $print() {
      return this.$refs.print;
    }
  },
  mounted() {
    this.rowHighlight = { currentRowKey: 1 };
    loadScript('http://pv.sohu.com/cityjson?ie=utf-8', () => {
      console.log(`IP: ${returnCitySN['cip']}; CityID: ${returnCitySN['cid']}; City: ${returnCitySN['cname']}`);
    });
  },
  methods: {
    async printHandle1() {
      await sleep(1000);
      let res = [];
      for (let i = 0; i < 100; i++) {
        res[i] = i;
      }
      this.templateRender = PrintTemplate;
      this.printDataList = res;
      this.$refs.print1.DO_PRINT();
    },
    async printHandle3() {
      await sleep(1000);
      let res = [];
      for (let i = 0; i < 50; i++) {
        res[i] = i;
      }
      this.templateRender = PrintTemplate;
      this.printDataList = res;
    },
    asdasd() {
      this.visible = !this.visible;
    },
    successHandle() {
      console.log('外部系统页面打开成功！');
    },
    // 创建列表搜索配置项
    createTopFilterList() {
      return [
        {
          type: 'INPUT',
          label: this.$t('demo.label1'),
          fieldName: 'a',
          rules: [
            { required: true, message: '请输入条件', trigger: 'change' },
            { min: 3, max: 5, message: '长度在 3 到 5 个字符', trigger: 'change' }
          ]
        },
        {
          type: 'INPUT',
          label: '条件2',
          fieldName: 'b',
          searchHelper: {
            // tds =============
            // name: 'hello',
            // getServerConfig: () => {},
            // initialValue: { x2: '1' },
            // table: {
            //   rowKey: record => record.id,
            //   fetch: {
            //     api: () => {},
            //     params: {},
            //     dataKey: 'items'
            //   }
            // },
            // fieldsDefine: {
            //   valueName: 'id',
            //   displayName: 'b',
            //   descriptionName: 'extra'
            // }
            // tds =============
            filters: [
              {
                type: 'INPUT',
                label: '条件1',
                fieldName: 'a1'
              },
              {
                type: 'INPUT',
                label: '条件2',
                fieldName: 'a2'
              },
              {
                type: 'INPUT',
                label: '条件3',
                fieldName: 'a3'
              },
              {
                type: 'INPUT',
                label: '条件4',
                fieldName: 'a4'
              }
            ],
            table: {
              columns: [
                {
                  title: '创建时间',
                  dataIndex: 'date'
                },
                {
                  title: '姓名',
                  dataIndex: 'person.name'
                }
              ],
              rowKey: record => record.id,
              fetch: {
                api: () => {},
                params: {},
                dataKey: 'items'
              }
            },
            // height: '500px',
            fieldAliasMap: () => {
              return { b: 'date', code: 'date', extra: 'date' };
            },
            open: form => {
              // console.log(form);
              return true;
            }
          },
          style: { width: `calc(100% - 80px)` },
          descOptions: {
            style: { width: '70px' }
          }
        },
        {
          type: 'DATE',
          label: '条件3',
          fieldName: 'c',
          options: {
            dateType: 'date'
            // minDateTime: '2020-06-20'
          }
        },
        {
          type: 'CHECKBOX',
          label: '条件4',
          fieldName: 'd',
          options: {
            trueValue: '1',
            falseValue: '0'
          }
        },
        {
          type: 'RANGE_DATE',
          label: '条件5',
          style: { minWidth: '220px' },
          fieldName: 'startTime|endTime',
          options: {
            dateType: 'exactdaterange'
          },
          rules: [{ required: true, message: '请选择日期', trigger: 'change' }]
        },
        {
          type: 'SEARCH_HELPER',
          label: '条件6',
          fieldName: 'f',
          request: {
            fetchApi: () => {},
            params: {},
            datakey: 'items'
          },
          options: {
            columns: [
              { dataIndex: 'name', title: '姓名' },
              { dataIndex: 'price', title: '价格' }
            ],
            fieldAliasMap: () => {
              return { f: 'name' };
            }
          }
        },
        {
          type: 'RADIO',
          label: '条件7',
          fieldName: 'p',
          options: {
            itemList: [
              { text: '男', value: '1' },
              { text: '女', value: '0' }
            ]
          }
        }
      ];
    },
    // 创建表格列配置
    createTableColumns() {
      return [
        {
          title: '操作',
          dataIndex: '__action__', // 操作列的 dataIndex 的值不能改
          fixed: 'left',
          width: 100,
          render: (text, row) => {
            return (
              <div>
                <el-button type="text" onClick={() => this.editInfoHandle(row)}>
                  编辑
                </el-button>
                <el-button type="text" onClick={() => this.showInfoHandle(row)}>
                  查看
                </el-button>
              </div>
            );
          }
        },
        {
          title: '序号',
          dataIndex: 'pageIndex',
          width: 80,
          sorter: true,
          render: text => {
            return text + 1;
          }
        },
        {
          title: '创建时间',
          dataIndex: 'date',
          width: 220,
          sorter: true,
          filter: {
            type: 'date'
          },
          editRender: row => {
            return {
              type: 'datetime'
            };
          }
        },
        {
          title: '个人信息',
          dataIndex: 'person',
          children: [
            {
              title: '姓名',
              dataIndex: 'person.name',
              width: 200,
              required: true,
              sorter: true,
              filter: {
                type: 'text'
              },
              editRender: row => {
                const obj = {
                  type: 'search-helper',
                  // editable: true,
                  extra: {
                    readonly: false,
                    maxlength: 10,
                    disabled: row.id === 3
                  },
                  helper: {
                    filters: [
                      {
                        type: 'INPUT',
                        label: '条件1',
                        fieldName: 'a'
                      }
                    ],
                    table: {
                      columns: [
                        {
                          title: '创建时间',
                          dataIndex: 'date',
                          filter: {
                            type: 'date'
                          }
                        },
                        {
                          title: '姓名',
                          dataIndex: 'person.name'
                        }
                      ],
                      rowKey: record => record.id,
                      fetch: {
                        api: () => {},
                        params: {},
                        dataKey: 'items'
                      }
                    },
                    fieldAliasMap: () => {
                      return { 'person.name': 'date', 'person.age': 'date' };
                    },
                    closed: () => {
                      obj.helper.initialValue = { a: '' };
                    }
                  },
                  rules: [{ required: true, message: '姓名不能为空' }],
                  onChange: (cellVal, row) => {
                    const keys = Object.keys(cellVal)[0].split('|');
                    obj.helper.initialValue = { a: '1234' };
                    this.$table.OPEN_SEARCH_HELPER(keys[0], keys[1]);
                  }
                  // onClick: (cell, row, column, cb, ev) => {
                  //   this.tableShProps = Object.assign({}, this.tableShProps, {
                  //     dataIndex: column.dataIndex,
                  //     fieldAliasMap: () => {
                  //       return { 'person.name': 'date', 'person.age': 'date' };
                  //     },
                  //     callback: cb
                  //   });
                  //   this.visible_table = true;
                  // }
                };
                return obj;
              }
            },
            {
              title: '性别',
              dataIndex: 'person.sex',
              width: 100,
              dictItems: [
                { text: '男', value: '1' },
                { text: '女', value: '0' }
              ]
            },
            {
              title: '年龄',
              dataIndex: 'person.age',
              width: 100,
              sorter: true,
              filter: {
                type: 'number'
              },
              editRender: row => {
                return {
                  type: 'search-helper',
                  // editable: true,
                  helper: {
                    filters: [
                      {
                        type: 'INPUT',
                        label: '条件1',
                        fieldName: 'a'
                      }
                    ],
                    table: {
                      columns: [
                        {
                          title: '创建时间',
                          dataIndex: 'date',
                          filter: {
                            type: 'date'
                          }
                        },
                        {
                          title: '姓名',
                          dataIndex: 'person.name'
                        }
                      ],
                      rowKey: record => record.id,
                      fetch: {
                        api: () => {},
                        params: {},
                        dataKey: 'items'
                      }
                    },
                    fieldAliasMap: () => {
                      return { 'person.age': 'date', 'person.name': 'date' };
                    }
                  }
                };
              }
            }
          ]
        },
        {
          title: '价格',
          dataIndex: 'price',
          width: 150,
          precision: 2,
          required: true,
          sorter: true,
          groupSummary: true,
          filter: {
            type: 'number'
          },
          editRender: row => {
            return {
              type: 'number',
              extra: {
                max: 1000
              },
              rules: [{ required: true, message: '价格不能为空' }]
            };
          }
        },
        {
          title: '数量',
          dataIndex: 'num',
          width: 150,
          required: true,
          sorter: true,
          groupSummary: true,
          filter: {
            type: 'number'
          },
          editRender: row => {
            return {
              type: 'number',
              extra: {
                max: 1000
              },
              rules: [{ required: true, message: '数量不能为空' }]
            };
          }
        },
        {
          title: '总价',
          dataIndex: 'total',
          width: 150,
          precision: 2,
          align: 'right',
          sorter: true,
          groupSummary: true,
          filter: {
            type: 'number'
          },
          summation: {
            sumBySelection: true,
            displayWhenNotSelect: true,
            unit: '元'
          },
          render: (text, row) => {
            row.total = row.price * row.num;
            return <span>{row.total.toFixed(2)}</span>;
          },
          extraRender: (text, row) => {
            return Number(row.price * row.num).toFixed(2);
          }
        },
        {
          title: '是否选择',
          dataIndex: 'choice',
          align: 'center',
          width: 150,
          editRender: row => {
            return {
              type: 'checkbox',
              editable: true,
              extra: {
                trueValue: 1,
                falseValue: 0,
                disabled: true
              }
            };
          },
          dictItems: [
            { text: '选中', value: 1 },
            { text: '非选中', value: 0 }
          ]
        },
        {
          title: '状态',
          dataIndex: 'state',
          width: 150,
          colSpan: 2,
          filter: {
            type: 'radio',
            items: [
              { text: '已完成', value: 1 },
              { text: '进行中', value: 2 },
              { text: '未完成', value: 3 }
            ]
          },
          editRender: row => {
            return {
              type: 'select',
              items: [
                { text: '已完成', value: 1 },
                { text: '进行中', value: 2 },
                { text: '未完成', value: 3 }
              ]
            };
          },
          dictItems: [
            { text: '已完成', value: 1 },
            { text: '进行中', value: 2 },
            { text: '未完成', value: 3 }
          ]
        },
        {
          title: '业余爱好',
          dataIndex: 'hobby',
          width: 150,
          colSpan: 0,
          filter: {
            type: 'checkbox',
            items: [
              { text: '篮球', value: 1 },
              { text: '足球', value: 2 },
              { text: '乒乓球', value: 3 },
              { text: '游泳', value: 4 }
            ]
          },
          editRender: row => {
            return {
              type: 'select-multiple',
              items: [
                { text: '篮球', value: 1 },
                { text: '足球', value: 2 },
                { text: '乒乓球', value: 3 },
                { text: '游泳', value: 4 }
              ]
            };
          },
          dictItems: [
            { text: '篮球', value: 1 },
            { text: '足球', value: 2 },
            { text: '乒乓球', value: 3 },
            { text: '游泳', value: 4 }
          ]
        },
        {
          title: '地址',
          dataIndex: 'address',
          width: 200,
          editRender: row => {
            return {
              type: 'text'
            };
          }
        }
      ];
    },
    // 搜索条件变化
    filterChangeHandle(val) {
      console.log(111, val);
      this.fetch.params = Object.assign({}, this.fetch.params, val);
    },
    // 展开/收起 状态变化
    collapseChangeHandle(val) {
      this.$table.CALCULATE_HEIGHT();
    },
    // 新建按钮
    addInfoHandle() {
      this.actions = Object.assign({}, this.actions, { type: '', visible: true, title: '新建信息', data: null });
    },
    // 表格编辑按钮
    editInfoHandle(row) {
      this.actions = Object.assign({}, this.actions, { type: '', visible: true, title: '编辑信息', data: row });
    },
    // 表格查看按钮
    showInfoHandle(row) {
      this.actions = Object.assign({}, this.actions, { type: 'onlyShow', visible: true, title: '查看信息', data: row });
    },
    // 删除按钮
    async removeHandle() {
      if (!this.selectedKeys.length) {
        return notifyAction(`请选择数据！`, 'warning');
      }
      try {
        await confirmAction();
        // 点击确定后，执行下边代码
        // ...
      } catch (err) {}
    },
    // 抽屉组件子组件的关闭事件
    innerCloseHandle(visible, isReload) {
      this.actions.visible = visible;
      // 重置 actions 的值
      if (isReload) {
        // 执行表格刷新
        this.$table.DO_REFRESH();
      }
    },
    // 抽屉组件的关闭事件
    closeDrawerHandle(isReload) {
      if (isReload) {
        // 执行表格刷新
        this.$table.DO_REFRESH();
      }
    },
    // 打印方法
    async printHandle() {
      await sleep(1000);
      return '/static/webPrint/20200415.pdf';
    },
    // lodop 插件打印
    printHandle2() {
      this.$print.EXCUTE_PRINT();
    }
  }
};
</script>
