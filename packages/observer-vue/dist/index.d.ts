import { DirectiveOptions } from 'vue';
import { DirectiveBinding } from 'vue/types/options';
import { IObserveChildValue } from '@kricsleo/observer';
export interface IObserveChildBinding extends DirectiveBinding {
    value?: IObserveChildValue;
    oldValue?: IObserveChildValue;
}
export declare const observeRoot: DirectiveOptions;
export declare const observeChild: DirectiveOptions;
export declare function getObserveDirectiveOptions(rootDirectives: DirectiveOptions, childDirectives: DirectiveOptions): DirectiveOptions;
export declare const vueObserverDirectives: DirectiveOptions;
