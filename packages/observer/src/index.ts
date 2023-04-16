import { Observer } from './observer';
import { ChildOptionsFn, ChildOptions, CallbackValue, ChildOptionsObj, Child, RootOptions } from './types';

export class ObserverManager {
  /** All observers */
  private __observerMap: Record<string, Observer> = {}
  /**
   * Sometimes the child elements are registered before the container. 
   * In this case, a cache queue is needed to store the child elements 
   * that cannot find the container because the container does not exist yet.
   * When the container is registered, 
   * it will search the cache, monitor the child elements inside, and then remove the cache.
   */
  private __elMap: Record<string, Child[]> = {}
  // Built-in page visibility listener.
  private __listenerMap: { documentVisibility?: () => void } = {}

  /** Check whether to continue monitoring. */
  static shouldNext(value: any) {
    return value !== false
  }

  static parseObserverCallback(value?: ChildOptions): ChildOptionsObj {
    const sourceType = Object.prototype.toString.call(value);
    const type = sourceType.slice(8, sourceType.length - 1);
    switch(type) {
      case 'Function': return { active: value as ChildOptionsFn };
      case 'Object': return value as ChildOptionsObj;
      default: throw new Error(`Observer callback must be a function or an object, but got \`${value}\``);
    }
  }

  /** 
   * Check whether the child element has a callback function configuration.
   */
  static isValidObserverCallback(value?: ChildOptions) {
    const observeValue = ObserverManager.parseObserverCallback(value);
    const { active, enter, leave } = observeValue;
    if(!active && !enter && !leave) {
      console.warn(`Child missing all callbacks: 'active' 'enter' 'leave', so element won't be observered. `);
      return false;
    }
    return true;
  }

  /** Register observer. */
  registerObserver(key: string, options?: RootOptions) {
    if(!key) {
      throw new Error('No obserser key provided.')
    }
    const observer = new Observer((entries, observer) => entries.forEach(entry => {
      const el = entry.target as Child;
      const observeData = el.__observeData?.[key];
      if(!observeData) {
        return;
      }
      const { root } = observer.observer;
      !isChild(el, root) && console.warn('Element is not child of target.', el, root);
      if(entry.isIntersecting) {
        this.enter(key, el, { observer, entry, key });
      } else if (observeData.entered) {
        this.leave(key, el, { observer, entry, key });
      }
    }), options);

    this.__observerMap[key] = observer;
    // If there are elements to be monitored in the cache queue, 
    // monitor them, and then delete the queue.
    this.consumeElQueue(key);
    if(Object.keys(this.__observerMap).length === 1) {
      this.setDocumentVisibilityListener(true);
    }

    return observer;
  }
  /** Get observer. */
  getObserver(key: string): Observer | undefined {
    return this.__observerMap[key];
  }
  /** Delete observer */
  deleteObserver(key: string) {
    const observer = this.getObserver(key);
    observer && observer.disconnect();
    delete this.__observerMap[key];
    if(!Object.keys(this.__observerMap).length) {
      this.setDocumentVisibilityListener(false);
    }
  }
  /** Child element enters the detection area. */
  enter(key: string, el: Child, callbackValue: CallbackValue) {
    const observeData = el.__observeData?.[key];
    if(!observeData || observeData.entered) {
      return;
    }
    observeData.entered = true;
    const { value: { enter }, timer } = observeData;
    const { timeout } = callbackValue.observer.options;
    const enterNext = enter?.(el, callbackValue);
    if(ObserverManager.shouldNext(enterNext)) {
      timer && clearTimeout(timer);
      // Child element is active
      const callActive = () => {
        // Avoid closures.
        const activeNext = el.__observeData?.[key]?.value.active?.(el, callbackValue);
        !ObserverManager.shouldNext(activeNext) && this.unobserve(key, el);
      };
      if(timeout) {
        observeData.timer = setTimeout(callActive, timeout);
      } else {
        observeData.timer = null;
        callActive();
      }
    } else {
      this.unobserve(key, el);
    }
  }
  /** Child element leaves the detection area. */
  leave(key: string, el: Child, callbackValue: CallbackValue) {
    const observeData = el.__observeData?.[key];
    if(!observeData || !observeData.entered) {
      return;
    }
    observeData.entered = false;
    const leaveNext = observeData.value.leave?.(el, callbackValue);
    !ObserverManager.shouldNext(leaveNext) && this.unobserve(key, el);
    if(observeData.timer) {
      clearTimeout(observeData.timer);
      observeData.timer = null;
    }
  }
  /** Monitor child element */
  observe(key: string, el: Child, value: ChildOptions) {
    const observeValue = ObserverManager.parseObserverCallback(value);
    if(!ObserverManager.isValidObserverCallback(observeValue) || !isElement(el)) {
      return;
    }
    el.__observeData = el.__observeData || {};
    el.__observeData[key] = { value: observeValue };
    const observer = this.getObserver(key);
    observer ? observer.observe(el) : this.pushElToQueue(key, el);
  }
  /** Stop monitoring child element. */
  unobserve(key: string, el: Child) {
    if(!isElement(el)) {
      return;
    }
    this.getObserver(key)?.unobserve(el);
    const quene = this.__elMap[key];
    if(quene) {
      const idx = quene.indexOf(el);
      idx >= 0 && quene.splice(idx, 1);
    }
    el.__observeData && delete el.__observeData[key];
  }
  /** Add child elements to the cache queue. */
  pushElToQueue(key: string, el: Child) {
    this.__elMap[key] = this.__elMap[key] || [];
    this.__elMap[key].indexOf(el) < 0 && this.__elMap[key].push(el);
  }
  /** Clear the cache queue for child elements. */
  consumeElQueue(key: string) {
    const observer = this.getObserver(key);
    if(observer) {
      this.__elMap[key]?.forEach(el => observer.observe(el));
      delete this.__elMap[key];
    }
  }
  /** Set page visibility. */
  setVisibility(visible: boolean) {
    Object.keys(this.__observerMap).forEach(key => {
      const observer = this.__observerMap[key];
      if(!observer.options.useVisibility) {
        return;
      }
      if(visible) {
        observer.reconnect();
      } else {
        observer.disconnect();
        observer.children.forEach(el => this.leave(key, el, { observer, key }));
      }
    });
  }
  /** 
   * Built-in visibility listener: document visibilitychange.
   * The built-in listener is actually a syntax sugar for setVisibility. 
   * If you need to customize the visibility monitoring logic, 
   * you can use setVisibility to set your own visibility monitoring logic.
   */
  setDocumentVisibilityListener(listen = true) {
    const hasDocument = typeof document !== 'undefined';
    const prevListener = this.__listenerMap.documentVisibility;
    if(!hasDocument) {
      console.warn('Not in Document environment, no listener will be setted or unsetted.');
      return;
    }
    if(listen && !prevListener) {
      const listener = () => this.setVisibility(document.visibilityState === 'visible');
      document.addEventListener('visibilitychange', listener);
      listener();
      this.__listenerMap.documentVisibility = listener;
    } else if(!listen && prevListener) {
      document.removeEventListener('visibilitychange', prevListener);
      delete this.__listenerMap.documentVisibility;
    }
  }
}

/** Default observer manager. */
export const observerManager = new ObserverManager()