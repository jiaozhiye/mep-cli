/*
 * @Author: 焦质晔
 * @Date: 2020-08-21 09:47:10
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-08-21 15:18:26
 */
const PI = Math.PI;

const sum = (x, y) => {
  return x + y;
};

const square = x => {
  return x * x;
};

export default {
  name: 'SlideVerify',
  props: {
    // block length
    l: {
      type: Number,
      default: 42
    },
    // block radius
    r: {
      type: Number,
      default: 10
    },
    // canvas width
    w: {
      type: Number,
      default: 400
    },
    // canvas height
    h: {
      type: Number,
      default: 200
    },
    sliderText: {
      type: String,
      default: 'Slide filled right'
    },
    accuracy: {
      type: Number,
      default: 5 // 精确度小，可允许的误差范围小；为1时，则表示滑块要与凹槽完全重叠，才能验证成功。默认值为5
    },
    show: {
      type: Boolean,
      default: true
    },
    imgs: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      containerActive: false, // container active class
      containerSuccess: false, // container success class
      containerFail: false, // container fail class
      canvasCtx: null,
      blockCtx: null,
      block: null,
      block_x: undefined, // container random position
      block_y: undefined,
      L: this.l + this.r * 2 + 3, // block real lenght
      img: undefined,
      originX: undefined,
      originY: undefined,
      isMouseDown: false,
      trail: [],
      sliderLeft: 0, // block right offset
      sliderMaskWidth: 0, // mask width,
      success: false, // Bug Fixes 修复了验证成功后还能滑动
      loadBlock: true, // Features 图片加载提示，防止图片没加载完就开始验证
      timestamp: null
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      this.initDom();
      this.initImg();
      this.bindEvents();
    },
    initDom() {
      this.block = this.$refs.block;
      this.canvasCtx = this.$refs.canvas.getContext('2d');
      this.blockCtx = this.block.getContext('2d');
    },
    initImg() {
      const img = this.createImg(() => {
        // 图片加载完关闭遮蔽罩
        this.loadBlock = false;
        this.drawBlock();
        this.canvasCtx.drawImage(img, 0, 0, this.w, this.h);
        this.blockCtx.drawImage(img, 0, 0, this.w, this.h);
        let { block_x: x, block_y: y, r, L } = this;
        let _y = y - r * 2 - 1;
        let ImageData = this.blockCtx.getImageData(x, _y, L, L);
        this.block.width = L;
        this.blockCtx.putImageData(ImageData, 0, _y);
      });
      this.img = img;
    },
    drawBlock() {
      this.block_x = this.getRandomNumberByRange(this.L + 10, this.w - (this.L + 10));
      this.block_y = this.getRandomNumberByRange(10 + this.r * 2, this.h - (this.L + 10));
      this.draw(this.canvasCtx, this.block_x, this.block_y, 'fill');
      this.draw(this.blockCtx, this.block_x, this.block_y, 'clip');
    },
    draw(ctx, x, y, operation) {
      let { l, r } = this;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x + l / 2, y - r + 2, r, 0.72 * PI, 2.26 * PI);
      ctx.lineTo(x + l, y);
      ctx.arc(x + l + r - 2, y + l / 2, r, 1.21 * PI, 2.78 * PI);
      ctx.lineTo(x + l, y + l);
      ctx.lineTo(x, y + l);
      ctx.arc(x + r - 2, y + l / 2, r + 0.4, 2.76 * PI, 1.24 * PI, true);
      ctx.lineTo(x, y);
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.stroke();
      ctx[operation]();
      // Bug Fixes 修复了火狐和ie显示问题
      ctx.globalCompositeOperation = 'destination-over';
    },
    createImg(onload) {
      const img = document.createElement('img');
      img.crossOrigin = 'Anonymous';
      img.onload = onload;
      img.onerror = () => {
        img.src = this.getRandomImg();
      };
      img.src = this.getRandomImg();
      return img;
    },
    // 随机生成img src
    getRandomImg() {
      const len = this.imgs.length;
      return len > 0 ? this.imgs[this.getRandomNumberByRange(0, len)] : 'https://picsum.photos/400/150/?image=' + this.getRandomNumberByRange(0, 1084);
    },
    getRandomNumberByRange(start, end) {
      return Math.round(Math.random() * (end - start) + start);
    },
    refresh() {
      this.reset();
      this.$emit('refresh');
    },
    sliderDown(event) {
      if (this.success) return;
      this.originX = event.clientX;
      this.originY = event.clientY;
      this.isMouseDown = true;
      this.timestamp = +new Date();
    },
    touchStartEvent(e) {
      if (this.success) return;
      this.originX = e.changedTouches[0].pageX;
      this.originY = e.changedTouches[0].pageY;
      this.isMouseDown = true;
      this.timestamp = +new Date();
    },
    bindEvents() {
      document.addEventListener('mousemove', e => {
        if (!this.isMouseDown) return false;
        const moveX = e.clientX - this.originX;
        const moveY = e.clientY - this.originY;
        if (moveX < 0 || moveX + 38 >= this.w) return false;
        this.sliderLeft = moveX + 'px';
        let blockLeft = ((this.w - 40 - 20) / (this.w - 40)) * moveX;
        this.block.style.left = blockLeft + 'px';

        this.containerActive = true; // add active
        this.sliderMaskWidth = moveX + 'px';
        this.trail.push(moveY);
      });
      document.addEventListener('mouseup', e => {
        if (!this.isMouseDown) return false;
        this.isMouseDown = false;
        if (e.clientX === this.originX) return false;
        this.containerActive = false; // remove active
        this.timestamp = +new Date() - this.timestamp;

        const { spliced, TuringTest } = this.verify();
        if (spliced) {
          if (this.accuracy === -1) {
            this.containerSuccess = true;
            this.success = true;
            this.$emit('success', this.timestamp);
            return;
          }
          if (TuringTest) {
            // succ
            this.containerSuccess = true;
            this.success = true;
            this.$emit('success', this.timestamp);
          } else {
            this.containerFail = true;
            this.$emit('again');
          }
        } else {
          this.containerFail = true;
          this.$emit('fail');
          setTimeout(() => {
            this.reset();
          }, 1000);
        }
      });
    },
    touchMoveEvent(e) {
      if (!this.isMouseDown) return false;
      const moveX = e.changedTouches[0].pageX - this.originX;
      const moveY = e.changedTouches[0].pageY - this.originY;
      if (moveX < 0 || moveX + 38 >= this.w) return false;
      this.sliderLeft = moveX + 'px';
      let blockLeft = ((this.w - 40 - 20) / (this.w - 40)) * moveX;
      this.block.style.left = blockLeft + 'px';

      this.containerActive = true;
      this.sliderMaskWidth = moveX + 'px';
      this.trail.push(moveY);
    },
    touchEndEvent(e) {
      if (!this.isMouseDown) return false;
      this.isMouseDown = false;
      if (e.changedTouches[0].pageX === this.originX) return false;
      this.containerActive = false;
      this.timestamp = +new Date() - this.timestamp;

      const { spliced, TuringTest } = this.verify();
      if (spliced) {
        if (this.accuracy === -1) {
          this.containerSuccess = true;
          this.success = true;
          this.$emit('success', this.timestamp);
          return;
        }
        if (TuringTest) {
          // succ
          this.containerSuccess = true;
          this.success = true;
          this.$emit('success', this.timestamp);
        } else {
          this.containerFail = true;
          this.$emit('again');
        }
      } else {
        this.containerFail = true;
        this.$emit('fail');
        setTimeout(() => {
          this.reset();
        }, 1000);
      }
    },
    verify() {
      const arr = this.trail; // drag y move distance
      const average = arr.reduce(sum) / arr.length; // average
      const deviations = arr.map(x => x - average); // deviation array
      const stddev = Math.sqrt(deviations.map(square).reduce(sum) / arr.length); // standard deviation
      const left = parseInt(this.block.style.left);
      const accuracy = this.accuracy <= 1 ? 1 : this.accuracy > 10 ? 10 : this.accuracy;
      return {
        spliced: Math.abs(left - this.block_x) <= accuracy,
        TuringTest: average !== stddev // equal => not person operate
      };
    },
    reset() {
      this.success = false;
      this.containerActive = false;
      this.containerSuccess = false;
      this.containerFail = false;
      this.sliderLeft = 0;
      this.block.style.left = 0;
      this.sliderMaskWidth = 0;
      // canvas
      let { w, h } = this;
      this.canvasCtx.clearRect(0, 0, w, h);
      this.blockCtx.clearRect(0, 0, w, h);
      this.block.width = w;

      // generate img
      this.img.src = this.getRandomImg();
      this.$emit('fulfilled');
    }
  },
  render() {
    const { w: width, h: height, show, loadBlock, sliderMaskWidth, sliderLeft, containerActive, containerSuccess, containerFail, sliderText } = this;
    const containerCls = [`slide-verify-slider`, { 'container-active': containerActive, 'container-success': containerSuccess, 'container-fail': containerFail }];
    return (
      <div class="slide-verify" style={{ width: `${width}px` }} id="slideVerify">
        <div class={{ 'slider-verify-loading': loadBlock }} />
        <canvas width={width} height={height} ref="canvas" />
        {show && <div onClick={this.refresh} class="slide-verify-refresh-icon" />}
        <canvas width={width} height={height} ref="block" class="slide-verify-block" />
        <div class={containerCls}>
          <div class="slide-verify-slider-mask" style={{ width: sliderMaskWidth }}>
            <div
              onMousedown={this.sliderDown}
              onTouchstart={this.touchStartEvent}
              onTouchmove={this.touchMoveEvent}
              onTouchend={this.touchEndEvent}
              class="slide-verify-slider-mask-item"
              style={{ left: sliderLeft }}
            >
              <div class="slide-verify-slider-mask-item-icon" />
            </div>
          </div>
          <span class="slide-verify-slider-text">{sliderText}</span>
        </div>
      </div>
    );
  }
};
