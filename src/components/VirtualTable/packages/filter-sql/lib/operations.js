/*
 * @Author: 焦质晔
 * @Date: 2020-07-11 13:39:54
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-10-23 08:43:40
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
      const keyword = new RegExp(escapeKeyword(condition), 'i');
      res = !!(value ?? '').toString().match(keyword);
      break;
    case 'in':
      if (isPrimitive(condition)) {
        condition = [condition];
      }
      if (Array.isArray(condition)) {
        value = Array.isArray(value) ? value : [value];
        res = condition.every(x => value.includes(x));
      } else {
        res = false;
      }
      break;
    case 'nin':
      if (isPrimitive(condition)) {
        condition = [condition];
      }
      if (Array.isArray(condition)) {
        value = Array.isArray(value) ? value : [value];
        res = condition.every(x => value.includes(x)) === false;
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
