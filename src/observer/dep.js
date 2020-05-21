import { remove } from '../util/lang'

let uid = 0

export default class Dep {
  constructor() {
    this.id = uid++
    this.subs = []
  }
  addSub(sub) {
    this.subs.push(sub)
  }
  notify() {
    const subs = this.subs
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }
  removeSub(sub) {
    remove(this.subs, sub)
  }
}

Dep.target = null
const targetStack = []

export function pushTarget(target) {
  targetStack.push(target)
  Dep.target = target
}

export function popTarget() {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
