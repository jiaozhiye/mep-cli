/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-08-01 15:58:24
 **/
import './style/index.scss';
import ClientPrint from './clientPrint.js';

ClientPrint.install = Vue => {
  Vue.component(ClientPrint.name, ClientPrint);
};

export default ClientPrint;
export { ClientPrint };
