import Dep, { pushTarget, popTarget } from './dep'
import { traverse } from './traverse'
import { isObject } from '../util/lang'

// watch回调
export class Watcher {
  constructor(vm, expOrFn, cb, deep, sync) {
    this.vm = vm
    this.cb = cb
    this.deep = deep
    this.sync = sync
    this.depMap = {}
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
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
    popTarget()
    this.cleanupDeps()
    return value
  }
  addDep(dep) {
    const id = dep.id
    // dep存watch之前要判断watcher实例里面是否已经存在了,不然在解析值的时候会重复添加依赖
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        dep.addSub(this)
      }
    }
  }
  update() {
    const newVal = this.get()
    const oldVal = this.value
    if (newVal !== oldVal || isObject(newVal) || this.deep) {
      this.value = newVal
      if (this.sync) {
        this.cb.call(this.vm, newVal, oldVal)
      } else {
        setTimeout(() => {
          this.cb.call(this.vm, newVal, oldVal)
        }, 0)
      }
    }
  }
  cleanupDeps() {
    // 如果属性是引用类型,被替换了应该取消之前引用的收集依赖并且把新的依赖重新收集
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }
}

export function createWatcher(data, expOrFn, fn, deep) {
  return new Watcher(data, expOrFn, fn, deep, true)
}

export function createAsynWatcher(data, expOrFn, fn, deep) {
  return new Watcher(data, expOrFn, fn, deep)
}
