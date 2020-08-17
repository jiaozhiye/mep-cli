/*
 * @Author: 焦质晔
 * @Date: 2020-05-23 10:58:27
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-08-08 09:44:27
 */
export const getDPI = () => {
  let arrDPI = new Array();
  if (window.screen.deviceXDPI) {
    arrDPI[0] = window.screen.deviceXDPI;
    arrDPI[1] = window.screen.deviceYDPI;
  } else {
    let tmpNode = document.createElement('DIV');
    tmpNode.style.cssText = `width: 1in; height: 1in; position: absolute; left: 0px; top: 0px; z-index: -1; visibility: hidden;`;
    document.body.appendChild(tmpNode);
    arrDPI[0] = parseInt(tmpNode.offsetWidth);
    arrDPI[1] = parseInt(tmpNode.offsetHeight);
    tmpNode.parentNode.removeChild(tmpNode);
    tmpNode = null;
  }
  return arrDPI;
};

export const mmToPx = value => {
  let inch = value / 25.4;
  let c_value = inch * getDPI()[0];
  return Math.ceil(c_value);
};

export const pxToMm = value => {
  let inch = value / getDPI()[0];
  let c_value = inch * 25.4;
  return Math.ceil(c_value);
};

export const insertBefore = (el, parent) => {
  if (parent.children[0]) {
    parent.insertBefore(el, parent.children[0]);
  } else {
    parent.appendChild(el);
  }
};

export const isPageBreak = str => {
  const regeExp = /^<tr[^>]+type="page-break"[^>]+><\/tr>$/;
  return regeExp.test(str);
};
