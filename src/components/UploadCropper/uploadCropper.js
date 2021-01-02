/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-01-02 08:46:33
 **/
import axios from 'axios';
import PropTypes from '../_utils/vue-types';
import canvasCompress from './compress';
import CropperPanel from './CropperPanel';
import Locale from '../_utils/mixins/locale';
import PrefixCls from '../_utils/mixins/prefix-cls';
import { download } from '../_utils/tool';

export default {
  name: 'UploadCropper',
  components: {
    CropperPanel
  },
  mixins: [Locale, PrefixCls],
  props: {
    actionUrl: PropTypes.string.isRequired,
    headers: PropTypes.object.def({}),
    initialValue: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        url: PropTypes.string
      })
    ).def([]),
    remove: PropTypes.shape({
      api: PropTypes.func.isRequired,
      params: PropTypes.object,
      callback: PropTypes.func
    }),
    isCalcHeight: PropTypes.bool.def(true),
    fixedSize: PropTypes.array.def([1.5, 1]),
    titles: PropTypes.array.def([]),
    limit: PropTypes.number.def(1),
    fileSize: PropTypes.number,
    params: PropTypes.object.def({}),
    fileTypes: PropTypes.array.def(['jpg', 'png', 'bmp']),
    disabled: PropTypes.bool.def(false)
  },
  data() {
    this.uploadWrap = null;
    this.fileData = null; // 文件裁剪之后的 blob
    this.uid = ''; // 文件的 uid
    this.width = 146;
    this.dialogImageUrl = ''; // 预览图片地址
    return {
      file: null, // 当前被选择的图片文件
      fileList: this.initialValue,
      previewVisible: false,
      cropperVisible: false,
      isLoading: false
    };
  },
  computed: {
    calcHeight() {
      return this.isCalcHeight && this.fixedSize.length === 2 ? Number.parseInt((this.width * this.fixedSize[1]) / this.fixedSize[0]) : this.width;
    }
  },
  watch: {
    initialValue(val) {
      this.fileList = val;
    },
    fileList(val) {
      this.$emit('change', val);
      if (val.length === this.limit) {
        this.$parent.clearValidate && this.$parent.clearValidate();
      }
    }
  },
  mounted() {
    this.uploadWrap = this.$refs.upload.$el.querySelector('.el-upload');
    this.setUploadWrapHeight();
  },
  updated() {
    const { uploadCropper } = this.$refs;
    uploadCropper && uploadCropper.Update();
  },
  methods: {
    handlePreview(index) {
      this.dialogImageUrl = this.fileList[index].url;
      this.previewVisible = true;
    },
    async handleRemove(index) {
      if (this.remove?.api) {
        try {
          await this.$confirm(this.t('confirm.message'), this.t('confirm.title'), { type: 'warning' });
          const res = await this.remove.api({ ...this.fileList[index], ...this.remove.params });
          if (res.code === 200) {
            this.fileList.splice(index, 1);
            this.clearFiles();
            this.remove?.callback && this.remove.callback();
            this.$message.success(this.t('confirm.success'));
          }
        } catch (err) {}
      } else {
        this.fileList.splice(index, 1);
        this.clearFiles();
      }
    },
    changeHandler(file, files) {
      if (this.uid === file.uid) return;
      this.uid = file.uid;
      this.file = file;
      if (!this.fileSize) {
        this.cropperVisible = true;
      } else {
        this.doUpload();
      }
    },
    uploadHandler(data) {
      this.fileData = data;
      this.doUpload();
    },
    closeHandler() {
      this.clearFiles();
    },
    clearFiles() {
      this.$refs.upload.clearFiles();
    },
    doUpload() {
      this.$refs.upload.submit();
    },
    beforeUpload(file) {
      if (!this.fileSize) {
        return true;
      }
      const isLt5M = file.size / 1024 / 1024 < this.fileSize;
      if (!isLt5M) {
        this.$message.warning(this.t('uploadFile.sizeLimit', { size: this.fileSize }));
      }
      return isLt5M;
    },
    async upload(options) {
      const { params, headers } = this.$props;
      const formData = new FormData();
      let blob = this.file.raw;
      if (this.fileData) {
        let base64 = await canvasCompress({
          img: this.fileData,
          type: 'jpg',
          fillColor: '#fff',
          width: 1200
        });
        blob = this.dataURItoBlob(base64.img);
      }
      // 有的后台需要传文件名，不然会报错
      formData.append('file', blob, this.file.name);
      // 处理请求的额外参数
      for (let key in params) {
        formData.append(key, params[key]);
      }
      try {
        const { data: res } = await axios.post(this.actionUrl, formData, { headers });
        if (res.code === 200) {
          this.fileList.push({ name: this.file.name, url: res.data || '' });
          this.$emit('success', res.data);
        }
      } catch (err) {
        this.clearFiles();
        this.$emit('error', err);
        this.$message.error(this.t('uploadCropper.uploadError'));
      }
      this.cropperVisible = false;
      this.isLoading = false;
    },
    setUploadWrapHeight() {
      this.uploadWrap.style.height = `${this.calcHeight}px`;
    },
    // base64 转成 bolb 对象
    dataURItoBlob(base64Data) {
      let byteString;
      if (base64Data.split(',')[0].indexOf('base64') >= 0) {
        byteString = atob(base64Data.split(',')[1]);
      } else {
        byteString = unescape(base64Data.split(',')[1]);
      }
      let mimeString = base64Data
        .split(',')[0]
        .split(':')[1]
        .split(';')[0];
      let ia = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      return new Blob([ia], { type: mimeString });
    },
    async downloadHandle(index) {
      try {
        await this.downloadFile(this.fileList[index]);
      } catch (err) {
        this.$message.error(this.t('uploadCropper.downError'));
      }
    },
    // 获取服务端文件 to blob
    async downLoadByUrl(url, params = {}) {
      const { data } = await axios({ url, params, headers: this.headers, responseType: 'blob' });
      return data;
    },
    // 执行下载动作
    async downloadFile({ url, name }, params) {
      const blob = await this.downLoadByUrl(url, params);
      let fileName = url.slice(url.lastIndexOf('/') + 1);
      if (name) {
        let extendName = url.slice(url.lastIndexOf('.') + 1);
        fileName = `${name.slice(0, name.lastIndexOf('.') !== -1 ? name.lastIndexOf('.') : undefined)}.${extendName}`;
      }
      download(blob, fileName);
    },
    renderPictureCard() {
      const { disabled, calcHeight, fileList, titles } = this;
      return (
        <ul class="el-upload-list el-upload-list--picture-card">
          {fileList.map((item, index) => (
            <li key={index} class="el-upload-list__item" style={{ height: `${calcHeight}px` }} onClick={ev => ev.stopPropagation()}>
              <div>
                <img class="el-upload-list__item-thumbnail" src={item.url} alt />
                {titles[index] && <h5 class="el-upload-list__item-title">{titles[index]}</h5>}
                <span class="el-upload-list__item-actions">
                  <span class="el-upload-list__item-dot">
                    <i class="el-icon-zoom-in" onClick={() => this.handlePreview(index)} />
                  </span>
                  {!disabled && (
                    <span class="el-upload-list__item-dot">
                      <i class="el-icon-delete" onClick={() => this.handleRemove(index)} />
                    </span>
                  )}
                  <span class="el-upload-list__item-dot">
                    <i class="el-icon-download" onClick={() => this.downloadHandle(index)} />
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      );
    }
  },
  render() {
    const { limit, disabled, file, fixedSize, fileList, fileTypes, dialogImageUrl } = this;
    const prefixCls = this.getPrefixCls('cropper--wrapper');
    const previewCls = this.getPrefixCls('cropper--preview');
    const cls = {
      [prefixCls]: true
    };
    const uploadProps = {
      props: {
        action: '#',
        listType: 'picture-card',
        accept: 'image/jpg, image/jpeg, image/png, image/bmp',
        limit,
        drag: true,
        multiple: false,
        autoUpload: false,
        showFileList: false,
        disabled,
        httpRequest: this.upload,
        beforeUpload: this.beforeUpload,
        onChange: this.changeHandler
      },
      style: {
        display: fileList.length !== limit ? 'block' : 'none'
      }
    };
    const previewDialogProps = {
      props: {
        visible: this.previewVisible,
        title: this.t('uploadCropper.preview'),
        destroyOnClose: true
      },
      on: {
        'update:visible': val => (this.previewVisible = val)
      }
    };
    const cropperDialogProps = {
      props: {
        visible: this.cropperVisible,
        title: this.t('uploadCropper.cropper'),
        width: '830px',
        destroyOnClose: true
      },
      on: {
        'update:visible': val => (this.cropperVisible = val),
        closed: this.closeHandler
      }
    };
    const cropperProps = {
      props: {
        imgFile: file,
        fixedNumber: fixedSize,
        loading: this.isLoading
      },
      on: {
        'update:loading': val => (this.isLoading = val),
        upload: this.uploadHandler
      }
    };
    return (
      <div class={cls}>
        {this.renderPictureCard()}
        <el-upload ref="upload" class="upload--wrapper" {...uploadProps}>
          <template slot="trigger">
            <i class="el-icon-upload" />
            <div class="el-upload__text">
              {this.t('uploadFile.dragableText')} <em>{this.t('uploadFile.text')}</em>
            </div>
          </template>
          <div slot="tip" class="el-upload__tip">
            {this.t('uploadCropper.tooltip', { type: fileTypes.join(',') })}
          </div>
        </el-upload>
        <BaseDialog {...previewDialogProps}>
          <div class={previewCls}>
            <img src={dialogImageUrl} alt />
          </div>
        </BaseDialog>
        <BaseDialog {...cropperDialogProps}>
          <CropperPanel ref="uploadCropper" {...cropperProps} />
        </BaseDialog>
      </div>
    );
  }
};
