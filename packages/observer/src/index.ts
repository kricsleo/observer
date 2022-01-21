/** 检测容器配置 */
export interface IKObserverOptions extends IntersectionObserverInit {
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

export interface IObserveCallbackValue {
  key: string;
  observer: KObserver;
  entry?: IntersectionObserverEntry;
}

/**
 * 检测回调函数
 * 返回 {false} 则不再进行后续检测
 */
export type IObserveFn = (el: IObserveElement, value: IObserveCallbackValue) => void | false;

/** 被检测元素配置 */
export type IObserveValue = {
  /**
  * 元素检测唯一key, 更换key可以重新检测
  */
  key?: string | number;
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

 export type IObserveChildValue = IObserveFn | IObserveValue

 /**
  * 被检测子元素 element
  */
 export interface IObserveElement extends Element {
   __observeData?: Record<string, {
     /**
      * 检测配置
      */
     value: IObserveValue;
     /**
      * 激活倒计时
      */
     timer?: ReturnType<typeof setTimeout> | null;
     /**
      * 元素进入/退出 flag
      */
     entered?: boolean;
   }>;
 }

/** 解析子元素检测参数 */
export function getObserveValue(value?: IObserveChildValue): IObserveValue {
  const sourceType = Object.prototype.toString.call(value);
  const type = sourceType.slice(8, sourceType.length - 1);
  switch(type) {
    case 'Function': return { active: value as IObserveFn };
    case 'Object': return value as IObserveValue;
    default: {
      console.warn(`Child must receive a function or an object, but got '${value}'`);
      return {};
    }
  }
}

/** 检查子元素是否有回调函数配置 */
export function checkObserveCallback(value?: IObserveChildValue) {
  const observeValue = getObserveValue(value);
  const { active, enter, leave } = observeValue;
  if(!active && !enter && !leave) {
    console.warn(`Child missing all callbacks: 'active' 'enter' 'leave', so element won't be observered. `);
    return false;
  }
  return true;
}

/** 判断是否是子元素 */
function checkChild(child: Element, parent: null | Document | Element) {
  return !parent || (parent !== child && parent.contains(child));
}

/** 判断是否继续检测 */
function checkShouldNext(value: any) {
  return value !== false;
}

interface IKObserverCallback {
  (entries: IntersectionObserverEntry[], observer: KObserver): void;
}

/**
 * 自定义 IntersectionObserver
 */
export class KObserver {
  observer: IntersectionObserver;
  children: IObserveElement[] = [];
  options: IKObserverOptions;
  private connected = false;
  constructor(callback: IKObserverCallback, options: IKObserverOptions = {}) {
    this.options = options;
    this.observer = new IntersectionObserver(entries => callback(entries, this), this.options);
    this.connected = true;
  }
  addChild(target: IObserveElement) {
    this.children.indexOf(target) < 0 && this.children.push(target);
  }
  deleteChild(target: IObserveElement) {
    const idx = this.children.indexOf(target);
    idx >= 0 && this.children.splice(idx, 1);
  }
  observe(target: IObserveElement): void {
    this.observer.observe(target);
    this.options.useVisibility && this.addChild(target);
  }
  unobserve(target: IObserveElement): void {
    this.observer.unobserve(target);
    this.deleteChild(target);
  }
  disconnect(): void {
    this.connected && this.observer.disconnect();
    this.connected = false;
  }
  reconnect(): void {
    !this.connected && this.children.forEach(t => this.observer.observe(t));
    this.connected = true;
  }
  takeRecords(): IntersectionObserverEntry[] {
    return this.observer.takeRecords();
  }
}

/** 检测管理 */
export const observerManager = {
  // 监测器实例
  __observerMap: {} as Record<string, KObserver>,
  // 有时候子元素会先于容器注册, 此时由于容器还不存在, 所以需要一个缓存队列存储找不到容器的子元素
  // 当容器注册的时候会查找缓存,监测里面的子元素, 然后移除缓存
  __elMap: {} as Record<string, IObserveElement[]>,
  // 检测容器默认配置(Seems not needed for now.)
  // __defaultOptions: {} as IKObserverOptions,
  // 内置页面可见性监听器
  __listenerMap: {} as { documentVisibility?: () => void },
  // 设置容器默认配置
  // setDefaultOptions(options: IKObserverOptions) {
  //   observerManager.__defaultOptions = options || {};
  // },
  // 注册监测器
  registerObserver(key: string, options?: IKObserverOptions) {
    if(!key) {
      console.error('Please provide observer key.');
      return;
    }
    const observer = new KObserver((entries, observer) => entries.forEach(entry => {
      const el = entry.target as IObserveElement;
      const observeData = el.__observeData?.[key];
      if(!observeData) {
        return;
      }
      const { root } = observer.observer;
      !checkChild(el, root) && console.warn('Element is not child of target.', el, root);
      if(entry.isIntersecting) {
        observerManager.enter(key, el, { observer, entry, key });
      } else if (observeData.entered) {
        observerManager.leave(key, el, { observer, entry, key });
      }
    }), options);
    observerManager.addObserver(key, observer);
    return observer;
  },
  addObserver(key: string, observer: KObserver) {
    observerManager.__observerMap[key] = observer;
    // 如果缓存队列中有待监测元素,则进行监测,然后删除队列
    observerManager.consumeElQueue(key);
    if(Object.keys(observerManager.__observerMap).length === 1) {
      observerManager.setDocumentVisibilityListener(true);
    }
    return observer;
  },
  // 获取监测器
  getObserver(key: string): KObserver | undefined {
    return observerManager.__observerMap[key];
  },
  // 删除监测器
  deleteObserver(key: string) {
    const observer = observerManager.getObserver(key);
    observer && observer.disconnect();
    delete observerManager.__observerMap[key];
    if(!Object.keys(observerManager.__observerMap).length) {
      observerManager.setDocumentVisibilityListener(false);
    }
  },
  // 子元素进入检测区域
  enter(key: string, el: IObserveElement, callbackValue: IObserveCallbackValue) {
    const observeData = el.__observeData?.[key];
    if(!observeData || observeData.entered) {
      return;
    }
    observeData.entered = true;
    const { value: { enter }, timer } = observeData;
    const { timeout } = callbackValue.observer.options;
    const enterNext = enter?.(el, callbackValue);
    if(checkShouldNext(enterNext)) {
      timer && clearTimeout(timer);
      // 子元素被激活
      const callActive = () => {
        // 避免闭包
        const activeNext = el.__observeData?.[key]?.value.active?.(el, callbackValue);
        !checkShouldNext(activeNext) && observerManager.unobserve(key, el);
      };
      if(timeout) {
        observeData.timer = setTimeout(callActive, timeout);
      } else {
        observeData.timer = null;
        callActive();
      }
    } else {
      observerManager.unobserve(key, el);
    }
  },
  // 子元素离开检测区域
  leave(key: string, el: IObserveElement, callbackValue: IObserveCallbackValue) {
    const observeData = el.__observeData?.[key];
    if(!observeData || !observeData.entered) {
      return;
    }
    observeData.entered = false;
    const leaveNext = observeData.value.leave?.(el, callbackValue);
    !checkShouldNext(leaveNext) && observerManager.unobserve(key, el);
    if(observeData.timer) {
      clearTimeout(observeData.timer);
      observeData.timer = null;
    }
  },
  // 监测子元素
  observe(key: string, el: IObserveElement, value: IObserveChildValue) {
    const observeValue = getObserveValue(value);
    if(!checkObserveCallback(observeValue) || !el) {
      return;
    }
    el.__observeData = el.__observeData || {};
    el.__observeData[key] = { value: observeValue };
    const observer = observerManager.getObserver(key);
    observer ? observer.observe(el) : observerManager.pushElToQueue(key, el);
  },
  // 取消监测子元素
  unobserve(key: string, el: IObserveElement) {
    if(!el) {
      return;
    }
    observerManager.getObserver(key)?.unobserve(el);
    const quene = observerManager.__elMap[key];
    if(quene) {
      const idx = quene.indexOf(el);
      idx >= 0 && quene.splice(idx, 1);
    }
    el.__observeData && delete el.__observeData[key];
  },
  // 加入子元素到缓存队列
  pushElToQueue(key: string, el: IObserveElement) {
    observerManager.__elMap[key] = observerManager.__elMap[key] || [];
    observerManager.__elMap[key].indexOf(el) < 0 && observerManager.__elMap[key].push(el);
  },
  // 清除子元素缓存队列
  consumeElQueue(key: string) {
    const observer = observerManager.getObserver(key);
    if(observer) {
      observerManager.__elMap[key]?.forEach(el => observer.observe(el));
      delete observerManager.__elMap[key];
    }
  },
  // 页面可见性变化
  setVisibility(visible: boolean) {
    Object.keys(observerManager.__observerMap).forEach(key => {
      const observer = observerManager.__observerMap[key];
      if(!observer.options.useVisibility) {
        return;
      }
      if(visible) {
        observer.reconnect();
      } else {
        observer.disconnect();
        observer.children.forEach(el => observerManager.leave(key, el, { observer, key }));
      }
    });
  },
  // 内置可见性监听器: document visibilitychange
  // 内置监听器其实是 setVisibility 的语法糖, 如果需要自定义可见性监听逻辑,
  // 可使用 setVisibility 设置自己的可见性监听逻辑
  setDocumentVisibilityListener(listen = true) {
    const hasDocument = typeof document !== 'undefined';
    const prevListener = observerManager.__listenerMap.documentVisibility;
    if(!hasDocument) {
      console.warn('Not in Document environment, no listener will be setted or unsetted.');
      return;
    }
    if(listen && !prevListener) {
      const listener = () => observerManager.setVisibility(document.visibilityState === 'visible');
      document.addEventListener('visibilitychange', listener);
      listener();
      this.__listenerMap.documentVisibility = listener;
    } else if(!listen && prevListener) {
      document.removeEventListener('visibilitychange', prevListener);
      delete this.__listenerMap.documentVisibility;
    }
  }
}
