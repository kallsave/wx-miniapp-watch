/*!
 * wx-miniapp-watch.js v0.0.5
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

// 数组原型
const arrayProto = Array.prototype;

// 继承一层数组原型,是个新类
const arrayMethods = Object.create(arrayProto);

// 这些数组的方法会改变数组的元素,需要做代理
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
  // 定义数组代理层方法
  def(arrayMethods, method, function () {
    const args = [];
    Array.prototype.push.apply(args, arguments);

    // 原数组执行原来的操作
    const result = original.apply(this, args);

    // 拿到收集元素的ob
    const ob = this.__ob__;

    // 存放新增数组元素
    let inserted;
    // 为add 进array中的元素进行observe
    switch (method) {
      case 'push':
        inserted = args;
        break
      case 'unshift':
        inserted = args;
        break
      case 'splice':
        // 第三个参数开始才是新增元素
        inserted = args.slice(2);
        break
    }
    if (inserted) {
      // 动态去添加新增元素的observe
      ob.observeArray(inserted);
    }
    // 数组元素改变触发数组的发布消息
    ob.dep.notify();
    return result
  });
});

let uid = 0;

// 属性的watch依赖收集器
class Dep {
  constructor() {
    this.id = uid++;
    this.subs = [];
  }
  // 一个属性每有一个watch就push一个sub
  addSub(sub) {
    this.subs.push(sub);
  }
  // 发布
  notify() {
    this.subs.forEach(sub => {
      sub.update();
    });
  }
  // 添加依赖
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

// 判断当前环境是否可以使用 __proto__
const hasProto = '__proto__' in {};

// 监听对象(非数组)
function defineReactive(obj, key, val, shallow) {
  // 如果属性不可修改
  const property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return
  }
  if (arguments.length === 2) {
    val = obj[key];
  }
  // 这个Dep是给val属性的,所有类型的val都会有这种Dep,属于指针类收集器
  const dep = new Dep();
  // 深度监听
  let childOb = !shallow && observe(val);
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      if (Dep.target) {
        dep.depend();
        if (childOb) {
          // 数组指针变化用到上一个dep
          // 数组元素变化用到childOb.dep
          childOb.dep.depend();
        }
      }
      return val
    },
    set(newVal) {
      // NaN === NaN为false
      /* eslint no-self-compare: "off" */
      if (newVal === val || (newVal !== newVal && val !== val)) {
        return
      }
      val = newVal;
      // 属性更新后重新绑定
      childOb = !shallow && observe(newVal);
      dep.notify();
    }
  });
}

// 数组和对象的监听器
class Observer {
  constructor(value) {
    this.value = value;
    // 这个Dep是订阅数组元素变化以及对象深度监听属性用的
    this.dep = new Dep();

    // 定义对象和数组属性__ob__属性,并且不可遍历,在别的回调中用
    def(value, '__ob__', this);

    if (isArray(value)) {
      // 如果支持__proto__,把原型赋给arrayMethods
      if (hasProto) {
        // 数组实例调用的是arrayMethods上的方法
        /* eslint no-proto: "off" */
        value.__proto__ = arrayMethods;
      } else {
        for (let i = 0; i < methodsToPatch.length; i++) {
          const methodKey = methodsToPatch[i];
          const method = arrayMethods[methodKey];
          // 重写方法
          def(value, methodKey, method);
        }
      }
      this.observeArray(value);
    } else {
      // 对象的响应式
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

// 使得一个数据变成可监听的
// 返回一个Observer类(监听器),可以对数组和对象监听
function observe(value) {
  if (!value || typeof value !== 'object') {
    return
  }
  const ob = new Observer(value);
  return ob
}

const seenObjects = new Set();

// 处理深度watch,属性下的属性变化,监听属性也能触发回调
function traverse(val) {
  _traverse(val, seenObjects);
  seenObjects.clear();
}

// 深度递归收集依赖
function _traverse(val, seen) {
  let i, keys;
  const isA = Array.isArray(val);
  if (!isA && !isObject(val)) {
    return
  }
  if (val.__ob__) {
    // 如果这个对象的属性的深度收集器的id已经存在,结束递归
    const depId = val.__ob__.dep.id;
    if (seen.has(depId)) {
      return
    }
    seen.add(depId);
  }
  if (isA) {
    i = val.length;
    while (i--) {
      // 触发getter
      _traverse(val[i], seen);
    }
  } else {
    keys = Object.keys(val);
    i = keys.length;
    while (i--) {
      // 触发getter
      _traverse(val[keys[i]], seen);
    }
  }
}

// watch回调
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
    // 递归了点语法,拿到位于最后的属性值
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
  // 得到解析式的值
  get() {
    // 因为getter回调无法传参,Dep.target这个全局变量起到指针传参的作用
    pushTarget(this);
    const value = this.getter.call(this.vm, this.vm);
    // 对象的深度属性变化时,也会被收集到这个依赖里
    if (this.deep) {
      traverse(value);
    }
    popTarget();
    this.cleanupDeps();
    return value
  }
  addDep(dep) {
    const id = dep.id;
    // dep存watch之前要判断watcher实例里面是否已经存在了,不然在解析值的时候会重复添加依赖
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
    // 如果属性是引用类型,被替换了应该取消之前引用的收集依赖并且把新的依赖重新收集
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

function createAsynWatcher(data, expOrFn, fn, deep) {
  return new Watcher(data, expOrFn, fn, deep)
}

function watchData(vm, data, watcher) {
  if (!isPlainObject(data)) {
    return
  }
  observe(data);
  for (const key in watcher) {
    const item = watcher[key];
    if (isFunction(item)) {
      createAsynWatcher(data, key, item.bind(vm));
    } else if (isPlainObject(item) && isFunction(item.handler)) {
      if (item.immediate) {
        item.handler.call(vm, data[key]);
      }
      createAsynWatcher(data, key, item.handler.bind(vm), item.deep);
    }
  }
}

function mergeOptions(options, createdTimes, destroyedTimes, { watch, globalWatch } = { watch: 'watch', globalWatch: 'globalWatch' }, isApp) {
  let createdTime;
  for (let i = 0; i < createdTimes.length; i++) {
    const item = createdTimes[i];
    if (options[item]) {
      createdTime = item;
      break
    }
  }
  if (createdTime && isFunction(options[createdTime])) {
    const originCreatedTime = options[createdTime];
    options[createdTime] = function () {
      if (watch) {
        const watcher = options[watch];
        if (isPlainObject(watcher)) {
          const data = this.data;
          watchData(this, data, watcher);
        }
      }
      if (globalWatch) {
        const globalWatcher = options[globalWatch];
        if (isPlainObject(globalWatcher)) {
          let globalData;
          if (!isApp) {
            watchData(this, globalData, globalWatcher);
          } else {
            globalData = options.globalData;
          }
          watchData(this, globalData, globalWatcher);
        }
      }
      return originCreatedTime.apply(this, arguments)
    };
  }
  return options
}

const createdTimes = ['onLaunch'];
const destroyedTimes = [];
const originApp = App;

var appWatchInstaller = {
  install() {
    if (this.installed) {
      return
    }
    this.installed = true;
    App = function (options) {
      options = mergeOptions(options, createdTimes, destroyedTimes, { watch: 'watch' });
      originApp(options);
    };
  }
};

const createdTimes$1 = ['onLoad'];
const originPage = Page;

var pageWatchInstaller = {
  install() {
    if (this.installed) {
      return
    }
    this.installed = true;
    Page = function (options) {
      options = mergeOptions(options, createdTimes$1);
      originPage(options);
    };
  }
};

const createdTimes$2 = ['created', 'attached', 'ready'];
const originComponent = Component;

var componentWatchInstaller = {
  install() {
    if (this.installed) {
      return
    }
    this.installed = true;
    Component = function (options) {
      options = mergeOptions(options, createdTimes$2);
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
  verson: '0.0.5'
};

wxWatch.install();

export default wxWatch;
