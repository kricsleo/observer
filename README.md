# HTMLElement Observer

An Easy and lightweight(1.7kb after GZipped) lib to use [`InterserctionObserver`](https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver). It's easy to be used in lazy-load for images(or bundles .etc), entering or exiting animations, exposure of statistical, .etc.

## Feature

- Full TS support
- Pure without any dependency
- Lightweight, 1.7kb after GZipped
- Support vanilla JS, React, Vue2

## Usage

### Install

```bash
# for Vue:
# npm install @kricsleo/observer-vue

# for React:
# npm install @kricsleo/observer-react

# core, for vanilla JS
npm install @kricsleo/observer
```

It's based on [`InterserctionObserver`](https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver). If you need to support browsers without it, you shall import the [`polyfill`](https://github.com/w3c/IntersectionObserver/tree/main/polyfill) first.

### Example

Nearly no limit prevents you from using multiple observers.

- A single element can **be** registered as multiple observers(roots).
- A single element can be observered by multiple observers.
- A single element can be registered as observer and be observered by other observer at the same time.
- Observer and be observered are connected by the 'key' you registered.


#### JS

```ts
import { observerManager } from '@kricsleo/observer'

// register an observer with an unified key
// or with custom options
// observerManager.registerObserver(key: string, options?: IKObserverOptions | undefined): KObserver | undefined;
observerManager.registerObserver('key', observerOptions);

// observe element with the registered observer
// observerManager.observe(key: string, el: IObserveElement, value: IObserveChildValue): void;
observerManager.observe('key', el, obserserChildOptions);
```

#### React

```ts
import { useObserver, useObserverRoot } from "@kricsleo/observer-react";

// register an observer with an unified key by using hooks
useObserverRoot('key1', rootOptions);

// observe element with the registered observer by using hooks
useObserver('key1', childEl, childOptions);
```

#### Vue2

##### Use it by Vue.directive

A shortcut is provided to use with `Vue.directive`.

```vue
<template>
   <section v-observe:key1.root>
     <div v-observe:key1="active"></div>
   </section>
</template>

<script>
  // import directive for vue.
  import { vueObserverDirectives } from '@kricsleo/observer-vue'

  // register directive(name it whatever you like).
  Vue.directive('observe', vueObserverDirectives)
  export {
    methods: {
      active() {
        console.log('actived')
      }
    }
  }
</script>
```
Or a more complex usage.

```vue
<template>
   <section v-observe:key1.root>
     <section
       v-observe:key1="active1"
       v-observe:key2.root
       v-observe:key3.root="{threshold: 0.8, rootMargin: '10px 10px 10px 10px', root: null, timeout: 1500, useVisibility: true}"
     >
       <div
         v-observe:key1="active2"
         v-observe:key2="active3"
         v-observe:key3="{enter, leave, active: active4}"
       ></div>
     </section>
   </section>
</template>

<script>
   // import directive for vue.
   import { vueObserverDirectives } from '@kricsleo/observer-vue'

   // register directive(name it whatever you like).
   Vue.directive('observe', vueObserverDirectives)

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

`vueObserverDirectives` is just the sugar for `observerManager` which helps you to register observer and remove it at the right time. If you need to do it yourself somehow, you can easily create a new one.

```vue
<script>
  import { observerManager } from "@kricsleo/observer"
  export {
    mounted() {
      observerManager.registerObserver('key4')
      // or register with custom options.
      // observerManager.registerObserver('key4', { threshold: 0.8, rootMargin: '10px 10px 10px 10px', root: null, timeout: 1500, useVisibility: true });
    },
    beforeDestroy() {
      // Do't forget to remove it, unless you want to want use it somewhere else.
      observerManager.deleteObserver('key4')
    }
  }
</script>
```

## API

```ts
/**
 * Options for registering observer.
 */
export interface IKObserverOptions {
  /**
   * Same with IntersectionObserver root.
   * When used with Vue.directive, the default is the Element that mounts the directive
   *
   * @default Document
   */
  root?: Element | Document | null;
  /**
   * Same with IntersectionObserver rootMargin.
   *
   * @default '0px 0px 0px 0px'
   */
  rootMargin?: string;
  /**
   * Same with IntersectionObserver threshold.
   *
   * @default 0
   */
  threshold?: number;
  /**
   * If reponse to page visibility-change(By listening to 'visibilitychange').
   *
   * @default false
   */
  useVisibility?: boolean;
  /**
   * Minimal exposure time, then 'active' will be triggerred.
   *
   * @default 0
   */
  timeout?: number;
}
```

```ts
/**
 * Callback when observed(active | enter | leave).
 * Return `false` means no longer observe it.
 */
export type IObserveFn = (el: IObserveElement, value: IObserveCallbackValue) => void | false;

/**
 * Options for been observed.
 * When a single funciton is received, it's equal to 'active' callback.
 */
export type IObserveValue = IObserveFn | {
  /**
  * Callback for active, meet the 'timeout' time.
  */
  active?: IObserveFn;
  /**
  * Callback for entering 'root' view.
  */
  enter?: IObserveFn;
  /**
  * Callback for leaving 'root' view.
  */
  leave?: IObserveFn;
}

/**
 * Callback value.
 */
export interface IObserveCallbackValue {
  key: string;
  observer: KObserver;
  entry: IntersectionObserverEntry;
}
```

## Detect page visibility?

Support for [`visibilitychange`](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/visibilitychange_event) is built-in. When `useVisibility: true` is passed in, the observer will take page visibility into account. Other observers without this config are not influenced.

In some weird environments which `visibilitychange` is missing or not reliable, you can DIY your visibility detect logic. Call `observerManager.setVisibility(true)` when you think the page is visible, and call `observerManager.setVisibility(false)` when not. That's how the built-in `visibilitychange` logic works.

```ts
import { observerManager } from "@kricsleo/observer"

// for example
onPageShow() {
  observerManager.setVisibility(true);
}

onPageHide() {
  observerManager.setVisibility(false);
}
```
