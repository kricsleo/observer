import Vue from "vue";
import App from "./App.vue";
import { vueObserverDirectives } from "../../../packages/observer-vue";

Vue.config.productionTip = false;
Vue.directive('observe', vueObserverDirectives);
new App().$mount("#app");
