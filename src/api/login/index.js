/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-09-02 19:30:05
 */
import axios from '@/api/fetch';

// 执行登录
export const doLogin = params => axios.post(`/api/sys/sysLogin/user/Login`, params);

// 获取菜单
export const getNavList = params => axios.post(`/api/sys/sysLogin/user/getUserMenus`, params);

// 获取数据字典
export const getAllDict = params => axios.post(`/api/sys/sysLogin/user/getDictionary`, params);

// 获取收藏导航
export const getStarMenuList = params => axios.get(`/api/sys/sysLogin/user/getfavorite`, { params });

// 设置收藏导航
export const setStarMenuList = params => axios.post(`/api/sys/sysLogin/user/collection`, params);

// 获取常用导航
export const getCommonMenuList = params => axios.get(`/api/sys/sysLogin/user/test`, { params });

// 菜单埋点
export const createMenuPoint = params => axios.post(`/api/sys/sysLogin/user/clickMenu`, params);

// 获取个人信息
export const getUserInfo = params => axios.get(`/api/sys/sysLogin/user/getUserInfo`, { params });
