/*
 * @Author: 焦质晔
 * @Date: 2020-08-21 08:15:29
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-08-21 15:26:08
 */
import axios from '@/api/fetch';
import SERVER from '../server';

// 执行登录
export const doLogin = params => axios.post(`${SERVER.SYS}/sysLogin/user/Login`, params);

// 获取登录页背景图片
export const getBgImage = params => axios.get(`${SERVER.SYS}/sysLogin/user/BgImage`, { params });

// 获取验证码
export const getCheckCode = params => axios.get(`${SERVER.SYS}/sysLogin/user/CheckCode`, { params });

// 获取短信验证码
export const getCaptcha = params => axios.post(`${SERVER.SYS}/sysLogin/user/CheckCode`, params);
