/*!
 * wx-miniapp-watch.js v1.0.9
 * (c) 2019-2020 kallsave <415034609@qq.com>
 * Released under the MIT License.
 */
const hasOwnProperty = Object.prototype.hasOwnProperty;

function hasOwn(obj, key) {
  return hasOwnProperty.call(obj, key)
}

const _toString = Object.prototype.toString;

function toRawType(value) {
  return _toString.call(value).slice(8, -1)
}

function isObject(value) {
  return value && typeof value === 'object'
}

function isArray(value) {
  return toRawType(value) === 'Array'
}

function isPlainObject(value) {
  return toRawType(value) === 'Object'
}

function isFunction(value) {
  return toRawType(value) === 'Function'
}

function isEmptyObject(value) {
  if (isPlainObject(value)) {
    return Object.keys(value).length === 0
  }
  return false
}

function isString(value) {
  return toRawType(value) === 'String'
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
    const index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}

function noop() { }

const arrayProto = Array.prototype;

const arrayMethods = Object.create(arrayProto);

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
];

methodsToPatch.forEach((method) => {
  const original = arrayProto[method];
  def(arrayMethods, method, function () {
    const args = [];
    Array.prototype.push.apply(args, arguments);
    const result = original.apply(this, args);
    const ob = this.__ob__;

    let inserted;
    switch (method) {
      case 'push':
        inserted = args;
        break
      case 'unshift':
        inserted = args;
        break
      case 'splice':
        inserted = args.slice(2);
        break
    }
    if (inserted) {
      ob.observeArray(inserted);
    }
    ob.dep.notify();
    return result
  });
});

let uid = 0;

class Dep {
  constructor() {
    this.id = uid++;
    this.subs = [];
  }

  addSub(sub) {
    this.subs.push(sub);
  }

  notify() {
    const subs = this.subs;
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update();
    }
  }

  depend() {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  }
  removeSub(sub) {
    remove(this.subs, sub);
  }
}

Dep.target = null;
const targetStack = [];

function pushTarget(target) {
  targetStack.push(target);
  Dep.target = target;
}

function popTarget() {
  targetStack.pop();
  Dep.target = targetStack[targetStack.length - 1];
}

const hasProto = '__proto__' in {};

function defineReactive(obj, key, val, shallow) {
  const dep = new Dep();

  const property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return
  }

  const getter = property && property.get;
  const setter = property && property.set;
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key];
  }

  let childOb = !shallow && observe(val);
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      const value = getter ? getter.call(obj) : val;
      if (Dep.target) {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
        }
      }
      return value
    },
    set(newVal) {
      /* eslint no-self-compare: "off" */
      if (newVal === val || (newVal !== newVal && val !== val)) {
        return
      }
      if (getter && !setter) return
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

class Observer {
  constructor(value) {
    this.value = value;
    this.dep = new Dep();
    def(value, '__ob__', this);

    if (isArray(value)) {
      if (hasProto) {
        /* eslint no-proto: "off" */
        value.__proto__ = arrayMethods;
      } else {
        for (let i = 0; i < methodsToPatch.length; i++) {
          const methodKey = methodsToPatch[i];
          const method = arrayMethods[methodKey];
          def(value, methodKey, method);
        }
      }
      this.observeArray(value);
    } else {
      this.walk(value);
    }
  }

  walk(obj) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      defineReactive(obj, key, obj[key]);
    }
  }

  observeArray(arr) {
    for (let i = 0, l = arr.length; i < l; i++) {
      const item = arr[i];
      observe(item);
    }
  }
}

function observe(value) {
  if (!value || typeof value !== 'object') {
    return
  }
  const ob = new Observer(value);
  return ob
}

const seenObjects = new Set();

function traverse(val) {
  _traverse(val, seenObjects);
  seenObjects.clear();
}

function _traverse(val, seen) {
  let i, keys;
  const isA = Array.isArray(val);
  if (!isA && !isObject(val)) {
    return
  }
  if (val.__ob__) {
    const depId = val.__ob__.dep.id;
    if (seen.has(depId)) {
      return
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

class Watcher {
  constructor(vm, expOrFn, cb, options = {}) {
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
    this.value = this.lazy
      ? undefined
      : this.get();
  }

  parsePath(exp) {
    if (/[^\w.$]/.test(exp)) {
      return
    }
    const exps = exp.split('.');
    return function (obj) {
      for (let i = 0, len = exps.length; i < len; i++) {
        if (!obj) {
          return
        }
        // 申明的时候触发了getter
        obj = obj[exps[i]];
      }
      return obj
    }
  }

  get() {
    pushTarget(this);
    const value = this.getter.call(this.vm, this.vm);
    if (this.deep) {
      traverse(value);
    }
    popTarget();
    this.cleanupDeps();
    return value
  }

  addDep(dep) {
    const id = dep.id;
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id);
      this.newDeps.push(dep);
      if (!this.depIds.has(id)) {
        dep.addSub(this);
      }
    }
  }

  cleanupDeps() {
    let i = this.deps.length;
    while (i--) {
      const dep = this.deps[i];
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this);
      }
    }
    let tmp = this.depIds;
    this.depIds = this.newDepIds;
    this.newDepIds = tmp;
    this.newDepIds.clear();
    tmp = this.deps;
    this.deps = this.newDeps;
    this.newDeps = tmp;
    this.newDeps.length = 0;
  }

  update() {
    if (this.lazy) {
      this.dirty = true;
    } else {
      this.run();
    }
  }

  run() {
    const newVal = this.get();
    const oldVal = this.value;
    if (newVal !== oldVal || isObject(newVal) || this.deep) {
      this.value = newVal;
      if (this.sync) {
        this.cb.call(this.vm, newVal, oldVal);
      } else {
        setTimeout(() => {
          this.cb.call(this.vm, newVal, oldVal);
        }, 1000 / 30);
      }
    }
  }

  evaluate() {
    this.value = this.get();
    this.dirty = false;
  }

  depend() {
    let i = this.deps.length;
    while (i--) {
      this.deps[i].depend();
    }
  }
}

function createWatcher(vm, data, expOrFn, handler, options = {}) {
  if (isPlainObject(handler)) {
    options = handler;
    handler = handler.handler;
  } else if (isString(handler)) {
    handler = vm[handler];
  }
  const watcher = new Watcher(data, expOrFn, handler.bind(vm), options);
  if (options.immediate) {
    handler.call(vm, watcher.value);
  }
}

function initWatch(vm, data, watch, isGlobalWatch) {
  if (!isPlainObject(data)) {
    return
  }
  for (const key in watch) {
    if (!hasOwn(data, key)) {
      warnMissDefined(isGlobalWatch, key);
    }
    const handler = watch[key];
    if (isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, data, key, handler[i]);
      }
    } else {
      createWatcher(vm, data, key, handler);
    }
  }
}

function getCreatedHook(options, createdHooks) {
  for (let i = 0; i < createdHooks.length; i++) {
    const hook = createdHooks[i];
    if (options[hook]) {
      return hook
    }
  }
}

function getInitHook(options, createdHooks, isComponent) {
  let createdHookOptions;
  let createdHook;

  if (!isComponent) {
    createdHook = getCreatedHook(options, createdHooks);
    createdHookOptions = options;
  } else {
    const lifetimes = options.lifetimes;
    if (!lifetimes || isEmptyObject(lifetimes)) {
      createdHook = getCreatedHook(options, createdHooks);
      createdHookOptions = options;
    } else {
      const assignOptions = {
        ...options,
        ...lifetimes,
      };
      createdHook = getCreatedHook(assignOptions, createdHooks);
      createdHookOptions = lifetimes[createdHook] ? lifetimes : options;
    }
  }
  return {
    createdHook,
    createdHookOptions,
  }
}

function warnMissCreaedHooks(hookName, createdHooks) {
  console.warn(`${hookName} hook warn: using ${hookName} hook need ${createdHooks.join(' or ')} lifecycle function hook`);
}

function warnMissDefined(isGlobalWatch, key) {
  const hookName = isGlobalWatch ? 'globalWatch' : 'watch';
  const definedData = isGlobalWatch ? 'app.globalData' : 'data';
  console.warn(`${hookName} hook warn: '${key}' have to defined in ${definedData} to be watch`);
}

function mergeOptions(
  options,
  createdHooks,
  destroyedHooks,
  isApp,
  isComponent,
) {
  const globalWatch = options.globalWatch;
  const watch = options.watch;

  if (!isApp && !globalWatch && !watch) {
    return options
  }

  const {
    createdHookOptions,
    createdHook,
  } = getInitHook(options, createdHooks, isComponent);

  const originCreatedHook = createdHookOptions[createdHook];
  const hasOriginCreatedHook = originCreatedHook && isFunction(originCreatedHook);

  if (hasOriginCreatedHook) {
    createdHookOptions[createdHook] = function () {
      if (isApp) {
        observe(options.globalData);
      }
      if (globalWatch) {
        let globalData;
        if (!isApp) {
          globalData = getApp().globalData;
        } else {
          globalData = options.globalData;
        }
        initWatch(this, globalData, globalWatch, true);
      }
      if (watch) {
        const data = this.data;
        observe(data);
        initWatch(this, data, watch, false);
      }
      return originCreatedHook.apply(this, arguments)
    };
  } else {
    const hookName = globalWatch ? 'globalWatch' : 'watch';
    warnMissCreaedHooks(hookName, createdHooks);
  }
  return options
}

const createdHooks = ['onLaunch'];
const destroyedHooks = [];
const originApp = App;

var appInstaller = {
  install() {
    if (this.installed) {
      return
    }
    this.installed = true;
    App = function (options) {
      options = mergeOptions(
        options,
        createdHooks,
        destroyedHooks,
        true,
        false,
      );
      originApp(options);
    };
  }
};

const createdHooks$1 = ['onLoad'];
const destroyedHooks$1 = ['onUnload'];
const originPage = Page;

var pageInstaller = {
  install() {
    if (this.installed) {
      return
    }
    this.installed = true;
    Page = function (options) {
      options = mergeOptions(
        options,
        createdHooks$1,
        destroyedHooks$1,
        false,
        false,
      );
      originPage(options);
    };
  }
};

const createdHooks$2 = ['created', 'attached', 'ready'];
const destroyedHooks$2 = ['onUnload'];
const originComponent = Component;

var componentInstaller = {
  install() {
    if (this.installed) {
      return
    }
    this.installed = true;
    Component = function (options) {
      options = mergeOptions(
        options,
        createdHooks$2,
        destroyedHooks$2,
        false,
        true,
      );
      originComponent(options);
    };
  }
};

const plugin = {
  install() {
    if (this.installed) {
      return
    }
    this.installed = true;
    appInstaller.install();
    pageInstaller.install();
    componentInstaller.install();
  },
  verson: '1.0.9'
};

plugin.install();

export default plugin;
