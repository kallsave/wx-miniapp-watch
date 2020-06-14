/*!
 * wx-miniapp-watch.js v1.0.7
 * (c) 2019-2020 kallsave <415034609@qq.com>
 * Released under the MIT License.
 */
function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn(obj, key) {
  return hasOwnProperty.call(obj, key);
}
var _toString = Object.prototype.toString;
function toRawType(value) {
  return _toString.call(value).slice(8, -1);
}
function isObject(value) {
  return value && _typeof(value) === 'object';
}
function isArray(value) {
  return toRawType(value) === 'Array';
}
function isPlainObject(value) {
  return toRawType(value) === 'Object';
}
function isFunction(value) {
  return toRawType(value) === 'Function';
}
function isEmptyObject(value) {
  if (isPlainObject(value)) {
    return Object.keys(value).length === 0;
  }

  return false;
}
function isString(value) {
  return toRawType(value) === 'String';
}
function def(obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    configurable: true,
    writable: true
  });
}
function remove(arr, item) {
  if (arr.length) {
    var index = arr.indexOf(item);

    if (index > -1) {
      return arr.splice(index, 1);
    }
  }
}
function noop() {}

var arrayProto = Array.prototype;
var arrayMethods = Object.create(arrayProto);
var methodsToPatch = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
methodsToPatch.forEach(function (method) {
  var original = arrayProto[method];
  def(arrayMethods, method, function () {
    var args = [];
    Array.prototype.push.apply(args, arguments);
    var result = original.apply(this, args);
    var ob = this.__ob__;
    var inserted;

    switch (method) {
      case 'push':
        inserted = args;
        break;

      case 'unshift':
        inserted = args;
        break;

      case 'splice':
        inserted = args.slice(2);
        break;
    }

    if (inserted) {
      ob.observeArray(inserted);
    }

    ob.dep.notify();
    return result;
  });
});

var uid = 0;

var Dep = /*#__PURE__*/function () {
  function Dep() {
    _classCallCheck(this, Dep);

    this.id = uid++;
    this.subs = [];
  }

  _createClass(Dep, [{
    key: "addSub",
    value: function addSub(sub) {
      this.subs.push(sub);
    }
  }, {
    key: "notify",
    value: function notify() {
      var subs = this.subs;

      for (var i = 0, l = subs.length; i < l; i++) {
        subs[i].update();
      }
    }
  }, {
    key: "depend",
    value: function depend() {
      if (Dep.target) {
        Dep.target.addDep(this);
      }
    }
  }, {
    key: "removeSub",
    value: function removeSub(sub) {
      remove(this.subs, sub);
    }
  }]);

  return Dep;
}();
Dep.target = null;
var targetStack = [];
function pushTarget(target) {
  targetStack.push(target);
  Dep.target = target;
}
function popTarget() {
  targetStack.pop();
  Dep.target = targetStack[targetStack.length - 1];
}

var hasProto = ('__proto__' in {});

function defineReactive(obj, key, val, shallow) {
  var dep = new Dep();
  var property = Object.getOwnPropertyDescriptor(obj, key);

  if (property && property.configurable === false) {
    return;
  }

  var getter = property && property.get;
  var setter = property && property.set;

  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key];
  }

  var childOb = !shallow && observe(val);
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function get() {
      var value = getter ? getter.call(obj) : val;

      if (Dep.target) {
        dep.depend();

        if (childOb) {
          childOb.dep.depend();
        }
      }

      return value;
    },
    set: function set(newVal) {
      /* eslint no-self-compare: "off" */
      if (newVal === val || newVal !== newVal && val !== val) {
        return;
      }

      if (getter && !setter) return;

      if (setter) {
        setter.call(obj, newVal);
      } else {
        val = newVal;
      }

      childOb = !shallow && observe(newVal);
      dep.notify();
    }
  });
}

var Observer = /*#__PURE__*/function () {
  function Observer(value) {
    _classCallCheck(this, Observer);

    this.value = value;
    this.dep = new Dep();
    def(value, '__ob__', this);

    if (isArray(value)) {
      if (hasProto) {
        /* eslint no-proto: "off" */
        value.__proto__ = arrayMethods;
      } else {
        for (var i = 0; i < methodsToPatch.length; i++) {
          var methodKey = methodsToPatch[i];
          var method = arrayMethods[methodKey];
          def(value, methodKey, method);
        }
      }

      this.observeArray(value);
    } else {
      this.walk(value);
    }
  }

  _createClass(Observer, [{
    key: "walk",
    value: function walk(obj) {
      var keys = Object.keys(obj);

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        defineReactive(obj, key, obj[key]);
      }
    }
  }, {
    key: "observeArray",
    value: function observeArray(arr) {
      for (var i = 0, l = arr.length; i < l; i++) {
        var item = arr[i];
        observe(item);
      }
    }
  }]);

  return Observer;
}();

function observe(value) {
  if (!value || _typeof(value) !== 'object') {
    return;
  }

  var ob = new Observer(value);
  return ob;
}

var seenObjects = new Set();
function traverse(val) {
  _traverse(val, seenObjects);

  seenObjects.clear();
}

function _traverse(val, seen) {
  var i, keys;
  var isA = Array.isArray(val);

  if (!isA && !isObject(val)) {
    return;
  }

  if (val.__ob__) {
    var depId = val.__ob__.dep.id;

    if (seen.has(depId)) {
      return;
    }

    seen.add(depId);
  }

  if (isA) {
    i = val.length;

    while (i--) {
      _traverse(val[i], seen);
    }
  } else {
    keys = Object.keys(val);
    i = keys.length;

    while (i--) {
      _traverse(val[keys[i]], seen);
    }
  }
}

var Watcher = /*#__PURE__*/function () {
  function Watcher(vm, expOrFn, cb) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    _classCallCheck(this, Watcher);

    this.vm = vm;
    this.cb = cb;
    this.deep = !!options.deep;
    this.user = !!options.user;
    this.lazy = !!options.lazy;
    this.sync = !!options.sync;
    this.dirty = this.lazy;
    this.depMap = {};
    this.deps = [];
    this.newDeps = [];
    this.depIds = new Set();
    this.newDepIds = new Set();

    if (typeof expOrFn === 'function') {
      this.getter = expOrFn;
    } else {
      this.getter = this.parsePath(expOrFn);

      if (!this.getter) {
        this.getter = noop;
      }
    }

    this.value = this.lazy ? undefined : this.get();
  }

  _createClass(Watcher, [{
    key: "parsePath",
    value: function parsePath(exp) {
      if (/[^\w.$]/.test(exp)) {
        return;
      }

      var exps = exp.split('.');
      return function (obj) {
        for (var i = 0, len = exps.length; i < len; i++) {
          if (!obj) {
            return;
          } // 申明的时候触发了getter


          obj = obj[exps[i]];
        }

        return obj;
      };
    }
  }, {
    key: "get",
    value: function get() {
      pushTarget(this);
      var value = this.getter.call(this.vm, this.vm);

      if (this.deep) {
        traverse(value);
      }

      popTarget();
      this.cleanupDeps();
      return value;
    }
  }, {
    key: "addDep",
    value: function addDep(dep) {
      var id = dep.id;

      if (!this.newDepIds.has(id)) {
        this.newDepIds.add(id);
        this.newDeps.push(dep);

        if (!this.depIds.has(id)) {
          dep.addSub(this);
        }
      }
    }
  }, {
    key: "cleanupDeps",
    value: function cleanupDeps() {
      var i = this.deps.length;

      while (i--) {
        var dep = this.deps[i];

        if (!this.newDepIds.has(dep.id)) {
          dep.removeSub(this);
        }
      }

      var tmp = this.depIds;
      this.depIds = this.newDepIds;
      this.newDepIds = tmp;
      this.newDepIds.clear();
      tmp = this.deps;
      this.deps = this.newDeps;
      this.newDeps = tmp;
      this.newDeps.length = 0;
    }
  }, {
    key: "update",
    value: function update() {
      if (this.lazy) {
        this.dirty = true;
      } else {
        this.run();
      }
    }
  }, {
    key: "run",
    value: function run() {
      var _this = this;

      var newVal = this.get();
      var oldVal = this.value;

      if (newVal !== oldVal || isObject(newVal) || this.deep) {
        this.value = newVal;

        if (this.sync) {
          this.cb.call(this.vm, newVal, oldVal);
        } else {
          setTimeout(function () {
            _this.cb.call(_this.vm, newVal, oldVal);
          }, 1000 / 30);
        }
      }
    }
  }, {
    key: "evaluate",
    value: function evaluate() {
      this.value = this.get();
      this.dirty = false;
    }
  }, {
    key: "depend",
    value: function depend() {
      var i = this.deps.length;

      while (i--) {
        this.deps[i].depend();
      }
    }
  }]);

  return Watcher;
}();

function createWatcher(vm, data, expOrFn, handler) {
  var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

  if (isPlainObject(handler)) {
    options = handler;
    handler = handler.handler;
  } else if (isString(handler)) {
    handler = vm[handler];
  }

  var watcher = new Watcher(data, expOrFn, handler.bind(vm), options);

  if (options.immediate) {
    handler.call(vm, watcher.value);
  }
}

function initWatch(vm, data, watch, isGlobalWatch) {
  if (!isPlainObject(data)) {
    return;
  }

  for (var key in watch) {
    if (!hasOwn(data, key)) {
      warnMissDefined(isGlobalWatch, key);
    }

    var handler = watch[key];

    if (isArray(handler)) {
      for (var i = 0; i < handler.length; i++) {
        createWatcher(vm, data, key, handler[i]);
      }
    } else {
      createWatcher(vm, data, key, handler);
    }
  }
}

function getCreatedHook(options, createdHooks) {
  for (var i = 0; i < createdHooks.length; i++) {
    var hook = createdHooks[i];

    if (options[hook]) {
      return hook;
    }
  }
}

function getInitHook(options, createdHooks, isComponent) {
  var createdHookOptions;
  var createdHook;

  if (!isComponent) {
    createdHook = getCreatedHook(options, createdHooks);
    createdHookOptions = options;
  } else {
    var lifetimes = options.lifetimes;

    if (!lifetimes || isEmptyObject(lifetimes)) {
      createdHook = getCreatedHook(options, createdHooks);
      createdHookOptions = options;
    } else {
      var assignOptions = _objectSpread2({}, options, {}, lifetimes);

      createdHook = getCreatedHook(assignOptions, createdHooks);
      createdHookOptions = lifetimes[createdHook] ? lifetimes : options;
    }
  }

  return {
    createdHook: createdHook,
    createdHookOptions: createdHookOptions
  };
}

function warnMissCreaedHooks(hookName, createdHooks) {
  console.warn("".concat(hookName, " hook warn: using ").concat(hookName, " hook need ").concat(createdHooks.join(' or '), " lifecycle function hook"));
}

function warnMissDefined(isGlobalWatch, key) {
  var hookName = isGlobalWatch ? 'globalWatch' : 'watch';
  var definedData = isGlobalWatch ? 'app.globalData' : 'data';
  console.warn("".concat(hookName, " hook warn: '").concat(key, "' have to defined in ").concat(definedData, " to be watch"));
}

function mergeOptions(options, createdHooks, destroyedHooks, isApp, isComponent) {
  var globalWatch = options.globalWatch;
  var watch = options.watch;

  if (!isApp && !globalWatch && !watch) {
    return options;
  }

  var _getInitHook = getInitHook(options, createdHooks, isComponent),
      createdHookOptions = _getInitHook.createdHookOptions,
      createdHook = _getInitHook.createdHook;

  var originCreatedHook = createdHookOptions[createdHook];
  var hasOriginCreatedHook = originCreatedHook && isFunction(originCreatedHook);

  if (hasOriginCreatedHook) {
    createdHookOptions[createdHook] = function () {
      if (isApp) {
        observe(options.globalData);
      }

      if (globalWatch) {
        var globalData;

        if (!isApp) {
          globalData = getApp().globalData;
        } else {
          globalData = options.globalData;
        }

        initWatch(this, globalData, globalWatch, true);
      }

      if (watch) {
        var data = this.data;
        observe(data);
        initWatch(this, data, watch, false);
      }

      return originCreatedHook.apply(this, arguments);
    };
  } else {
    var hookName = globalWatch ? 'globalWatch' : 'watch';
    warnMissCreaedHooks(hookName, createdHooks);
  }

  return options;
}

var createdHooks = ['onLaunch'];
var destroyedHooks = [];
var originApp = App;
var appWatchInstaller = {
  install: function install() {
    if (this.installed) {
      return;
    }

    this.installed = true;

    App = function App(options) {
      options = mergeOptions(options, createdHooks, destroyedHooks, true, false);
      originApp(options);
    };
  }
};

var createdHooks$1 = ['onLoad'];
var destroyedHooks$1 = ['onUnload'];
var originPage = Page;
var pageWatchInstaller = {
  install: function install() {
    if (this.installed) {
      return;
    }

    this.installed = true;

    Page = function Page(options) {
      options = mergeOptions(options, createdHooks$1, destroyedHooks$1, false, false);
      originPage(options);
    };
  }
};

var createdHooks$2 = ['created', 'attached', 'ready'];
var destroyedHooks$2 = ['onUnload'];
var originComponent = Component;
var componentWatchInstaller = {
  install: function install() {
    if (this.installed) {
      return;
    }

    this.installed = true;

    Component = function Component(options) {
      options = mergeOptions(options, createdHooks$2, destroyedHooks$2, false, true);
      originComponent(options);
    };
  }
};

var wxWatch = {
  install: function install() {
    if (this.installed) {
      return;
    }

    this.installed = true;
    appWatchInstaller.install();
    pageWatchInstaller.install();
    componentWatchInstaller.install();
  },
  verson: '1.0.7'
};
wxWatch.install();

export default wxWatch;
