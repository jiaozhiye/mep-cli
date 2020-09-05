/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-09-05 11:27:54
 **/
import './style/index.scss';
import Qrcode from './qrcode.js';

Qrcode.install = Vue => {
  Vue.component(Qrcode.name, Qrcode);
};

export default Qrcode;
export { Qrcode };
