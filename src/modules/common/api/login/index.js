/*
 * @Author: 焦质晔
 * @Date: 2020-08-21 08:15:29
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-09-07 13:14:33
 */
import axios from '@/api/fetch';
import SERVER from '../server';

// 执行登录
export const doLogin = params => axios.post(`${SERVER.SYS}/sysLogin/emp/loginByNameOrPhone`, params);

// 获取图片验证码
export const getCheckCode = params => axios.get(`${SERVER.SYS}/sysLogin/emp/getVerify`, { params });

// 获取短信验证码
export const getCaptcha = params => axios.get(`${SERVER.SYS}/sysLogin/emp/sendMsgCodeForUserPhoneLogin`, { params });

// 获取 APP iPad 下载地址
export const getAppDownload = params => axios.get(`${SERVER.SYS}/app/manager/getAppDownLoadUrl`, { params });

// 获取找回密码的验证码
export const getForgetCode = params => axios.get(`${SERVER.SYS}/sysLogin/emp/getCheckCodePhoneOrEmail`, { params });

// 确认密码找回
export const confirmPwdBack = params => axios.post(`${SERVER.SYS}/sysLogin/emp/checkCodeByPhoneOrEmail`, params);

// 修改密码
export const resetPwd = params => axios.post(`${SERVER.SYS}/sysLogin/emp/forgetPassword`, params);
