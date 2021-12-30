"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vueObserverDirectives = exports.getObserveDirectiveOptions = exports.observeChild = exports.observeRoot = void 0;
var tslib_1 = require("tslib");
var observer_1 = require("@kricsleo/observer");
exports.observeRoot = {
    bind: function (el, _a) {
        var _b = _a.arg, arg = _b === void 0 ? '' : _b, _c = _a.value, value = _c === void 0 ? {} : _c;
        observer_1.observerManager.registerObserver(arg, tslib_1.__assign({ root: el }, value));
    },
    update: function (el, _a) {
        var _b = _a.arg, arg = _b === void 0 ? '' : _b, _c = _a.oldArg, oldArg = _c === void 0 ? '' : _c, _d = _a.value, value = _d === void 0 ? {} : _d;
        if (arg !== oldArg) {
            observer_1.observerManager.deleteObserver(oldArg);
            observer_1.observerManager.registerObserver(arg, tslib_1.__assign({ root: el }, value));
        }
    },
    unbind: function (el, _a) {
        var _b = _a.arg, arg = _b === void 0 ? '' : _b;
        observer_1.observerManager.deleteObserver(arg);
    }
};
exports.observeChild = {
    bind: function (el, _a) {
        var _b = _a.arg, arg = _b === void 0 ? '' : _b, value = _a.value;
        value && observer_1.observerManager.observe(arg, el, value);
    },
    update: function (el, _a) {
        var _b = _a.arg, arg = _b === void 0 ? '' : _b, _c = _a.oldArg, oldArg = _c === void 0 ? '' : _c, value = _a.value, oldValue = _a.oldValue;
        var observeValue = observer_1.getObserveValue(value);
        var preObserveValue = observer_1.getObserveValue(oldValue);
        if (arg !== oldArg || observeValue.key !== preObserveValue.key) {
            observer_1.observerManager.unobserve(oldArg, el);
            observer_1.observerManager.observe(arg, el, observeValue);
        }
    },
    unbind: function (el, _a) {
        var _b = _a.arg, arg = _b === void 0 ? '' : _b;
        observer_1.observerManager.unobserve(arg, el);
    }
};
function getObserveDirectiveOptions(rootDirectives, childDirectives) {
    var directiveNames = ['bind', 'inserted', 'update', 'componentUpdated', 'unbind'];
    return directiveNames.reduce(function (all, cur) {
        all[cur] = function () {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var directive = args[1].modifiers.root ? rootDirectives : childDirectives;
            return (_a = directive[cur]) === null || _a === void 0 ? void 0 : _a.call.apply(_a, tslib_1.__spreadArrays([directive], args));
        };
        return all;
    }, {});
}
exports.getObserveDirectiveOptions = getObserveDirectiveOptions;
exports.vueObserverDirectives = getObserveDirectiveOptions(exports.observeRoot, exports.observeChild);
//# sourceMappingURL=index.js.map