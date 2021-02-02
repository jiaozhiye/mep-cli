/*
 * @Author: 焦质晔
 * @Date: 2020-03-08 17:57:20
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-02-01 14:31:33
 */
import PropTypes from '../_utils/vue-types';
import { toBoolean } from './libs/util.js';
import AwesomeQRCode from './libs/awesome-qr';
import imgLoaded from './libs/imgLoaded';
import readAsArrayBuffer from './libs/readAsArrayBuffer';

export default {
  name: 'Qrcode',
  props: {
    text: {
      type: String,
      required: true
    },
    qid: {
      type: String
    },
    correctLevel: {
      type: Number,
      default: 1
    },
    size: {
      type: Number,
      default: 200
    },
    margin: {
      type: Number,
      default: 20
    },
    colorDark: {
      type: String,
      default: '#000000'
    },
    colorLight: {
      type: String,
      default: '#FFFFFF'
    },
    bgSrc: {
      type: String,
      default: undefined
    },
    background: {
      type: String,
      default: 'rgba(0,0,0,0)'
    },
    backgroundDimming: {
      type: String,
      default: 'rgba(0,0,0,0)'
    },
    logoSrc: {
      type: String,
      default: undefined
    },
    logoBackgroundColor: {
      type: String,
      default: 'rgba(255,255,255,1)'
    },
    gifBgSrc: {
      type: String,
      default: undefined
    },
    logoScale: {
      type: Number,
      default: 0.2
    },
    logoMargin: {
      type: Number,
      default: 0
    },
    logoCornerRadius: {
      type: Number,
      default: 8
    },
    whiteMargin: {
      type: [Boolean, String],
      default: true
    },
    dotScale: {
      type: Number,
      default: 1
    },
    autoColor: {
      type: [Boolean, String],
      default: true
    },
    binarize: {
      type: [Boolean, String],
      default: false
    },
    binarizeThreshold: {
      type: Number,
      default: 128
    },
    callback: {
      type: Function,
      default: function() {
        return undefined;
      }
    },
    bindElement: {
      type: Boolean,
      default: true
    },
    backgroundColor: {
      type: String,
      default: '#FFFFFF'
    }
  },
  data() {
    return {
      uuid: ''
    };
  },
  watch: {
    $props: {
      deep: true,
      handler() {
        this.main();
      }
    }
  },
  mounted() {
    this.uuid = this.createUidKey();
    this.main();
  },
  methods: {
    createUidKey(key = '') {
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        let r = (Math.random() * 16) | 0;
        let v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      return key + uuid;
    },
    async main() {
      const that = this;
      if (this.gifBgSrc) {
        const gifImg = await readAsArrayBuffer(this.gifBgSrc);
        const logoImg = await imgLoaded(this.logoSrc);

        this.render(undefined, logoImg, gifImg);
        return;
      }
      const bgImg = await imgLoaded(this.bgSrc);
      const logoImg = await imgLoaded(this.logoSrc);
      this.render(bgImg, logoImg);
    },
    render(img, logoImg, gifBgSrc) {
      const that = this;
      new AwesomeQRCode().create({
        gifBackground: gifBgSrc,
        text: that.text,
        size: that.size,
        margin: that.margin,
        colorDark: that.colorDark,
        colorLight: that.colorLight,
        backgroundColor: that.backgroundColor,
        backgroundImage: img,
        backgroundDimming: that.backgroundDimming,
        logoImage: logoImg,
        logoScale: that.logoScale,
        logoBackgroundColor: that.logoBackgroundColor,
        correctLevel: that.correctLevel,
        logoMargin: that.logoMargin,
        logoCornerRadius: that.logoCornerRadius,
        whiteMargin: toBoolean(that.whiteMargin),
        dotScale: that.dotScale,
        autoColor: toBoolean(that.autoColor),
        binarize: toBoolean(that.binarize),
        binarizeThreshold: that.binarizeThreshold,
        callback: function(dataURI) {
          that.callback && that.callback(dataURI, that.qid);
        },
        bindElement: that.bindElement ? that.uuid : undefined
      });
    }
  },
  render() {
    return this.bindElement ? <img id={this.uuid} width={this.size} /> : null;
  }
};
