/*
 * @Author: 焦质晔
 * @Date: 2020-03-23 12:51:24
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-12-11 10:17:18
 */
import dayjs from 'dayjs';
import { formatNumber } from '../utils';

const formatMixin = {
  methods: {
    dateFormat(val) {
      const res = val ? dayjs(val).format('YYYY-MM-DD') : '';
      return !res.startsWith('1900-01-01') ? res : '';
    },
    datetimeFormat(val) {
      const res = val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '';
      return !res.startsWith('1900-01-01') ? res : '';
    },
    dateShortTimeFormat(val) {
      const res = val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '';
      return !res.startsWith('1900-01-01') ? res : '';
    },
    financeFormat(val) {
      return formatNumber(val);
    },
    [`secret-nameFormat`](val) {
      return val.replace(/^([\u4e00-\u9fa5]{1}).+$/, '$1**');
    },
    [`secret-phoneFormat`](val) {
      return val.replace(/^(\d{3}).+(\d{4})$/, '$1****$2');
    },
    [`secret-IDnumber`](val) {
      return val.replace(/^(\d{3}).+(\w{4})$/, '$1***********$2');
    }
  }
};

export default formatMixin;
