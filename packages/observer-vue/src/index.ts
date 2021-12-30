import { DirectiveOptions } from 'vue';
import { DirectiveBinding } from 'vue/types/options';
import { IObserveElement, IKObserverOptions, observerManager, IObserveChildValue, getObserveValue } from '@kricsleo/observer';

export * from '@kricsleo/observer';

export interface IObserveChildBinding extends DirectiveBinding {
  value?: IObserveChildValue;
  oldValue?: IObserveChildValue;
}

/** 注册检测容器 */
export const observeRoot: DirectiveOptions = {
  bind(el: IObserveElement, { arg = '', value = {} as IKObserverOptions }) {
    observerManager.registerObserver(arg, { root: el, ...value });
  },
  update(el: IObserveElement, { arg = '', oldArg = '', value = {} as IKObserverOptions }) {
    if(arg !== oldArg) {
      observerManager.deleteObserver(oldArg);
      observerManager.registerObserver(arg, { root: el, ...value });
    }
  },
  unbind(el, { arg = '' }) {
    observerManager.deleteObserver(arg);
  }
};

/** 注册检测子元素 */
export const observeChild: DirectiveOptions = {
  bind(el: IObserveElement, { arg = '', value }: IObserveChildBinding) {
    value && observerManager.observe(arg, el, value);
  },
  update(el: IObserveElement, { arg = '', oldArg = '', value, oldValue }: IObserveChildBinding) {
    const observeValue = getObserveValue(value);
    const preObserveValue = getObserveValue(oldValue);
    if(arg !== oldArg || observeValue.key !== preObserveValue.key) {
      observerManager.unobserve(oldArg, el);
      observerManager.observe(arg, el, observeValue);
    }
  },
  unbind(el: IObserveElement, { arg = '' }) {
    observerManager.unobserve(arg, el);
  }
};

/** 获取 vue 挂载指令 */
export function getObserveDirectiveOptions(rootDirectives: DirectiveOptions, childDirectives: DirectiveOptions) {
  const directiveNames: Array<keyof DirectiveOptions> = ['bind', 'inserted', 'update', 'componentUpdated', 'unbind'];
  return directiveNames.reduce((all, cur) => {
    all[cur] = (...args) => {
      const directive = args[1].modifiers.root ? rootDirectives : childDirectives;
      return directive[cur]?.(...args);
    }
    return all;
  }, {} as DirectiveOptions);
}

/** vue 指令 */
export const vueObserverDirectives = getObserveDirectiveOptions(observeRoot, observeChild);