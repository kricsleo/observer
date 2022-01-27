<template>
  <div class="app">
    <div class="opts">
      <button @click="reload">reload</button>
      <button @click="add">add</button>
      <button @click="recreate">recreate</button>
      <a href="/" target="_blank">new tab</a>
    </div>

    <h3 class="title">单次曝光</h3>
    <section
      class="wrapper"
      v-observe:card1.root
      v-observe:card2.root="{threshold: 0.8, rootMargin: '10px 0px 10px 0px', root: null, timeout: 2000, useVisibility: true}"
    >
      <!-- <div class="holder"></div> -->
      <waterfall-flow class="waterfall">
        <div
          v-for="item in ids"
          :key="item.name"
          :style="{height: `${Math.round(Math.random() * 200) + 50}px`}"
          class="box"
          v-observe:card2="{ leave, enter, active }"
        />
      </waterfall-flow>
      <div class="holder"></div>
    </section>

    <!-- <h3 class="title">重复曝光</h3>
    <section class="wrapper">
      <waterfall-flow class="waterfall">
        <my-comp
          v-for="item in ids"
          :key="item.name"
          :data="item"
        />
      </waterfall-flow>
      <div class="holder"></div>
    </section> -->

  </div>
</template>

<script lang="ts">
import Vue from "vue";
// @ts-ignore
import WaterfallFlow from '@kricsleo/waterfall-flow';
import '@kricsleo/waterfall-flow/dist/WaterfallFlow.css';
import { observerManager, IObserveCallbackValue } from "../../../packages/observer-vue";

function getRandom() {
  return { key:Math.random(), name: Math.random().toFixed(3) };
}

export default Vue.extend({
  name: "app",
  components: { WaterfallFlow },
  data() {
    return {
      ids: [getRandom()]
    }
  },
  methods: {
    reload() {
      this.ids = this.ids.map((t: any) => ({ ...t, key: Math.random()}));
    },
    add() {
      this.ids.push(getRandom());
    },
    recreate() {
      this.ids = [getRandom()];
    },
    leave(el: HTMLElement, observer: IObserveCallbackValue) {
      console.log('leaved');
      el.style.transitionDuration = '';
      el.classList.remove('box--exposuring', 'box--actived');
      // return false;
    },
    enter(el: HTMLElement, observer: IObserveCallbackValue) {
      console.log('entered', Date.now(), observer);
      el.style.transitionDuration = `${observer.observer.options.timeout}ms`;
      el.classList.remove('box--actived');
      el.classList.add('box--exposuring');
    },
    active(el: HTMLElement, observer: IObserveCallbackValue) {
      console.log('actived');
      el.style.transitionDuration = '';
      el.classList.remove('box--exposuring');
      el.classList.add('box--actived');
    }
  },
  beforeMount() {
    observerManager.registerObserver('card', { threshold: 0.5, rootMargin: '30px 10px' });
  },
  beforeDestroy() {
    observerManager.deleteObserver('card');
  }
});
</script>

<style lang="scss" scoped>
.app {
  .opts {
    text-align: center;
    margin: 10px;
  }
  button {
    font-size: 20px;
    margin-right: 10px;
  }
  .wrapper {
    height: 400px;
    border: 1px solid #F64B73;
    padding: 10px;
    overflow: auto;
  }
  .holder {
    height: 450px;
  }
  .holder1 {
    height: 450px;
  }
  .waterfall::v-deep {
    .waterfall-flow__lane + .waterfall-flow__lane {
      margin-left: 10px;
    }
  }
  .box {
    height: 100px;
    font-size: 24px;
    font-weight: bold;
    color: darkslateblue;
    display: flex;
    align-items: center;
    justify-content: center;
    background-image: linear-gradient(to top, #FA92DE 50%, #64FDD8 50%, #64FDD8);
    background-size: 100% 200%;
    transition: background-position linear;
    border-radius: 8px;
    // animation: move 8s linear forwards;
    @keyframes move {
      100% {
        transform: translateY(-400px);
      }
    }
    & + .box {
      margin-top: 10px;
    }
    &--exposuring {
      background-position-y: bottom;
    }
    &--actived {
      background-color: #F64B73;
      background-image: none;
    }
  }
}
</style>
