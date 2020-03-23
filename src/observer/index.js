import { def, isArray } from '../util/lang'
import { arrayMethods, methodsToPatch } from './array'
import Dep from './dep'

// 判断当前环境是否可以使用 __proto__
const hasProto = '__proto__' in {}

// 监听对象(非数组)
function defineReactive(obj, key, val, shallow) {
  // 如果属性不可修改
  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }
  if (arguments.length === 2) {
    val = obj[key]
  }
  // 这个Dep是给val属性的,所有类型的val都会有这种Dep,属于指针类收集器
  const dep = new Dep()
  // 深度监听
  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          // 数组指针变化用到上一个dep
          // 数组元素变化用到childOb.dep
          childOb.dep.depend()
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
      const oldVal = val
      val = newVal
      // 属性更新后重新绑定
      childOb = !shallow && observe(newVal)
      dep.notify()
    }
  })
}

// 数组和对象的监听器
class Observer {
  constructor(value) {
    this.value = value
    // 这个Dep是订阅数组元素变化以及对象深度监听属性用的
    this.dep = new Dep()

    // 定义对象和数组属性__ob__属性,并且不可遍历,在别的回调中用
    def(value, '__ob__', this)

    if (isArray(value)) {
      // 如果支持__proto__,把原型赋给arrayMethods
      if (hasProto) {
        // 数组实例调用的是arrayMethods上的方法
        /* eslint no-proto: "off" */
        value.__proto__ = arrayMethods
      } else {
        for (let i = 0; i < methodsToPatch.length; i++) {
          const methodKey = methodsToPatch[i]
          const method = arrayMethods[methodKey]
          // 重写方法
          def(value, methodKey, method)
        }
      }
      this.observeArray(value)
    } else {
      // 对象的响应式
      this.walk(value)
    }
  }
  walk(obj) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      defineReactive(obj, key, obj[key])
    }
  }
  observeArray(arr) {
    for (let i = 0, l = arr.length; i < l; i++) {
      const item = arr[i]
      observe(item)
    }
  }
}

// 使得一个数据变成可监听的
// 返回一个Observer类(监听器),可以对数组和对象监听
export function observe(value) {
  if (!value || typeof value !== 'object') {
    return
  }
  const ob = new Observer(value)
  return ob
}
