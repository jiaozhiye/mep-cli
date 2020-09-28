/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-09-23 15:02:52
 **/
import './style/index.scss';
import ClientPrint from './clientPrint.js';
import ClientPrintGroup from './clientPrintGroup.js';

ClientPrint.install = Vue => {
  Vue.component(ClientPrint.name, ClientPrint);
  Vue.component(ClientPrintGroup.name, ClientPrintGroup);
};

export default ClientPrint;
export { ClientPrint };
