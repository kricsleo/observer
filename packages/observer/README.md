# 元素交叉状态检测

基于"了不起的"[`InterserctionObserver`](https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver)提供了检测子元素与容器之间交叉状态的方法, 没有这个 api 就没有这个库, 考虑到兼容性, 也许你需要先引入该 api 的[`polifill`](https://github.com/w3c/IntersectionObserver/tree/main/polyfill)

仓库中包含`react`和`vue`的演示代码, 你可以在本地启动对应的`demo`查看.

## Usage

### Install

```bash
# for vue:
# npm install @kricsleo/observer-vue

# for react:
# npm install @kricsleo/observer-react

# core
npm install @kricsleo/observer
```

### js

```ts

import { observerManager } from '@kricsleo/observer'

// 注册检测容器
// observerManager.registerObserver(key: string, options?: IKObserverOptions | undefined): KObserver | undefined;
observerManager.registerObserver('key', observerOptions);

// 检测子元素
// observerManager.observe(key: string, el: IObserveElement, value: IObserveChildValue): void;
observerManager.observe('key', el, obserserChildOptions);
```

### React

```ts
import { useObserver, useObserverRoot } from "@kricsleo/observer-react";

// ...
  // 使用 hooks 注册检测容器
  useObserverRoot('key1', rootOptions);
  // 使用 hooks 注册被检测元素
  useObserver('key1', childEl, childOptions);
// ...

```

### Vue

#### Used in Vue.directive

比较方便的一个用法是使用指令的方式来注册检测容器和被检测元素, 当元素满足条件时可以触发对应的回调函数

```ts
// First, import directive for vue.
import { vueObserverDirectives } from '@kricsleo/observer-vue'

// Second, register directive(you can chose your directive name).
Vue.directive('observe', vueObserverDirectives)
```

```html
<!-- simplest usage -->
<section v-observe.key1:root>
  <div v-observe.key1="active"></div>
</section>

<script>
  export {
    methods: {
      active() {
        console.log('actived')
      }
    }
  }
</script>
```

```html
<!-- complex usage -->
<section v-observe.key1:root>
  <section
    v-observe.key1="active1"
    v-observe.key2:root
    v-observe.key3:root="{threshold: 0.8, rootMargin: '10px 10px 10px 10px', root: null, timeout: 1500, useVisibility: true}"
  >
    <div
      v-observe.key1="active2"
      v-observe.key2="active3"
      v-observe.key3="{enter, leave, active: active4}"
    ></div>
  </section>
</section>

<script>
  export {
    methods: {
      active1() {
        console.log('actived1')
      },
      active2() {
        console.log('actived2')
      },
      active3() {
        console.log('actived3')
      },
      active4() {
        console.log('actived4')
      },
      enter() {
        console.log('entered')
      },
      leave() {
        console.log('leaved')
      },
    }
  }
</script>
```

如果有些时候不方便使用指令来注册检测器, 那么完全可以手动在任何地方任何时候注册检测器, 实际上指令只是一个语法糖, 帮助你手动完成注册和移除的工作而已.

```html
<script>
  import { observerManager } from "@kricsleo/observer"
  export {
    mounted() {
      observerManager.registerObserver('key4')
      // Or register with custom options.
      // observerManager.registerObserver('key4', { threshold: 0.8, rootMargin: '10px 10px 10px 10px', root: null, timeout: 1500, useVisibility: true });
    },
    beforeDestroy() {
      // Do't forget to remove it, unless you want to want use it somewhere else.
      observerManager.deleteObserver('key4')
    }
  }
</script>
```

## Api

检测容器
```ts
export interface IKObserverOptions {
  /**
   * 容器元素(同 IntersectionObserver 含义)
   * 当以指令方式注册时默认 root 是 挂载该指令的元素,
   * 当手动注册时默认 root 为 Document
   * @default Document
   */
  root?: Element | Document | null;
  /**
   * 容器元素边界盒的偏移值(同 IntersectionObserver 含义)
   * @default '0px 0px 0px 0px'
   */
  rootMargin?: string;
  /**
   * 进入容器最小面积比
   * @default 0
   */
  threshold?: number;
  /**
   * 是否响应页面可见/隐藏
   * @default false
   */
  useVisibility?: boolean;
  /**
   * 最短激活时间
   * @default 0
   */
  timeout?: number;
}
```

被检测元素
```ts
export interface IObserveCallbackValue {
  key: string;
  observer: KObserver;
  entry: IntersectionObserverEntry;
}

/**
 * 检测回调函数
 * 返回 {false} 则不再进行后续检测
 */
export type IObserveFn = (el: IObserveElement, value: IObserveCallbackValue) => void | false;

/**
 * 被检测元素配置
 * 当只传入一个函数时会作为 active 回调使用
 */
export type IObserveValue = IObserveFn | {
  /**
  * 完成检测回调
  */
  active?: IObserveFn;
  /**
  * 进入检测区域回调
  */
  enter?: IObserveFn;
  /**
  * 退出检测区域回调
  */
  leave?: IObserveFn;
}
```

## How it works?

- 一个元素可以被同时注册为多个检测容器
- 一个元素可以被同时注册为多个被检测元素
- 一个元素可以被同时注册为检测容器和被监测元素
- 检测容器与被检测元素通过注册时指定的相同`key`被自动关联起来

## Detect page visibility?

内置了对页面[`visibilitychange`](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/visibilitychange_event)的监听, 当声明检测容器的时候使用了参数`useVisibility: true`那么该容器会把页面可见性([`visibilityState`](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/visibilityState))加入到检测可见性的逻辑中, 未使用该参数的容器不受影响

在某些运行环境中`visibilitychange`事件或者`visibilityState`值缺失或者不可信, 那么你也可以自定义自己的可见性判断逻辑, 在判定可见的时候调用`observerManager.setVisibility(true)`, 不可见的时候调用`observerManager.setVisibility(false)` 则可以达到同样的效果(实际上内置的`visibilitychange`监听逻辑就是调用`observerManager.setVisibility`这个api来实现的),例如:

```ts
import { observerManager } from "@kricsleo/observer"

onPageShow() {
  observerManager.setVisibility(true);
}

onPageHide() {
  observerManager.setVisibility(false);
}
```

## Use it for what?

例如通过视口交叉检测做代码的懒加载, 图片的懒加载, 或者做元素的进入退出动画, 或者记录元素的曝光状态, 或者更多我没想到的用法:)

## feature

- [x] support for Vue
- [x] support for React
- [x] support for js without any framework
