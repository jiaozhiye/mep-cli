/*
 * @Author: 焦质晔
 * @Date: 2020-03-06 12:05:16
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-10-21 08:50:45
 */
import { deepFindRowKey, isArrayContain } from '../utils';
import Radio from '../radio';
import Checkbox from '../checkbox';

const noop = () => {};

export default {
  name: 'Selection',
  props: ['selectionKeys', 'column', 'record', 'rowKey'],
  inject: ['$$table'],
  computed: {
    selectionType() {
      return this.column.type;
    }
  },
  methods: {
    setRowSelection(val) {
      if (this.selectionKeys.includes(val)) return;
      this.$$table.selectionKeys = [val];
    },
    toggleRowSelection(val) {
      this.$$table.selectionKeys = !this.selectionKeys.includes(val) ? [...new Set([...this.selectionKeys, val])] : this.selectionKeys.filter(x => x !== val);
    },
    createIndeterminate(key) {
      const { rowSelection, deriveRowKeys, getAllChildRowKeys, isTreeTable } = this.$$table;
      const { checkStrictly = !0 } = rowSelection;
      if (!(isTreeTable && !checkStrictly)) return;
      // true -> 子节点非全部选中，至少有一个后代节点在 selectionKeys 中
      const target = deepFindRowKey(deriveRowKeys, key);
      const childRowKeys = getAllChildRowKeys(target.children ?? []);
      const isContain = Array.isArray(target.children)
        ? isArrayContain(
            this.selectionKeys,
            target.children.map(x => x.rowKey)
          )
        : !0;
      return !isContain && childRowKeys.some(x => this.selectionKeys.includes(x));
    },
    renderRadio() {
      const { record, rowKey } = this;
      const {
        rowSelection: { disabled = noop }
      } = this.$$table;
      const isDisabled = disabled(record);
      const prevValue = !isDisabled ? this.selectionKeys[0] : null;
      return (
        <Radio
          value={prevValue}
          onInput={val => {
            this.setRowSelection(val);
          }}
          trueValue={rowKey}
          falseValue={null}
          disabled={isDisabled}
          readonly={!0}
        />
      );
    },
    renderCheckbox() {
      const { record, rowKey } = this;
      const {
        rowSelection: { disabled = noop }
      } = this.$$table;
      const isDisabled = disabled(record);
      const prevValue = !isDisabled && this.selectionKeys.includes(rowKey) ? rowKey : null;
      return (
        <Checkbox
          value={prevValue}
          indeterminate={this.createIndeterminate(rowKey)}
          onInput={val => {
            if (val !== null) {
              this.toggleRowSelection(val);
            } else {
              this.toggleRowSelection(prevValue);
            }
          }}
          trueValue={rowKey}
          falseValue={null}
          disabled={isDisabled}
          readonly={!0}
        />
      );
    }
  },
  render() {
    return this.selectionType === 'radio' ? this.renderRadio() : this.renderCheckbox();
  }
};
