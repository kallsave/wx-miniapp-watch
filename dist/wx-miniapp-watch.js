/*!
 * wx-miniapp-watch.js v1.0.3
 * (c) 2019-2020 kallsave
 * Released under the MIT License.
 */
const _toString = Object.prototype.toString;

function toRawType(value) {
  return _toString.call(value).slice(8, -1)
}

function isObject(value) {
  return value !== null && typeof value === 'object'
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
    this.subs.forEach(sub => {
      sub.update();
    });
  }
  depend() {
    Dep.target.addDep(this);
  }
  removeSub(sub) {
    remove(this.subs, sub);
  }
}

Dep.target = null;

function pushTarget(target) {
  Dep.target = target;
}

function popTarget() {
  Dep.target = null;
}

const hasProto = '__proto__' in {};

function defineReactive(obj, key, val, shallow) {
  const property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return
  }
  if (arguments.length === 2) {
    val = obj[key];
  }
  const dep = new Dep();
  let childOb = !shallow && observe(val);
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      if (Dep.target) {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
        }
      }
      return val
    },
    set(newVal) {
      /* eslint no-self-compare: "off" */
      if (newVal === val || (newVal !== newVal && val !== val)) {
        return
      }
      val = newVal;
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
  constructor(vm, expOrFn, cb, deep, sync) {
    this.vm = vm;
    this.cb = cb;
    this.deep = deep;
    this.sync = sync;
    this.depMap = {};
    this.deps = [];
    this.newDeps = [];
    this.depIds = new Set();
    this.newDepIds = new Set();
    this.getter = this.parsePath(expOrFn);
    this.value = this.get();
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
  update() {
    const newVal = this.get();
    const oldVal = this.value;
    if (newVal !== oldVal || isObject(newVal) || this.deep) {
      this.value = newVal;
      if (this.sync) {
        this.cb.call(this.vm, newVal, oldVal);
      } else {
        setTimeout(() => {
          this.cb.call(this.vm, newVal, oldVal);
        }, 0);
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
}

function createWatcher(data, expOrFn, fn, deep, sync) {
  return new Watcher(data, expOrFn, fn, deep, sync)
}

let hasObserveGlobalData = false;

function watchData(vm, data, watcher, hookName, isGlobalWatch) {
  if (!isPlainObject(data)) {
    return
  }

  if (!hasObserveGlobalData || !isGlobalWatch) {
    if (isGlobalWatch) {
      hasObserveGlobalData = true;
    }
    observe(data);
  }
  
  for (const key in watcher) {
    const item = watcher[key];
    const value = data[key];
    if (isFunction(item)) {
      if (value === undefined) {
        warnMissMountedData(hookName, isGlobalWatch, key);
        continue
      }
      createWatcher(data, key, item.bind(vm), false, false);
    } else if (isPlainObject(item) && isFunction(item.handler)) {
      if (value === undefined) {
        warnMissMountedData(hookName, isGlobalWatch, key);
        continue
      }
      if (item.immediate) {
        item.handler.call(vm, data[key]);
      }
      createWatcher(data, key, item.handler.bind(vm), item.deep, item.sync);
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

function warnMissMountedData(hookName, isGlobalWatch, key) {
  const mountedData = isGlobalWatch ? 'app.globalData' : 'data';
  console.warn(`${hookName} hook warn: the key '${key}' have to mounte in ${mountedData} to be watch`);
}

function warnMissCreaedHooks(hookName, createdHooks) {
  console.warn(`${hookName} hook need ${createdHooks.join(' or ')} lifecycle function hook`);
}

function mergeOptions(
  options,
  createdHooks,
  destroyedHooks, 
  { watch, globalWatch } = { watch: 'watch', globalWatch: 'globalWatch' },
  isApp,
  isComponent,
) {
  const watcher = options[watch];
  const globalWatcher = options[globalWatch];
  const hasWatchHook = watcher && isPlainObject(watcher);
  const hasGlobalWatchHook = globalWatcher && isPlainObject(globalWatcher);

  if (!hasWatchHook && !hasGlobalWatchHook) {
    return options
  }

  let createdHookOptions;
  let createdHook;
  let originCreatedHook;

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

  originCreatedHook = createdHookOptions[createdHook];

  const hasOriginCreatedHook = originCreatedHook && isFunction(originCreatedHook);

  if (hasOriginCreatedHook) {
    createdHookOptions[createdHook] = function () {
      if (hasWatchHook) {
        const data = this.data;
        watchData(this, data, watcher, watch, false);
      }
      if (hasGlobalWatchHook) {
        let globalData;
        if (!isApp) {
          globalData = getApp().globalData;
        } else {
          globalData = options.globalData;
        }
        watchData(this, globalData, globalWatcher, globalWatch, true);
      }
      return originCreatedHook.apply(this, arguments)
    };
  } else {
    const hookName = hasWatchHook ? watch : globalWatch;
    warnMissCreaedHooks(hookName, createdHooks);
  }
  return options
}

const createdHooks = ['onLaunch'];
const destroyedHooks = [];
const originApp = App;

var appWatchInstaller = {
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
        { watch: 'watch', globalWatch: 'globalWatch' },
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

var pageWatchInstaller = {
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
        { watch: 'watch', globalWatch: 'globalWatch' },
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

var componentWatchInstaller = {
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
        { watch: 'watch', globalWatch: 'globalWatch' },
        false,
        true,
      );
      originComponent(options);
    };
  }
};

const wxWatch = {
  install() {
    if (this.installed) {
      return
    }
    this.installed = true;
    appWatchInstaller.install();
    pageWatchInstaller.install();
    componentWatchInstaller.install();
  },
  verson: '1.0.3'
};

wxWatch.install();

export default wxWatch;
