import { useEffect } from 'react';
import { IKObserverOptions, IObserveChildValue, observerManager } from '@kricsleo/observer';

export * from '@kricsleo/observer';

/**
 * 注册检测容器
 * @param key observer key
 * @param options observer options
 */
export function useObserverRoot(key: string, options?: IKObserverOptions) {
  useEffect(() => {
    observerManager.registerObserver(key, {...options});
    return () => observerManager.deleteObserver(key);
  }, [key, options]);
}

/**
 * 注册被检测元素
 * @param key observer key
 * @param el observer element
 * @param options observer callbacks
 */
export function useObserver(key: string, el: Element, options: IObserveChildValue) {
  useEffect(() => {
    observerManager.observe(key, el, options);
    console.log('useeffect observer', el, options);
    return () => observerManager.unobserve(key, el);
  }, [key, el, options]);
}