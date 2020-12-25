/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-12-25 09:51:25
 **/
import axios from 'axios';
import PropTypes from '../_utils/vue-types';
import Locale from '../_utils/mixins/locale';
import { download } from '../_utils/tool';

export default {
  name: 'DownloadFile',
  mixins: [Locale],
  props: {
    actionUrl: PropTypes.string,
    actionUrlFetch: PropTypes.shape({
      api: PropTypes.func.isRequired, // api 接口
      params: PropTypes.object // 接口参数
    }),
    headers: PropTypes.object.def({}),
    fileName: PropTypes.string.def(''),
    params: PropTypes.object.def({}),
    disabled: PropTypes.bool.def(false)
  },
  data() {
    return {
      loading: false
    };
  },
  methods: {
    async clickHandle() {
      this.loading = true;
      try {
        let actionUrl = this.actionUrl;
        if (this.actionUrlFetch?.api) {
          const res = await this.actionUrlFetch.api(this.actionUrlFetch.params);
          if (res.code === 200) {
            actionUrl = res.data?.url || res.data?.vUrl;
          }
        }
        if (actionUrl) {
          await this.downloadFile(actionUrl, this.params);
          this.$emit('success');
        }
      } catch (err) {
        this.$emit('error', err);
        this.$message.error(this.t('downLoadFile.error'));
      }
      this.loading = false;
    },
    // 获取服务端文件 to blob
    async downLoadByUrl(url, params = {}) {
      return await axios({ url, params, headers: this.headers, responseType: 'blob' });
    },
    // 执行下载动作
    async downloadFile(url, params) {
      const { headers, data: blob } = await this.downLoadByUrl(url, params);
      const contentDisposition = headers['content-disposition'];
      // 获取文件名
      const fileName = this.fileName ? this.fileName : contentDisposition ? contentDisposition.split(';')[1].split('filename=')[1] : url.slice(url.lastIndexOf('/') + 1);
      download(blob, fileName);
    }
  },
  render() {
    const { $attrs, $slots, loading, disabled } = this;
    const wrapProps = {
      props: {
        loading,
        disabled
      },
      attrs: {
        type: 'primary',
        ...$attrs,
        icon: 'el-icon-download'
      },
      on: {
        click: this.clickHandle
      }
    };
    return <el-button {...wrapProps}>{$slots['default']}</el-button>;
  }
};
