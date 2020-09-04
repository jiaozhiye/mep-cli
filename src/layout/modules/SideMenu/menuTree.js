/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-09-01 11:24:44
 */
import variables from '@/assets/css/variables.scss';

export default {
  name: 'MenuTree',
  props: {
    menu: {
      type: Array,
      default: () => []
    },
    collapsed: {
      type: Boolean,
      default: false
    },
    syncActive: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      selectedKey: ''
    };
  },
  computed: {
    variables() {
      return variables;
    }
  },
  watch: {
    $route({ path }) {
      this.selectedKey = path;
    }
  },
  methods: {
    createMenuTree(arr, depth = '') {
      return arr
        .filter(x => !x.hideInMenu)
        .map((item, index) => {
          let { title, icon } = item;
          let key = item.key ?? '';
          // 判断是否为 http 链接
          const httpLink = /^https?:\/\//.test(key);
          const menuItemNode = !httpLink ? (
            <template slot="title">
              {icon && <i class={`iconfont ${icon}`} />}
              <span title={title}>{title}</span>
            </template>
          ) : (
            <a href={key} title={title} target="_blank">
              {icon && <i class={`iconfont ${icon}`} />}
              <span>{item.title}</span>
            </a>
          );
          const uniqueKey = depth + (index + 1);
          if (Array.isArray(item.children)) {
            return (
              <el-submenu key={uniqueKey} index={uniqueKey}>
                {menuItemNode}
                {this.createMenuTree(item.children, `${uniqueKey}-`)}
              </el-submenu>
            );
          }
          return (
            <el-menu-item key={uniqueKey} index={!httpLink ? key : ''}>
              {menuItemNode}
            </el-menu-item>
          );
        });
    }
  },
  created() {
    this.selectedKey = this.$route.path;
  },
  render() {
    const { collapsed, syncActive, selectedKey, variables } = this;
    const wrapProps = {
      props: {
        collapse: collapsed,
        router: true,
        uniqueOpened: true,
        collapseTransition: false,
        backgroundColor: variables.menuBg,
        textColor: variables.menuText,
        activeTextColor: variables.menuActiveText
      },
      style: { borderRight: 'none' }
    };
    if (syncActive) {
      wrapProps.props.defaultActive = selectedKey;
    }
    return (
      <div>
        <el-menu {...wrapProps}>{this.createMenuTree(this.menu)}</el-menu>
      </div>
    );
  }
};
