<script>
/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-08-28 10:59:53
 **/
import { mapActions } from 'vuex';
import addEventListener from 'add-dom-event-listener';
import { uniqBy } from 'lodash';
import { size } from '@/mixins/sizeMixin';

export default {
  name: 'MultiTab',
  mixins: [size],
  data() {
    // 本地路由
    const localRoutes = this.getLocalTabNav()
      .map(x => this.getRouteByPath(x.key))
      .filter(x => !!x);
    return {
      activeKey: this.$route.path,
      pages: uniqBy([...localRoutes, ...(this.$route.path === '/home' ? [this.$route] : [this.getRouteByPath('/home'), this.$route])], 'path'),
      visible: false,
      currentKey: '',
      position: { x: 0, y: 0 }
    };
  },
  computed: {
    $multiTab() {
      return this.$refs.multiTab.$el;
    },
    pathList() {
      return this.pages.map(x => x.path);
    }
  },
  watch: {
    $route(val) {
      const { path } = val;
      if (path.startsWith('/redirect')) return;
      this.activeKey = path;
      this.addKeepAlive(val);
      if (!this.pathList.includes(this.activeKey)) {
        this.pages.push(val);
      }
    },
    pages: {
      handler(val) {
        this.createTabNavList(val.map(x => ({ key: x.path, title: x.meta.title })));
        this.createIframeList(val.filter(x => !!x.meta.iframeRoutePath).map(x => ({ key: x.path, value: x.meta.iframeRoutePath })));
      },
      immediate: true
    }
  },
  created() {
    this.addKeepAlive(this.$route);
  },
  mounted() {
    this.bindContextmenuEvent();
    this.bindDocumentEvent();
  },
  destroyed() {
    this.contextmenuEvent.remove();
    this.clickEvent.remove();
  },
  methods: {
    ...mapActions('app', ['addKeepAliveCache', 'removeKeepAliveCache', 'createTabNavList', 'createIframeList', 'refreshView']),
    getRouteByPath(path) {
      return this.deepMapRoutes(this.$router.options.routes, path);
    },
    getRouteComponent(route) {
      return route.matched[route.matched.length - 1].components.default;
    },
    getLocalTabNav() {
      const localTabNav = localStorage.getItem('tab_nav');
      let result = [];
      if (localTabNav) {
        try {
          result = JSON.parse(localTabNav);
        } catch (e) {}
      }
      return result;
    },
    addKeepAlive(route) {
      if (!route.meta.keepAlive) return;
      // 当前路由组件
      const current = this.getRouteComponent(route);
      // 添加组件缓存列表
      if (current && current.name) {
        this.addKeepAliveCache({ key: this.activeKey, value: current.name });
      }
    },
    removeTab(targetKey) {
      if (targetKey === '/home') return;
      this.pages = this.pages.filter(page => page.path !== targetKey);
      // 移除组件缓存列表
      this.removeKeepAliveCache(targetKey);
      // 判断当前标签是否关闭，若关闭则跳转到最后一个还存在的标签页
      if (!this.pathList.includes(this.activeKey)) {
        this.locationChange(this.pathList[this.pathList.length - 1]);
      }
    },
    handleClick(tab, ev) {
      this.locationChange(tab.name);
    },
    findCurTagIndex() {
      return this.pages.findIndex(x => x.path === this.currentKey);
    },
    locationChange(val) {
      // const { query } = this.$route;
      this.activeKey = val;
      this.$router.push({ path: val, query: {} }).catch(() => {});
    },
    refreshTagHandle() {
      const { query } = this.$route;
      this.activeKey = this.currentKey;
      this.refreshView({ path: this.activeKey, query });
    },
    closeOtherTagHandle() {
      const index = this.findCurTagIndex();
      if (index === -1) return;
      this.pages.forEach(({ path }, i) => {
        if (i === index) return;
        this.removeTab(path);
      });
    },
    closeTagHandle(dir) {
      const index = this.findCurTagIndex();
      if (index === -1) return;
      let isClosed = false;
      this.pages.forEach(({ path }, i) => {
        if (dir === 'right' && i > index) {
          if (path === this.activeKey) {
            isClosed = true;
          }
          this.removeTab(path);
        }
        if (dir === 'left' && i < index) {
          if (path === this.activeKey) {
            isClosed = true;
          }
          this.removeTab(path);
        }
      });
      if (isClosed) {
        this.locationChange(this.currentKey);
      }
    },
    showContextMenu(key) {
      this.currentKey = key;
      this.visible = true;
    },
    closeContextMenu() {
      this.visible = false;
    },
    bindContextmenuEvent() {
      this.contextmenuEvent = addEventListener(this.$multiTab, 'contextmenu', ev => {
        ev.preventDefault();
        const classNames = [...ev.target.classList];
        if (classNames.includes('el-tabs__item')) {
          const path = ev.target.getAttribute('aria-controls').replace(/^pane-/, '');
          // if (this.activeKey !== path) {
          //   return this.closeContextMenu();
          // }
          this.position.x = ev.clientX || ev.pageX;
          this.position.y = ev.clientY || ev.pageY;
          this.showContextMenu(path);
        }
      });
    },
    bindDocumentEvent() {
      this.clickEvent = addEventListener(document, 'click', this.closeContextMenu);
    },
    deepMapRoutes(arr, mark) {
      let res = null;
      for (let i = 0; i < arr.length; i++) {
        if (Array.isArray(arr[i].children)) {
          res = this.deepMapRoutes(arr[i].children, mark);
        }
        if (res) {
          return res;
        }
        if (arr[i].path === mark) {
          return arr[i];
        }
      }
      return res;
    },
    createPanelList() {
      return this.pages.map(x => <el-tab-pane key={x.path} name={x.path} label={x.meta.title} closable={!x.meta.affix && !!this.pages.length} />);
    }
  },
  render() {
    const cls = [
      `multi-wrap`,
      {
        [`multi-wrap-sm`]: this.currentSize === 'small',
        [`multi-wrap-lg`]: this.currentSize === 'large'
      }
    ];
    return (
      <div class={cls}>
        <el-tabs ref="multiTab" class="multi-tab" type="card" value={this.activeKey} on-tab-click={this.handleClick} on-tab-remove={this.removeTab}>
          {this.createPanelList()}
        </el-tabs>
        {this.visible && (
          <ul class="contextmenu el-dropdown-menu--small" style={{ left: `${this.position.x + 10}px`, top: `${this.position.y + 2}px` }}>
            <el-dropdown-item nativeOnClick={this.refreshTagHandle}>{this.$t('multiTab.refresh')}</el-dropdown-item>
            <el-dropdown-item nativeOnClick={() => this.closeTagHandle('right')}>{this.$t('multiTab.closeRight')}</el-dropdown-item>
            <el-dropdown-item nativeOnClick={() => this.closeTagHandle('left')}>{this.$t('multiTab.closeLeft')}</el-dropdown-item>
            {this.pages.length > 1 && <el-dropdown-item nativeOnClick={this.closeOtherTagHandle}>{this.$t('multiTab.closeOthers')}</el-dropdown-item>}
          </ul>
        )}
      </div>
    );
  }
};
</script>

<style lang="scss" scoped>
.multi-wrap {
  /deep/ .multi-tab {
    position: relative;
    .el-tabs__header {
      margin: 0;
      border-bottom-color: $borderColor;
      .el-tabs__nav-prev,
      .el-tabs__nav-next {
        display: flex;
        align-items: center;
        height: calc(100% - 1px);
        padding: 0 4px;
        &:hover {
          background-color: $backgroundColorSecondary;
        }
      }
      .el-tabs__nav {
        border-color: $borderColor;
        .el-tabs__item {
          height: 38px;
          line-height: 38px;
          padding: 0 16px;
          font-size: $textSize;
          border-left-color: $borderColor;
          &.is-active {
            font-weight: 700;
          }
          .el-icon-close {
            line-height: 14px;
          }
        }
      }
    }
    .el-tabs__content {
      display: none !important;
    }
  }
  /deep/ .contextmenu {
    list-style: none;
    min-width: 90px;
    position: fixed;
    left: 300px;
    top: 50px;
    background-color: #fff;
    padding: 6px 0;
    border: 1px solid $borderColorSecondary;
    border-radius: $borderRadius;
    box-shadow: $boxShadow;
    z-index: 9999;
  }
  &.multi-wrap-lg {
    /deep/ .multi-tab {
      .el-tabs__item {
        padding: 0 18px !important;
        height: 42px !important;
        line-height: 42px !important;
      }
    }
  }
  &.multi-wrap-sm {
    /deep/ .multi-tab {
      .el-tabs__item {
        padding: 0 14px !important;
        height: 34px !important;
        line-height: 34px !important;
      }
    }
  }
}
</style>
