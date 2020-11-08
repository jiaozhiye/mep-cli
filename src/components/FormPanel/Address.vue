<template>
  <div v-loading="loading">
    <el-tabs v-model="tabsActive" type="card" :stretch="true" @tab-click="tabsChange">
      <el-tab-pane label="省份" name="province">
        <div class="province">
          <div v-for="(p, index) in pinyinList" :key="index">
            <div class="pinyin">{{ p[0] + '-' + p[p.length - 1] }}</div>
            <ul class="address">
              <li v-for="x in list.province.filter(x => p.includes(x.vPinYin[0]))" :key="x.iD" :class="{ active: x.iD == currentID.province.iD }" @click="provinceChange(x)">
                {{ x.vName }}
              </li>
            </ul>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="城市" name="city">
        <ul class="address">
          <li v-for="x in list.city" :key="x.iD" :class="{ active: x.iD == currentID.city.iD }" @click="cityChange(x)">{{ x.vName }}</li>
        </ul>
      </el-tab-pane>
      <el-tab-pane label="区/县" name="county">
        <ul class="address">
          <li v-for="x in list.county" :key="x.iD" :class="{ active: x.iD == currentID.county.iD }" @click="countyChange(x)">{{ x.vName }}</li>
        </ul>
      </el-tab-pane>
      <el-tab-pane label="街道" name="street">
        <ul class="address">
          <li v-for="x in list.street" :key="x.iD" :class="{ active: x.iD == currentID.street.iD }" @click="streetChange(x)">{{ x.vName }}</li>
        </ul>
      </el-tab-pane>
    </el-tabs>
    <!-- <div style="text-align: right"> -->
    <!--   <el-button type="primary" @click="confirmBtn">确 定</el-button> -->
    <!-- </div> -->
  </div>
</template>

<script>
/**
 * @Author: 田暹琪
 * @Date: 2020-07-10 10:00:00
 * @Last Modified by: 田暹琪
 * @Last Modified time: 2020-8-19 11:40:35
 **/
import PropTypes from '../_utils/vue-types';

export default {
  name: 'Address',
  props: {
    value: PropTypes.array,
    labels: PropTypes.array,
    fetch: PropTypes.shape({
      fetchApi: PropTypes.func.isRequired, // api 接口
      params: PropTypes.object // 接口参数
    }),
    visible: PropTypes.bool
  },
  data() {
    return {
      loading: false,
      pinyinList: [
        ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
        ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
        ['O', 'P', 'Q', 'R', 'S', 'T'],
        ['U', 'V', 'W', 'X', 'Y', 'Z']
      ],
      tabsActive: 'province',
      currentList: [],
      currentID: {
        province: {},
        city: {},
        county: {},
        street: {}
      },
      list: {
        province: [],
        city: [],
        county: [],
        street: []
      }
    };
  },
  watch: {
    async value(val) {
      if (this.visible) return;
      this.tabsActive = 'province';
      let cur = val.find(x => x.vLevel == 1);
      if (cur) {
        this.currentID.province = { ...cur };
        await this.provinceChange(this.currentID.province);
      } else {
        this.currentID.province = {};
      }
      cur = val.find(x => x.vLevel == 2);
      if (cur) {
        this.currentID.city = { ...cur };
        await this.cityChange(this.currentID.city);
      } else {
        this.currentID.city = {};
      }
      cur = val.find(x => x.vLevel == 3);
      if (cur) {
        this.currentID.county = { ...cur };
        await this.countyChange(this.currentID.county);
      } else {
        this.currentID.county = {};
      }
      cur = val.find(x => x.vLevel == 4);
      if (cur) {
        this.currentID.street = { ...cur };
        await this.streetChange(this.currentID.street);
      } else {
        this.currentID.street = {};
      }
    }
  },
  async mounted() {
    let res = await this.fetch.fetchApi({ ...this.fetch.params, vLevel: 1 });
    this.list.province = res.data;
    res.data.sort((a, b) => {
      if (a.vPinYin < b.vPinYin) return -1;
      if (a.vPinYin > b.vPinYin) return 1;
      return 0;
    });
  },
  methods: {
    tabsChange(val) {
      this.$nextTick(() => {
        if (Number(val.index) > 0 && !this.currentID.province.iD) {
          this.tabsActive = 'province';
          return false;
        }
        if (Number(val.index) > 1 && !this.currentID.city.iD) {
          this.tabsActive = 'city';
          return false;
        }
        if (Number(val.index) > 2 && !this.currentID.county.iD) {
          this.tabsActive = 'county';
          return false;
        }
        return true;
      });
    },
    async provinceChange(val) {
      this.currentID.province = val;
      if (val) {
        this.loading = true;
        this.currentID.city = {};
        this.list.city = [];
        this.currentList = this.currentList.filter(x => x.vLevel != 2);
        this.currentID.county = {};
        this.list.county = [];
        this.currentList = this.currentList.filter(x => x.vLevel != 3);
        this.currentID.street = {};
        this.list.street = [];
        this.currentList = this.currentList.filter(x => x.vLevel != 4);
        let res = await this.fetch.fetchApi({ ...this.fetch.params, iD: val.iD, vLevel: 2 });
        this.loading = false;
        this.list.city = res.data;
        this.tabsActive = 'city';
        this.computedList(val, 1);
      } else {
        this.currentList = this.currentList.filter(x => x.vLevel != 1);
      }
    },
    async cityChange(val) {
      this.currentID.city = val;
      if (val) {
        this.loading = true;
        this.currentID.county = {};
        this.list.county = [];
        this.currentList = this.currentList.filter(x => x.vLevel != 3);
        this.currentID.street = {};
        this.list.street = [];
        this.currentList = this.currentList.filter(x => x.vLevel != 4);
        let res = await this.fetch.fetchApi({ ...this.fetch.params, iD: val.iD, vLevel: 3 });
        this.loading = false;
        this.list.county = res.data;
        this.tabsActive = 'county';
        this.computedList(val, 2);
      } else {
        this.currentList = this.currentList.filter(x => x.vLevel != 2);
      }
    },
    async countyChange(val) {
      this.currentID.county = val;
      if (val) {
        this.loading = true;
        this.currentID.street = {};
        this.list.street = [];
        this.currentList = this.currentList.filter(x => x.vLevel != 4);
        let res = await this.fetch.fetchApi({ ...this.fetch.params, iD: val.iD, vLevel: 4 });
        this.loading = false;
        this.list.street = res.data;
        this.tabsActive = 'street';
        this.computedList(val, 3);
      } else {
        this.currentList = this.currentList.filter(x => x.vLevel != 3);
      }
    },
    streetChange(val) {
      this.currentID.street = val;
      if (val) {
        this.computedList(val, 4);
      } else {
        this.currentList = this.currentList.filter(x => x.vLevel != 4);
      }
    },
    computedList(cur, vLevel) {
      let isHave = false;
      for (let i in this.currentList) {
        let c = this.currentList[i];
        if (c.vLevel == vLevel) {
          this.currentList[i] = { iD: cur.iD, vLevel: vLevel, vCode: cur.vCode, vName: cur.vName, vPostNo: cur.vPostNo };
          isHave = true;
        }
      }
      if (!isHave) {
        this.currentList.push({ iD: cur.iD, vLevel: vLevel, vCode: cur.vCode, vName: cur.vName, vPostNo: cur.vPostNo });
      }
      this.currentList.sort((a, b) => {
        return a.vLevel - b.vLevel;
      });
      if (this.visible) {
        this.$emit('input', JSON.parse(JSON.stringify(this.currentList)));
        this.$emit('change', JSON.parse(JSON.stringify(this.currentList)));
        if (vLevel == 4) this.$emit('close', false);
      }
    }
    // confirmBtn() {
    //   this.$emit('input', JSON.parse(JSON.stringify(this.currentList)));
    //   this.$emit('change', JSON.parse(JSON.stringify(this.currentList)));
    //   this.$emit('close', false);
    // }
  }
};
</script>

<style lang="scss" scoped>
@import '../style/index.scss';

ul.address {
  overflow: hidden;
  font-size: 14px;
  color: #606060;
  width: 400px;
  max-height: 150px;
  overflow-y: auto;
  margin-bottom: 10px;

  li {
    display: inline-block;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 3px;

    &:hover {
      color: $primary-color;
    }

    &.active {
      background-color: $primary-color;
      color: #fff;
    }
  }
}

.province {
  max-height: 150px;
  overflow-y: auto;
  margin-bottom: 10px;

  ul.address {
    width: 360px;
    float: left;
    margin-bottom: 0;
  }

  .pinyin {
    width: 40px;
    float: left;
    padding: 5px 10px;
    font-weight: bold;
    text-align: right;
  }
}
</style>
