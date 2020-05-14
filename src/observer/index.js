import { def, isArray } from '../util/lang'
import { arrayMethods, methodsToPatch } from './array'
import Dep from './dep'

const hasProto = '__proto__' in {}

function defineReactive(obj, key, val, shallow) {
  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }
  if (arguments.length === 2) {
    val = obj[key]
  }
  const dep = new Dep()
  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
        }
      }
      return val
    },
    set(newVal) {
      /* eslint no-self-compare: "off" */
      if (newVal === val || (newVal !== newVal && val !== val)) {
        return
      }
      const oldVal = val
      val = newVal
      childOb = !shallow && observe(newVal)
      dep.notify()
    }
  })
}

class Observer {
  constructor(value) {
    this.value = value
    this.dep = new Dep()
    def(value, '__ob__', this)

    if (isArray(value)) {
      if (hasProto) {
        /* eslint no-proto: "off" */
        value.__proto__ = arrayMethods
      } else {
        for (let i = 0; i < methodsToPatch.length; i++) {
          const methodKey = methodsToPatch[i]
          const method = arrayMethods[methodKey]
          def(value, methodKey, method)
        }
      }
      this.observeArray(value)
    } else {
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

export function observe(value) {
  if (!value || typeof value !== 'object') {
    return
  }
  const ob = new Observer(value)
  return ob
}
