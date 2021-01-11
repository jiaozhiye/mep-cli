/*
 * @Author: 焦质晔
 * @Date: 2020-07-11 13:39:54
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-12-17 20:16:13
 */
// 模糊搜索中需要转义的特殊字符
const SPAN_CHAR_REG = /(\^|\.|\[|\$|\(|\)|\||\*|\+|\?|\{|\\)/g;
// 基础数据类型
const PRIMITIVE_VALUES = ['string', 'number', 'boolean', 'symbol'];

const escapeKeyword = keyword => (keyword || '').toString().replace(SPAN_CHAR_REG, '\\$1');
const isPrimitive = value => PRIMITIVE_VALUES.includes(typeof value);
const isDate = value => /^\d{4}-\d{2}-\d{2}(\s\d{2}:\d{2}:\d{2})?$/.test(value);

/**
 * 解析where条件的各种情况
 * @param {Any} value 数据值
 * @param {String} expression 标记符
 * @param {Primitive} condition 条件值
 * @returns {Boolean}
 */
export const matchWhere = (value, expression, condition) => {
  value = isDate(value) ? value.slice(0, 10) : value;
  let res = true;
  switch (expression) {
    case 'like':
      // 把 ^ 还原为 空格
      const keyword = new RegExp(escapeKeyword(condition.replace(/\^/g, ' ')), 'i');
      res = !!(value ?? '').toString().match(keyword);
      break;
    case 'in':
      if (isPrimitive(condition)) {
        condition = [condition];
      }
      if (Array.isArray(condition)) {
        res = Array.isArray(value) ? condition.every(x => value.includes(x)) : condition.includes(value);
      }
      break;
    case 'nin':
      if (isPrimitive(condition)) {
        condition = [condition];
      }
      if (Array.isArray(condition)) {
        res = !(Array.isArray(value) ? condition.some(x => value.includes(x)) : condition.includes(value));
      }
      break;
    case '!=':
    case '<>':
      res = value != condition;
      break;
    case '<':
      res = value < condition;
      break;
    case '<=':
      res = value <= condition;
      break;
    case '>':
      res = value > condition;
      break;
    case '>=':
      res = value >= condition;
      break;
    case '==':
    default:
      res = value == condition;
  }
  return res;
};
