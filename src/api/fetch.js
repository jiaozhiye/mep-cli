/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-05-06 13:06:35
 */
import axios from 'axios';
import qs from 'qs';
import config from '@/config/serverMap';
import store from '@/store';
import { getToken } from '@/utils/cookies';
import { notifyAction } from '@/utils';
import i18n from '@/lang';

// 自定义扩展 header 请求头
const getConfigHeaders = () => {
  return {
    jwt: getToken() || '', // token
    Authorization: getToken() || '', // token
    lang: store.state.app.lang, // 多语言
    userAgent: 'pc' // 设备
  };
};

const pendingRequest = new Map();
const lockingRequest = new Map();

const generateReqKey = config => {
  const { method, url } = config;
  return [method, url].join('&');
};

const addPendingRequest = config => {
  if (!config.cancelable) return;
  const requestKey = generateReqKey(config);
  config.cancelToken = new axios.CancelToken(cancel => {
    if (!pendingRequest.has(requestKey)) {
      pendingRequest.set(requestKey, cancel);
    }
  });
};

const removePendingRequest = config => {
  const requestKey = generateReqKey(config);
  if (pendingRequest.has(requestKey)) {
    const cancelToken = pendingRequest.get(requestKey);
    cancelToken(i18n.t('fetch.cancelText'));
    pendingRequest.delete(requestKey);
  }
};

const addLockingRequest = config => {
  if (!config.lockable) return;
  const requestKey = generateReqKey(config);
  if (!lockingRequest.has(requestKey)) {
    lockingRequest.set(requestKey, true);
  }
};

const removeLockingRequest = config => {
  const requestKey = generateReqKey(config);
  if (lockingRequest.has(requestKey)) {
    lockingRequest.delete(requestKey);
  }
};

// 创建 axios 实例
const instance = axios.create({
  baseURL: config.host,
  timeout: 1000 * 20,
  withCredentials: true, // 跨域请求时是否需要使用凭证
  paramsSerializer: params => {
    // 序列化 GET 请求参数 -> a: [1, 2] => a[0]=1&a[1]=2
    return qs.stringify(params, { arrayFormat: 'indices' });
  }
});

// 异常处理程序
const errorHandler = error => {
  const { isAxiosError, config = {}, response = {} } = error;
  const { status, statusText = '' } = response;
  const errortext = i18n.t('fetch.errorCode')[status] || statusText || i18n.t('fetch.errorText');
  removePendingRequest(config);
  removeLockingRequest(config);
  isAxiosError && notifyAction(errortext, 'error', 10);
  return Promise.reject(error);
};

// 请求拦截
instance.interceptors.request.use(config => {
  // 锁定当次请求
  if (lockingRequest.has(generateReqKey(config))) {
    return Promise.reject({ message: i18n.t('fetch.lockText') });
  }
  // 取消已发请求
  removePendingRequest(config);
  // 请求头信息，token 验证
  config.headers = {
    ...config.headers,
    ...getConfigHeaders()
  };
  // 处理 IE 缓存
  config.params = {
    ...config.params,
    _t: +new Date().getTime()
  };
  addPendingRequest(config);
  addLockingRequest(config);
  return config;
}, errorHandler);

// 响应拦截
instance.interceptors.response.use(response => {
  let { config, headers, data } = response;
  removePendingRequest(config);
  removeLockingRequest(config);
  // 请求异常提示信息
  if (data.code !== 200) {
    // token 过期，需要重新登录
    if (data.code === 40105) {
      store.dispatch('app/createLogout');
    }
    data.msg && notifyAction(data.msg, 'error', 10);
  }
  // 判断是否为导出/下载
  if (config.responseType === 'blob') {
    return { headers, data };
  }
  return data;
}, errorHandler);

export { getConfigHeaders };
export default instance;
