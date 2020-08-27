<template>
  <div>
    <el-form ref="form" size="medium" class="v-form" :model="form" :rules="rules">
      <el-form-item prop="phone">
        <el-input v-model="form.phone" placeholder="手机号" />
      </el-form-item>
      <el-form-item>
        <el-input v-model="form.captcha" placeholder="短信验证码" />
        <el-button type="text" style="position: absolute; right: 0; top: 3px;" :disabled="btnState.disabled" @click="clickHandle">{{
          (!btnState.disabled && '获取验证码') || `重新发送 ${btnState.time} s`
        }}</el-button>
      </el-form-item>
    </el-form>
    <BaseDialog :visible.sync="visible" title="滑动校验" width="420px" :showFullScreen="false" destroy-on-close>
      <Verify @success="successHandle" @fail="failHandle" />
    </BaseDialog>
  </div>
</template>

<script>
import { sleep } from '@/utils';
import { phoneValidate } from '@/utils/validate';
import { getCaptcha } from '@common/api/login';

import Verify from './verify';

export default {
  components: { Verify },
  data() {
    this.timer = null;
    return {
      form: {
        phone: '',
        captcha: ''
      },
      rules: {
        phone: [{ required: true, validator: phoneValidate, trigger: 'blur' }]
      },
      btnState: {
        time: 60,
        disabled: false
      },
      isPassed: false,
      visible: false
    };
  },
  beforeDestroy() {
    clearInterval(this.timer);
  },
  methods: {
    loginHandle() {},
    async doValidate() {
      try {
        return await this.$refs.form.validate();
      } catch (err) {
        return err;
      }
      return false;
    },
    async clickHandle() {
      const res = await this.doValidate();
      if (!res) return;
      this.visible = true;
    },
    async successHandle() {
      await sleep(500);
      this.isPassed = true;
      this.visible = false;
      // 获取短信验证码
      this.btnState.disabled = true;
      this.timer = setInterval(() => {
        if (this.btnState.time-- <= 0) {
          this.btnState.time = 60;
          this.btnState.disabled = false;
          clearInterval(this.timer);
        }
      }, 1000);
      this.$message.warning('验证码发送中..');
      const res = await getCaptcha({ vPhone: this.form.phone });
      if (res.code === 200) {
        // ...
      }
    },
    failHandle() {},
    async GET_VALUE() {
      const bool = await this.doValidate();
      return [!bool, this.form];
    }
  }
};
</script>

<style lang="scss" scoped>
.v-form {
  /deep/ .el-form-item {
    margin-bottom: 20px;
    .el-form-item__content {
      position: relative;
      .el-input__inner {
        height: 42px;
        line-height: 42px;
        font-size: 14px;
        border: 0;
        border-bottom: 1px solid $borderColor !important;
      }
      .el-input__icon {
        font-size: 18px;
      }
    }
  }
}
</style>
