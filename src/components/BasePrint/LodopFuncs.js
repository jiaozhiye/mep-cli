﻿import { Notification, Message } from 'element-ui';

var CreatedOKLodop7766 = null,
  CLodopIsLocal;

// ====判断是否需要 Web打印服务CLodop:===
// ===(不支持插件的浏览器版本需要用它)===
function needCLodop() {
  try {
    var ua = navigator.userAgent;
    if (ua.match(/Windows\sPhone/i)) return true;
    if (ua.match(/iPhone|iPod|iPad/i)) return true;
    if (ua.match(/Android/i)) return true;
    if (ua.match(/Edge\D?\d+/i)) return true;

    var verTrident = ua.match(/Trident\D?\d+/i);
    var verIE = ua.match(/MSIE\D?\d+/i);
    var verOPR = ua.match(/OPR\D?\d+/i);
    var verFF = ua.match(/Firefox\D?\d+/i);
    var x64 = ua.match(/x64/i);
    if (!verTrident && !verIE && x64) return true;
    else if (verFF) {
      verFF = verFF[0].match(/\d+/);
      if (verFF[0] >= 41 || x64) return true;
    } else if (verOPR) {
      verOPR = verOPR[0].match(/\d+/);
      if (verOPR[0] >= 32) return true;
    } else if (!verTrident && !verIE) {
      var verChrome = ua.match(/Chrome\D?\d+/i);
      if (verChrome) {
        verChrome = verChrome[0].match(/\d+/);
        if (verChrome[0] >= 41) return true;
      }
    }
    return false;
  } catch (err) {
    return true;
  }
}

// ====页面引用CLodop云打印必须的JS文件,用双端口(8000和18000）避免其中某个被占用：====
if (needCLodop()) {
  var src1 = 'http://localhost:8000/CLodopfuncs.js?priority=1';
  var src2 = 'http://localhost:18000/CLodopfuncs.js?priority=0';

  var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
  var oscript = document.createElement('script');
  oscript.src = src1;
  head.insertBefore(oscript, head.firstChild);
  oscript = document.createElement('script');
  oscript.src = src2;
  head.insertBefore(oscript, head.firstChild);
  CLodopIsLocal = !!(src1 + src2).match(/\/\/localho|\/\/127.0.0./i);
}

// ====获取LODOP对象的主过程：====
export function getLodop(oOBJECT, oEMBED) {
  var strHtmInstall = "打印控件未安装!点击这里<a href='/static/cLodop/install_lodop32.exe' target='_self'>执行安装</a>,安装后请刷新页面或重新进入。";
  var strHtmUpdate = "打印控件需要升级!点击这里<a href='/static/cLodop/install_lodop32.exe' target='_self'>执行升级</a>,升级后请重新进入。";
  var strHtm64_Install = "打印控件未安装!点击这里<a href='/static/cLodop/install_lodop64.exe' target='_self'>执行安装</a>,安装后请刷新页面或重新进入。";
  var strHtm64_Update = "打印控件需要升级!点击这里<a href='/static/cLodop/install_lodop64.exe' target='_self'>执行升级</a>,升级后请重新进入。";
  var strHtmFireFox = '（注意：如曾安装过Lodop旧版附件npActiveXPLugin,请在【工具】->【附加组件】->【扩展】中先卸它）';
  var strHtmChrome = '(如果此前正常，仅因浏览器升级或重安装而出问题，需重新执行以上安装）';
  var strCLodopInstall_1 = "Web打印服务CLodop未安装启动，点击这里<a href='/static/cLodop/CLodop_Setup_for_Win32NT.exe' target='_self'>下载执行安装</a>，";
  var strCLodopInstall_2 = "（若此前已安装过，可<a href='CLodop.protocol:setup' target='_self'>点这里直接再次启动</a>），";
  var strCLodopInstall_3 = '成功后请 <a href="javascript:;" onclick="javascript:window.history.go(0)">刷新本页面</a> 。';
  var strCLodopUpdate = "Web打印服务CLodop需升级!点击这里<a href='/static/cLodop/CLodop_Setup_for_Win32NT.exe' target='_self'>执行升级</a>,升级后请刷新页面。";
  var LODOP;
  try {
    var ua = navigator.userAgent;
    var isIE = !!ua.match(/MSIE/i) || !!ua.match(/Trident/i);
    if (needCLodop()) {
      try {
        LODOP = getCLodop();
      } catch (err) {}
      if (!LODOP && document.readyState !== 'complete') {
        Message.warning('打印组件还没有加载完毕，请稍等一下再操作');
        return;
      }
      if (!LODOP) {
        Notification({
          title: 'CLodop 信息',
          dangerouslyUseHTMLString: true,
          duration: 0,
          message: strCLodopInstall_1 + (CLodopIsLocal ? strCLodopInstall_2 : '') + strCLodopInstall_3
        });
        return;
      } else {
        if (CLODOP.CVERSION < '3.0.8.3') {
          Notification({
            title: 'CLodop 信息',
            dangerouslyUseHTMLString: true,
            message: strCLodopUpdate
          });
        }
        if (oEMBED && oEMBED.parentNode) oEMBED.parentNode.removeChild(oEMBED);
        if (oOBJECT && oOBJECT.parentNode) oOBJECT.parentNode.removeChild(oOBJECT);
      }
    } else {
      var is64IE = isIE && !!ua.match(/x64/i);
      // =====如果页面有Lodop就直接使用，没有则新建:==========
      if (oOBJECT || oEMBED) {
        if (isIE) LODOP = oOBJECT;
        else LODOP = oEMBED;
      } else if (!CreatedOKLodop7766) {
        LODOP = document.createElement('object');
        LODOP.setAttribute('width', 0);
        LODOP.setAttribute('height', 0);
        LODOP.setAttribute('style', 'position:absolute;left:0px;top:-100px;width:0px;height:0px;');
        if (isIE) LODOP.setAttribute('classid', 'clsid:2105C259-1E0C-4534-8141-A753534CB4CA');
        else LODOP.setAttribute('type', 'application/x-print-lodop');
        document.documentElement.appendChild(LODOP);
        CreatedOKLodop7766 = LODOP;
      } else LODOP = CreatedOKLodop7766;
      // =====Lodop插件未安装时提示下载地址:==========
      if (!LODOP || !LODOP.VERSION) {
        if (ua.indexOf('Chrome') >= 0) {
          Notification({
            title: 'CLodop 信息',
            dangerouslyUseHTMLString: true,
            duration: 0,
            message: strHtmChrome
          });
        }
        if (ua.indexOf('Firefox') >= 0) {
          Notification({
            title: 'CLodop 信息',
            dangerouslyUseHTMLString: true,
            duration: 0,
            message: strHtmFireFox
          });
        }
        Notification({
          title: 'CLodop 信息',
          dangerouslyUseHTMLString: true,
          duration: 0,
          message: is64IE ? strHtm64_Install : strHtmInstall
        });
        return LODOP;
      }
    }
    if (LODOP.VERSION < '6.2.2.6') {
      if (!needCLodop()) {
        Notification({
          title: 'CLodop 信息',
          dangerouslyUseHTMLString: true,
          message: is64IE ? strHtm64_Update : strHtmUpdate
        });
      }
    }
    // ===如下空白位置适合调用统一功能(如注册语句、语言选择等):==
    // LODOP.SET_LICENSES('用友汽车信息科技（上海）股份有限公司', 'FA9A697F2551BCE81BD852A4EB520525347', '用友汽車信息科技（上海）股份有限公司', 'C66313BD8413BD0174C2CADD29F5380CD92');
    // LODOP.SET_LICENSES('THIRD LICENSE', '', 'Yonyou Auto Information Technology (Shanghai) Co., Ltd.', '941DF3639D9F5679867946141A31424B4E6');

    // =======================================================
    return LODOP;
  } catch (err) {
    Message.error('getLodop 出错:' + err);
  }
}
