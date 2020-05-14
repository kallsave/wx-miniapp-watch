import Dep, { pushTarget, popTarget } from './dep'
import { traverse } from './traverse'
import { isObject } from '../util/lang'

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
  get() {
    pushTarget(this)
    const value = this.getter.call(this.vm, this.vm)
    if (this.deep) {
      traverse(value)
    }
    popTarget()
    this.cleanupDeps()
    return value
  }
  addDep(dep) {
    const id = dep.id
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

export function createWatcher(data, expOrFn, fn, deep, sync) {
  return new Watcher(data, expOrFn, fn, deep, sync)
}
