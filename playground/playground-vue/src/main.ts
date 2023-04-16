import Vue from 'vue'
import App from './App.vue'
import * as d from '@kricsleo/observer-vue'
// import { vueObserverDirectives } from "@kricsleo/observer-vue";

console.log('d', d)

import './assets/main.css'

// Vue.directive('observe', vueObserverDirectives);
new Vue({
  render: (h) => h(App)
}).$mount('#app')
