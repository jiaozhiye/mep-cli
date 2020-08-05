<template>
  <div class="v-screen">
    <h2 class="v-screen--toper-title">MEP数据平台智能监控系统</h2>
    <div class="v-screen--wrapper">
      <div class="v-screen--wrapper-left">
        <div class="chart animate__animated delay-200ms animate__fadeInLeft">
          <Container>
            <div slot="title">监控指标</div>
            <div>1</div>
          </Container>
        </div>
        <div class="chart animate__animated delay-400ms animate__fadeInLeft">
          <Container>
            <div slot="title">监控指标</div>
            <div>1</div>
          </Container>
        </div>
        <div class="chart animate__animated delay-600ms animate__fadeInLeft">
          <Container>
            <div slot="title">监控指标</div>
            <div>1</div>
          </Container>
        </div>
      </div>
      <div class="v-screen--wrapper-middle">
        <div class="chart map animate__animated delay-200ms animate__fadeInUp">
          <Container>
            <div slot="title">监控指标</div>
            <div>1</div>
          </Container>
        </div>
        <div class="chart animate__animated delay-400ms animate__fadeInUp">
          <Container>
            <div slot="title">监控指标</div>
            <div>1</div>
          </Container>
        </div>
      </div>
      <div class="v-screen--wrapper-right">
        <div class="chart animate__animated delay-200ms animate__fadeInRight">
          <Container>
            <div slot="title">监控指标</div>
            <div>1</div>
          </Container>
        </div>
        <div class="chart animate__animated delay-400ms animate__fadeInRight">
          <Container>
            <div slot="title">监控指标</div>
            <div>1</div>
          </Container>
        </div>
        <div class="chart animate__animated delay-600ms animate__fadeInRight">
          <Container>
            <div slot="title">监控指标</div>
            <div>1</div>
          </Container>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import './assets/animate.css';
import './assets/index.scss';

import Container from './modules/Container';

export default {
  name: 'BigScreen',
  components: {
    Container
  }
};
</script>
