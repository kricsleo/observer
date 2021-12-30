"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useObserver = exports.useObserverRoot = void 0;
var tslib_1 = require("tslib");
var react_1 = require("react");
var observer_1 = require("@kricsleo/observer");
function useObserverRoot(key, options) {
    react_1.useEffect(function () {
        observer_1.observerManager.registerObserver(key, tslib_1.__assign({}, options));
        return function () { return observer_1.observerManager.deleteObserver(key); };
    }, [key, options]);
}
exports.useObserverRoot = useObserverRoot;
function useObserver(key, el, options) {
    react_1.useEffect(function () {
        observer_1.observerManager.observe(key, el, options);
        console.log('useeffect observer', el, options);
        return function () { return observer_1.observerManager.unobserve(key, el); };
    }, [key, el, options]);
}
exports.useObserver = useObserver;
//# sourceMappingURL=index.js.map