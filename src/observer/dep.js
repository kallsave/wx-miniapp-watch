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
    this.subs.forEach(sub => {
      sub.update()
    })
  }
  depend() {
    Dep.target.addDep(this)
  }
  removeSub(sub) {
    remove(this.subs, sub)
  }
}

Dep.target = null

export function pushTarget(target) {
  Dep.target = target
}

export function popTarget() {
  Dep.target = null
}
