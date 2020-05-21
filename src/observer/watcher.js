import Dep, { pushTarget, popTarget } from './dep'
import { traverse } from './traverse'
import { isObject, noop } from '../util/lang'

export default class Watcher {
  constructor(vm, expOrFn, cb, options = {}) {
    this.vm = vm
    this.cb = cb
    this.deep = !!options.deep
    this.user = !!options.user
    this.lazy = !!options.lazy
    this.sync = !!options.sync
    this.dirty = this.lazy
    this.depMap = {}
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = this.parsePath(expOrFn)
      if (!this.getter) {
        this.getter = noop
      }
    }
    this.value = this.lazy
      ? undefined
      : this.get()
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
  update() {
    if (this.lazy) {
      this.dirty = true
    } else {
      this.run()
    }
  }
  run() {
    const newVal = this.get()
    const oldVal = this.value
    if (newVal !== oldVal || isObject(newVal) || this.deep) {
      this.value = newVal
      if (this.sync) {
        this.cb.call(this.vm, newVal, oldVal)
      } else {
        setTimeout(() => {
          this.cb.call(this.vm, newVal, oldVal)
        }, 1000 / 30)
      }
    }
  }
  evaluate() {
    this.value = this.get()
    this.dirty = false
  }
  depend() {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }
}
