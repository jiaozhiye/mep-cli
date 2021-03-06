/*
 * @Author: 焦质晔
 * @Date: 2020-03-30 15:59:26
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-05-19 14:26:07
 */
const noop = () => {};

export default {
  name: 'Expandable',
  props: ['record', 'rowKey'],
  inject: ['$$table'],
  computed: {
    expanded() {
      return this.$$table.rowExpandedKeys.includes(this.rowKey);
    }
  },
  watch: {
    expanded(val) {
      const { onExpand = noop } = this.$$table.expandable || {};
      onExpand(val, this.record);
    }
  },
  methods: {
    clickHandle(ev) {
      ev.stopPropagation();
      const { rowExpandedKeys } = this.$$table;
      // 展开状态 -> 收起
      const result = this.expanded ? rowExpandedKeys.filter(x => x !== this.rowKey) : [...rowExpandedKeys, this.rowKey];
      this.$$table.rowExpandedKeys = result;
    }
  },
  render() {
    const cls = [
      `v-expand--icon`,
      {
        expanded: this.expanded,
        collapsed: !this.expanded
      }
    ];
    return <span class={cls} onClick={this.clickHandle} />;
  }
};
