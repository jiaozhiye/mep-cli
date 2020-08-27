/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-08-21 09:43:40
 **/
import './style/index.scss';
import SlideVerify from './slideVerify.js';

SlideVerify.install = Vue => {
  Vue.component(SlideVerify.name, SlideVerify);
};

export default SlideVerify;
export { SlideVerify };
