import { Observer } from './observer';

/** Observer root config  */
export interface RootOptions extends IntersectionObserverInit {
  /**
   * Mininal intersection ratio(0 <= ratio <= 1).
   * @default 0
   */
  threshold?: number;
  /**
   * If respond to changes in page visibility.
   * @default false
   */
  useVisibility?: boolean;
  /**
   * Mininal time(ms) required to be active.
   * @default 0
   */
  timeout?: number;
}

/**
 * Callback when observed(active | enter | leave).
 * Return `false` means no longer observe it.
 */
export type ChildOptionsFn = (el: Child, value: CallbackValue) => void | false;

/** Options for multiple callback functions. */
export type ChildOptionsObj = {
  /**
  * Triggered when `active`(between `enter` and `leave`).
  */
  active?: ChildOptionsFn;
  /**
  * Triggered when `enter`(threshold has been met).
  */
  enter?: ChildOptionsFn;
  /**
  * Triggered when `leave`(threshold is no longer met).
  */
  leave?: ChildOptionsFn;
}

export type ChildOptions = ChildOptionsFn | ChildOptionsObj

/** Callback value */
export interface CallbackValue {
  key: string;
  observer: Observer;
  entry?: IntersectionObserverEntry;
}

/** Element been observered. */
export interface Child extends Element {
  __observeData?: Record<string, {
    value: ChildOptionsObj;
    timer?: ReturnType<typeof setTimeout> | null;
    entered?: boolean;
  }>;
}


/** ---------------- Start: For Vue ------------- */
/**
 * Refer to https://github.com/vuejs/vue/blob/a9ca2d85193e435e668ba25ace481bfb176b0c6e/types/options.d.ts#L335
 */
export type DirectiveOptions = any

/**
 * Refer to https://github.com/vuejs/vue/blob/a9ca2d85193e435e668ba25ace481bfb176b0c6e/types/options.d.ts#L318
 */
export type DirectiveBinding = any

/**
 * Adding a key allows for re-triggering observation under certain circumstances in Vue.
 */
export interface VueChildOptionsObj extends ChildOptionsObj {
  key?: string;
}

export type VueChildOptions = ChildOptionsObj | ChildOptionsFn

export interface ChildBindings extends DirectiveBinding {
  value?: VueChildOptions;
  oldValue?: VueChildOptions;
}
/** ---------------- End: For Vue ------------- */