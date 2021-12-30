export interface IKObserverOptions extends IntersectionObserverInit {
    threshold?: number;
    useVisibility?: boolean;
    timeout?: number;
}
export interface IObserveCallbackValue {
    key: string;
    observer: KObserver;
    entry?: IntersectionObserverEntry;
}
export declare type IObserveFn = (el: IObserveElement, value: IObserveCallbackValue) => void | false;
export declare type IObserveValue = {
    key?: string | number;
    active?: IObserveFn;
    enter?: IObserveFn;
    leave?: IObserveFn;
};
export declare type IObserveChildValue = IObserveFn | IObserveValue;
export interface IObserveElement extends Element {
    __observeData?: Record<string, {
        value: IObserveValue;
        timer?: ReturnType<typeof setTimeout> | null;
        entered?: boolean;
    }>;
}
export declare function getObserveValue(value?: IObserveChildValue): IObserveValue;
export declare function checkObserveCallback(value?: IObserveChildValue): boolean;
interface IKObserverCallback {
    (entries: IntersectionObserverEntry[], observer: KObserver): void;
}
export declare class KObserver {
    observer: IntersectionObserver;
    children: IObserveElement[];
    options: IKObserverOptions;
    private connected;
    constructor(callback: IKObserverCallback, options?: IKObserverOptions);
    addChild(target: IObserveElement): void;
    deleteChild(target: IObserveElement): void;
    observe(target: IObserveElement): void;
    unobserve(target: IObserveElement): void;
    disconnect(): void;
    reconnect(): void;
    takeRecords(): IntersectionObserverEntry[];
}
export declare const observerManager: {
    __observerMap: Record<string, KObserver>;
    __elMap: Record<string, IObserveElement[]>;
    __listenerMap: {
        documentVisibility?: (() => void) | undefined;
    };
    registerObserver(key: string, options?: IKObserverOptions | undefined): KObserver | undefined;
    addObserver(key: string, observer: KObserver): KObserver;
    getObserver(key: string): KObserver | undefined;
    deleteObserver(key: string): void;
    enter(key: string, el: IObserveElement, callbackValue: IObserveCallbackValue): void;
    leave(key: string, el: IObserveElement, callbackValue: IObserveCallbackValue): void;
    observe(key: string, el: IObserveElement, value: IObserveChildValue): void;
    unobserve(key: string, el: IObserveElement): void;
    pushElToQueue(key: string, el: IObserveElement): void;
    consumeElQueue(key: string): void;
    setVisibility(visible: boolean): void;
    setDocumentVisibilityListener(listen?: boolean): void;
};
export {};
