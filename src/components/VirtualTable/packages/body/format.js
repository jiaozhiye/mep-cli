/*
 * @Author: 焦质晔
 * @Date: 2020-03-23 12:51:24
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-06-16 11:26:38
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
    percentFormat(val) {
      return Number(val * 100).toFixed(2) + '%';
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
