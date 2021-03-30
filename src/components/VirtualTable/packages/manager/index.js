/*
 * @Author: 焦质晔
 * @Date: 2021-03-30 07:59:34
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-03-30 11:29:40
 */
let instances = [];

const TableManager = {
  getFocusInstance: function() {
    return instances[0] ?? null;
  },
  getInstance: function(id) {
    return instances.find(x => x.id === id) ?? null;
  },
  focus: function(id) {
    const target = this.getInstance(id);
    if (!target || instances.findIndex(x => x === target) === 0) return;
    this.deregister(id);
    instances = [target, ...instances];
  },
  register: function(id, instance) {
    if (id && instance) {
      if (this.getInstance(id) !== null) {
        this.deregister(id);
      }
      instances = [{ id, vm: instance }, ...instances];
    }
  },
  deregister: function(id) {
    if (id) {
      instances = instances.filter(x => x.id !== id);
    }
  }
};

export default TableManager;
