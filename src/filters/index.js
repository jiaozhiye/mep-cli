/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-12-11 10:18:06
 */
import Vue from 'vue';
import dayjs from 'dayjs';

Vue.filter('NumberFormat', value => {
  if (!value) return '0';
  // 将整数部分逢三一断
  const intPartFormat = value.toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
  return intPartFormat;
});

Vue.filter('DateFormat', (input, pattern = 'YYYY-MM-DD') => {
  return dayjs(input).format(pattern);
});

Vue.filter('DateTimeFormat', (input, pattern = 'YYYY-MM-DD HH:mm:ss') => {
  return dayjs(input).format(pattern);
});
