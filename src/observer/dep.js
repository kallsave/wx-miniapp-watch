import { remove } from '../util/lang'

let uid = 0

// 属性的watch依赖收集器
export default class Dep {
  constructor() {
    this.id = uid++
    this.subs = []
  }
  // 一个属性每有一个watch就push一个sub
  addSub(sub) {
    this.subs.push(sub)
  }
  // 发布
  notify() {
    this.subs.forEach(sub => {
      sub.update()
    })
  }
  // 添加依赖
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
