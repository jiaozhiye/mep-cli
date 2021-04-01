/*
 * @Author: 焦质晔
 * @Date: 2020-05-23 10:58:27
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-03-31 16:56:17
 */
/**
 * @description 判断浏览器是否 IE11
 * @param
 * @returns {boolean}
 */
export const isIE = () => {
  return !!window.ActiveXObject || 'ActiveXObject' in window;
};

/**
 * @description 判断对象属性是否为自身属性
 * @param {object} 目标对象
 * @param {string} 属性名
 * @returns {boolean}
 */
export const hasOwn = (obj, key) => {
  return Object.prototype.hasOwnProperty.call(obj, key);
};

/**
 * @description 延迟方法，异步函数
 * @param {number} delay 延迟的时间，单位 毫秒
 * @returns
 */
export const sleep = async delay => {
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * @description 捕获基于 Promise 操作的异常
 * @param {func} asyncFn 异步函数
 * @param {any} params 函数的参数
 * @returns {array} 错误前置
 */
export const errorCapture = async (asyncFn, ...params) => {
  try {
    const res = await asyncFn(...params);
    return [null, res];
  } catch (e) {
    return [e, null];
  }
};

/**
 * @description 函数防抖
 * @param {func} fn 目标函数
 * @param {number} delay 延迟的时间，单位 毫秒
 * @returns
 */
export const debounce = (fn, delay) => {
  return function(...args) {
    fn.timer && clearTimeout(fn.timer);
    fn.timer = setTimeout(() => fn.apply(this, args), delay);
  };
};

/**
 * @description 函数截流
 * @param {func} fn 目标函数
 * @param {number} delay 延迟的时间，单位 毫秒
 * @returns
 */
export const throttle = (fn, delay) => {
  return function(...args) {
    let nowTime = +new Date();
    if (!fn.lastTime || nowTime - fn.lastTime > delay) {
      fn.apply(this, args);
      fn.lastTime = nowTime;
    }
  };
};

/**
 * @description 获取浏览器窗口尺寸
 * @returns 包含 width / height 属性的对象
 */
export const getWindowSize = () => {
  return {
    width: window.innerWidth || document.body.clientWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.body.clientHeight || document.documentElement.clientHeight
  };
};

/**
 * @description js 事件绑定
 * @param {HTMLNode} el 目标节点
 * @param {string} evType 事件类型
 * @param {func} handler 事件处理函数
 * @returns
 */
export const on = (el, evType, handler) => {
  if (el && evType && handler) {
    document.addEventListener ? el.addEventListener(evType, handler, false) : el.attachEvent('on' + evType, handler);
  }
};

/**
 * @description js 事件解绑
 * @param {HTMLNode} el 目标节点
 * @param {string} evType 事件类型
 * @param {func} handler 事件处理函数
 * @returns
 */
export const off = (el, evType, handler) => {
  if (el && evType) {
    document.removeEventListener ? el.removeEventListener(evType, handler, false) : el.detachEvent('on' + evType, handler);
  }
};

/**
 * @description 获取满足条件的祖先元素
 * @param {HTMLNode} el 参考节点
 * @param {string} parElCls 目标节点 classname
 * @returns 满足条件的祖先元素
 */
export const getParentNode = (el, parElCls) => {
  let node = el;
  while (node) {
    if (node.classList?.contains(parElCls)) {
      return node;
    }
    node = node.parentNode;
  }
  return null;
};

/**
 * @description 文件下载
 * @param {Blob} blob 对象
 * @param {string} fileName 文件名
 * @returns
 */
export const download = (blob, fileName) => {
  // ie10+
  if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, decodeURI(fileName));
  } else {
    const downloadUrl = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = downloadUrl;
    a.download = decodeURI(fileName);
    a.click();
    a = null;
  }
};
