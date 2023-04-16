import { ObserverManager, observerManager } from './index';
import { Child, ChildBindings, ChildOptions, DirectiveOptions, VueChildOptionsObj,  } from './types';

/** 
 * Register the root observer.
 */
export const observeRoot: DirectiveOptions = {
  bind(el: Child, { arg = '', value = {} as ChildOptions }) {
    observerManager.registerObserver(arg, { root: el, ...value });
  },
  update(el: Child, { arg = '', oldArg = '', value = {} as ChildOptions }) {
    if(arg !== oldArg) {
      observerManager.deleteObserver(oldArg);
      observerManager.registerObserver(arg, { root: el, ...value });
    }
  },
  unbind(el: Child, { arg = '' }) {
    observerManager.deleteObserver(arg);
  }
};

/** 
 * Register child element to be observed
 */
export const observeChild: DirectiveOptions = {
  bind(el: Child, { arg = '', value }: ChildBindings) {
    value && observerManager.observe(arg, el, value);
  },
  update(el: Child, { arg = '', oldArg = '', value, oldValue }: ChildBindings) {
    const observeValue = ObserverManager.parseObserverCallback(value) as VueChildOptionsObj;
    const preObserveValue = ObserverManager.parseObserverCallback(oldValue) as VueChildOptionsObj;
    if(arg !== oldArg || observeValue.key !== preObserveValue.key) {
      observerManager.unobserve(oldArg, el);
      observerManager.observe(arg, el, observeValue);
    }
  },
  unbind(el: Child, { arg = '' }) {
    observerManager.unobserve(arg, el);
  }
};

/** 
 * Generate Vue directive.
 */
export function getObserveDirectiveOptions(rootDirectives: DirectiveOptions, childDirectives: DirectiveOptions) {
  const directiveNames: Array<keyof DirectiveOptions> = ['bind', 'inserted', 'update', 'componentUpdated', 'unbind'];
  return directiveNames.reduce((all, cur) => {
    all[cur] = (...args: any) => {
      const directive = args[1].modifiers.root ? rootDirectives : childDirectives;
      return directive[cur]?.(...args);
    }
    return all;
  }, {} as DirectiveOptions);
}

/** Directive for Vue 2.x */
export const vueObserverDirectives = getObserveDirectiveOptions(observeRoot, observeChild);
