"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.observerManager = exports.KObserver = exports.checkObserveCallback = exports.getObserveValue = void 0;
function getObserveValue(value) {
    var sourceType = Object.prototype.toString.call(value);
    var type = sourceType.slice(8, sourceType.length - 1);
    switch (type) {
        case 'Function': return { active: value };
        case 'Object': return value;
        default: {
            console.warn("child must receive a function or an object, but got '" + value + "'");
            return {};
        }
    }
}
exports.getObserveValue = getObserveValue;
function checkObserveCallback(value) {
    var observeValue = getObserveValue(value);
    var active = observeValue.active, enter = observeValue.enter, leave = observeValue.leave;
    if (!active && !enter && !leave) {
        console.warn("child missing all callbacks: 'active' 'enter' 'leave', so element won't be observered. ");
        return false;
    }
    return true;
}
exports.checkObserveCallback = checkObserveCallback;
function checkChild(child, parent) {
    return !parent || (parent !== child && parent.contains(child));
}
function checkShouldNext(value) {
    return value !== false;
}
var KObserver = (function () {
    function KObserver(callback, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        this.children = [];
        this.connected = false;
        this.options = options;
        this.observer = new IntersectionObserver(function (entries) { return callback(entries, _this); }, this.options);
        this.connected = true;
    }
    KObserver.prototype.addChild = function (target) {
        this.children.indexOf(target) < 0 && this.children.push(target);
    };
    KObserver.prototype.deleteChild = function (target) {
        var idx = this.children.indexOf(target);
        idx >= 0 && this.children.splice(idx, 1);
    };
    KObserver.prototype.observe = function (target) {
        this.observer.observe(target);
        this.options.useVisibility && this.addChild(target);
    };
    KObserver.prototype.unobserve = function (target) {
        this.observer.unobserve(target);
        this.deleteChild(target);
    };
    KObserver.prototype.disconnect = function () {
        this.connected && this.observer.disconnect();
        this.connected = false;
    };
    KObserver.prototype.reconnect = function () {
        var _this = this;
        !this.connected && this.children.forEach(function (t) { return _this.observer.observe(t); });
        this.connected = true;
    };
    KObserver.prototype.takeRecords = function () {
        return this.observer.takeRecords();
    };
    return KObserver;
}());
exports.KObserver = KObserver;
exports.observerManager = {
    __observerMap: {},
    __elMap: {},
    __listenerMap: {},
    registerObserver: function (key, options) {
        if (!key) {
            console.error('please provide observer key.');
            return;
        }
        var observer = new KObserver(function (entries, observer) { return entries.forEach(function (entry) {
            var el = entry.target;
            var root = observer.observer.root;
            !checkChild(el, root) && console.warn('element is not child of target.', el, root);
            var observeData = el.__observeData[key];
            if (entry.isIntersecting) {
                exports.observerManager.enter(key, el, { observer: observer, entry: entry, key: key });
            }
            else if (observeData.entered) {
                exports.observerManager.leave(key, el, { observer: observer, entry: entry, key: key });
            }
        }); }, options);
        exports.observerManager.addObserver(key, observer);
        return observer;
    },
    addObserver: function (key, observer) {
        exports.observerManager.__observerMap[key] = observer;
        exports.observerManager.consumeElQueue(key);
        if (Object.keys(exports.observerManager.__observerMap).length === 1) {
            exports.observerManager.setDocumentVisibilityListener(true);
        }
        return observer;
    },
    getObserver: function (key) {
        return exports.observerManager.__observerMap[key];
    },
    deleteObserver: function (key) {
        var observer = exports.observerManager.getObserver(key);
        observer && observer.disconnect();
        delete exports.observerManager.__observerMap[key];
        if (!Object.keys(exports.observerManager.__observerMap).length) {
            exports.observerManager.setDocumentVisibilityListener(false);
        }
    },
    enter: function (key, el, callbackValue) {
        var _a;
        var observeData = (_a = el.__observeData) === null || _a === void 0 ? void 0 : _a[key];
        if (!observeData || observeData.entered) {
            return;
        }
        observeData.entered = true;
        var enter = observeData.value.enter, timer = observeData.timer;
        var timeout = callbackValue.observer.options.timeout;
        var enterNext = enter === null || enter === void 0 ? void 0 : enter(el, callbackValue);
        if (checkShouldNext(enterNext)) {
            timer && clearTimeout(timer);
            var callActive = function () {
                var _a, _b, _c, _d;
                var activeNext = (_d = (_b = (_a = el.__observeData) === null || _a === void 0 ? void 0 : _a[key]) === null || _b === void 0 ? void 0 : (_c = _b.value).active) === null || _d === void 0 ? void 0 : _d.call(_c, el, callbackValue);
                !checkShouldNext(activeNext) && exports.observerManager.unobserve(key, el);
            };
            if (timeout) {
                observeData.timer = setTimeout(callActive, timeout);
            }
            else {
                observeData.timer = null;
                callActive();
            }
        }
        else {
            exports.observerManager.unobserve(key, el);
        }
    },
    leave: function (key, el, callbackValue) {
        var _a, _b, _c;
        var observeData = (_a = el.__observeData) === null || _a === void 0 ? void 0 : _a[key];
        if (!observeData || !observeData.entered) {
            return;
        }
        observeData.entered = false;
        var leaveNext = (_c = (_b = observeData.value).leave) === null || _c === void 0 ? void 0 : _c.call(_b, el, callbackValue);
        !checkShouldNext(leaveNext) && exports.observerManager.unobserve(key, el);
        if (observeData.timer) {
            clearTimeout(observeData.timer);
            observeData.timer = null;
        }
    },
    observe: function (key, el, value) {
        var observeValue = getObserveValue(value);
        if (!checkObserveCallback(observeValue) || !el) {
            return;
        }
        el.__observeData = el.__observeData || {};
        el.__observeData[key] = { value: observeValue };
        var observer = exports.observerManager.getObserver(key);
        observer ? observer.observe(el) : exports.observerManager.pushElToQueue(key, el);
    },
    unobserve: function (key, el) {
        var _a;
        if (!el) {
            return;
        }
        (_a = exports.observerManager.getObserver(key)) === null || _a === void 0 ? void 0 : _a.unobserve(el);
        var quene = exports.observerManager.__elMap[key];
        if (quene) {
            var idx = quene.indexOf(el);
            idx >= 0 && quene.splice(idx, 1);
        }
        el.__observeData && delete el.__observeData[key];
    },
    pushElToQueue: function (key, el) {
        exports.observerManager.__elMap[key] = exports.observerManager.__elMap[key] || [];
        exports.observerManager.__elMap[key].indexOf(el) < 0 && exports.observerManager.__elMap[key].push(el);
    },
    consumeElQueue: function (key) {
        var _a;
        var observer = exports.observerManager.getObserver(key);
        if (observer) {
            (_a = exports.observerManager.__elMap[key]) === null || _a === void 0 ? void 0 : _a.forEach(function (el) { return observer.observe(el); });
            delete exports.observerManager.__elMap[key];
        }
    },
    setVisibility: function (visible) {
        Object.keys(exports.observerManager.__observerMap).forEach(function (key) {
            var observer = exports.observerManager.__observerMap[key];
            if (!observer.options.useVisibility) {
                return;
            }
            if (visible) {
                observer.reconnect();
            }
            else {
                observer.disconnect();
                observer.children.forEach(function (el) { return exports.observerManager.leave(key, el, { observer: observer, key: key }); });
            }
        });
    },
    setDocumentVisibilityListener: function (listen) {
        if (listen === void 0) { listen = true; }
        var hasDocument = typeof document !== 'undefined';
        var prevListener = exports.observerManager.__listenerMap.documentVisibility;
        if (!hasDocument) {
            console.warn('Not in Document environment, no listener will be setted or unsetted.');
            return;
        }
        if (listen && !prevListener) {
            var listener = function () { return exports.observerManager.setVisibility(document.visibilityState === 'visible'); };
            document.addEventListener('visibilitychange', listener);
            listener();
            this.__listenerMap.documentVisibility = listener;
        }
        else if (!listen && prevListener) {
            document.removeEventListener('visibilitychange', prevListener);
            delete this.__listenerMap.documentVisibility;
        }
    }
};
//# sourceMappingURL=index.js.map