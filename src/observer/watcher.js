import Dep, { pushTarget, popTarget } from './dep.js'
import { traverse } from './traverse.js'

// watch回调
export class Watcher {
  constructor(vm, expOrFn, cb, deep) {
    this.vm = vm
    this.cb = cb
    this.deep = deep
    this.depMap = {}
    this.getter = this.parsePath(expOrFn)
    this.value = this.get()
  }
  parsePath(exp) {
    if (/[^\w.$]/.test(exp)) {
      return
    }
    const exps = exp.split('.')
    // 递归了点语法,拿到位于最后的属性值
    return function (obj) {
      for (let i = 0, len = exps.length; i < len; i++) {
        if (!obj) {
          return
        }
        // 申明的时候触发了getter
        obj = obj[exps[i]]
      }
      return obj
    }
  }
  // 得到解析式的值
  get() {
    // 因为getter回调无法传参,Dep.target这个全局变量起到指针传参的作用
    pushTarget(this)
    const value = this.getter.call(this.vm, this.vm)
    // 对象的深度属性变化时,也会被收集到这个依赖里
    if (this.deep) {
      traverse(value)
    }
    popTarget(null)
    return value
  }
  addDep(dep) {
    // dep存watch之前要判断watcher实例里面是否已经存在了,不然在解析值的时候会重复添加依赖
    if (!this.depMap.hasOwnProperty(dep.id)) {
      // 存watcher
      dep.addSub(this)
      this.depMap[dep.id] = dep
    }
  }
  update() {
    const newVal = this.get()
    const oldVal = this.value
    this.value = newVal
    this.cb.call(this.vm, newVal, oldVal)
  }
}

export function createWatcher(data, expOrFn, fn, deep) {
  return new Watcher(data, expOrFn, fn, deep)
}

export function createAsynWatcher(data, expOrFn, fn, deep) {
  return new Watcher(data, expOrFn, function () {
    const args = arguments
    setTimeout(() => {
      fn(...args)
    }, 0)
  }, deep)
}
