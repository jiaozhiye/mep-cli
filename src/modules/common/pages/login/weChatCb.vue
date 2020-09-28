<template>
  <div></div>
</template>

<script>
// https://tst-audiep.faw-vw.com/getAccessToken?code=031tj4Ga1399Iz00cZFa1LZJLN2tj4Gz&state=84281EA7EF300BA3EB9650E8689A539E77E22D1E443CAE594C21C49B26FC5F7C
import { setWechatAvatar } from '@/utils/cookies';
import { getWechatOpenId } from '@common/api/login';

export default {
  async created() {
    console.log(window);
    const { code, state } = this.$route.query;
    const res = await getWechatOpenId({ code, state });
    if (res.code === 200) {
      // res.data.wechatInfo -> openid , nickname , headimgurl
      setWechatAvatar(res.data.wechatInfo.headimgurl);
      window.opener.$$setOpenId(res.data.wechatInfo.openid);
      window.close();
    }
  }
};
</script>
