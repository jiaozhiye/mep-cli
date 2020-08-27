<script>
import { dictionary } from '@/mixins/dictMixin'; // 数据字典
import { messageAction } from '@/utils';
import { getSysParams, saveSysParams } from '@common/api/sysParams';

export default {
  name: 'JzySysParams',
  mixins: [dictionary],
  data() {
    return {
      defaultTabKey: '0',
      list: [],
      loading: false
    };
  },
  computed: {
    formRefs() {
      return this.list.map((x, i) => `form_${i}`);
    }
  },
  mounted() {
    this.getSysParamData();
  },
  methods: {
    async getSysParamData() {
      this.loading = !0;
      const res = await getSysParams({ vModule: 'sys' });
      if (res.code === 200) {
        this.list = res.data;
      }
      this.loading = !1;
    },
    async saveHandle() {
      let result = {};
      for await (let val of this.formRefs) {
        const [err, data] = await this.$refs[val]?.GET_FORM_DATA();
        if (err) return;
        result = Object.assign({}, result, data);
      }
      if (!Object.keys(result).length) return;
      const res = await saveSysParams(result);
      if (res.code === 200) {
        messageAction('保存成功！', 'success');
      }
    },
    formatType() {
      return 'INPUT';
    },
    createFormList(arr) {
      return arr
        .filter(x => x.cVisible === '1')
        .map(x => ({
          type: this.formatType(x.vEditType),
          label: x.vParaName,
          fieldName: x.vPara,
          style: { width: '200px' },
          disabled: x.cAlert === '2',
          options: {
            precision: 2,
            min: x.nMinValue,
            max: x.nMaxValue,
            trueValue: '1',
            falseValue: '0',
            itemList: this.createDictList(x.vDataSource)
          },
          descOptions: {
            content: x.vDesc
          }
        }));
    },
    createFormValue(arr) {
      const result = {};
      arr
        .filter(x => x.cVisible === '1')
        .forEach(x => {
          result[x.vPara] = x.vParaValue;
        });
      return result;
    }
  },
  render() {
    const { defaultTabKey, loading, list, formRefs } = this;
    return (
      <div class="sys-wrapper">
        <Spin spinning={loading} tip="Loading...">
          <el-tabs v-model={defaultTabKey}>
            {list.map((x, i) => (
              <el-tab-pane name={i.toString()} label={x.title}>
                <FormPanel ref={formRefs[i]} initialValue={this.createFormValue(x.list)} list={this.createFormList(x.list)} labelWidth={150} />
              </el-tab-pane>
            ))}
          </el-tabs>
          <div class="btn-wrap">
            <multiuse-button type="primary" icon="iconfont icon-save" click={this.saveHandle}>
              保存
            </multiuse-button>
          </div>
        </Spin>
      </div>
    );
  }
};
</script>

<style lang="scss" scoped>
.sys-wrapper {
  position: relative;
  /deep/ .el-tabs__content {
    height: calc(100vh - 125px);
    overflow-y: auto;
  }
  .btn-wrap {
    position: absolute;
    right: 0;
    top: 0;
  }
}
</style>
