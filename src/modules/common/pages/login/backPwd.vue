<template>
  <div class="forget-wrapper">
    <div class="title">
      <h4>找回密码</h4>
      <p>验证码将发送到您注册的手机或邮箱</p>
    </div>
    <div class="scroll">
      <div class="box">
        <el-form ref="form" size="medium" :model="form" :rules="rules">
          <el-form-item prop="phone">
            <el-input v-model="form.phone" placeholder="手机号或邮箱" />
          </el-form-item>
          <el-form-item>
            <el-input v-model="form.captcha" placeholder="验证码" />
            <el-button type="text" style="position: absolute; right: 0; top: 3px;" :disabled="btnState.disabled" @click="clickHandle">{{
              (!btnState.disabled && '获取验证码') || `重新发送 ${btnState.time} s`
            }}</el-button>
          </el-form-item>
        </el-form>
        <el-button type="primary" size="medium" class="next-btn" @click="nextHandle">下一步</el-button>
      </div>
      <div class="box">
        <el-form ref="formRest" size="medium" :model="formRest">
          <el-form-item>
            <el-input v-model="formRest.newPwd" placeholder="新密码" />
          </el-form-item>
          <el-form-item>
            <el-input v-model="formRest.confirmPwd" placeholder="确认密码" />
          </el-form-item>
        </el-form>
        <el-button type="primary">确定</el-button>
        <el-button type="text" class="btn" @click="closeHandle">返回登录</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { isFormEmpty } from '@/utils';
import { getCaptcha } from '@common/api/login';

const phoneOrEmail = (rule, value, callback) => {
  if (rule.required && isFormEmpty(value)) {
    return callback(new Error('手机号或邮箱不能为空'));
  }
  let regExp1 = /^1[2-9]\d{9}$/;
  let regExp2 = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
  if (isFormEmpty(value) || regExp1.test(value) || regExp2.test(value)) {
    return callback();
  }
  callback(new Error('手机号或邮箱格式不正确'));
};

export default {
  data() {
    this.timer = null;
    return {
      form: {
        phone: '',
        captcha: ''
      },
      newPassword: '',
      rules: {
        phone: [{ required: true, validator: phoneOrEmail, trigger: 'blur' }]
      },
      btnState: {
        time: 60,
        disabled: false
      },
      formRest: {
        newPwd: '',
        confirmPwd: ''
      }
    };
  },
  beforeDestroy() {
    clearInterval(this.timer);
  },
  methods: {
    async doValidate() {
      try {
        return await this.$refs.form.validate();
      } catch (err) {
        return err;
      }
      return false;
    },
    async clickHandle() {
      const isPassed = await this.doValidate();
      if (!isPassed) return;
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
      // 判断是手机号还是邮箱
      // this.isPhone(this.form.phone)
      const res = await getCaptcha({ vPhone: this.form.phone });
      if (res.code === 200) {
        // ...
      }
    },
    isPhone(val) {
      let regExp = /^1[2-9]\d{9}$/;
      return regExp.test(val);
    },
    nextHandle() {},
    closeHandle(val) {
      this.$emit('close', val);
    }
  }
};
</script>

<style lang="scss" scoped>
.forget-wrapper {
  overflow: hidden;
  margin: 5px;
  .title {
    margin-bottom: 20px;
    h4 {
      font-size: 18px;
      color: #1a1a1a;
      font-weight: 600;
    }
    p {
      color: $textColorSecondary;
    }
  }
  .scroll {
    width: 200%;
    display: flex;
    transition: transform 0.3s ease;
    .box {
      width: 50%;
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
      .next-btn {
        width: 100%;
        margin-top: 20px;
        font-size: 14px;
      }
    }
  }
}
</style>
