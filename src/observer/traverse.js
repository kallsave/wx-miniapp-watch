import { isObject } from '../util/lang'
const seenObjects = new Set()

// 处理深度watch,属性下的属性变化,监听属性也能触发回调
export function traverse(val) {
  _traverse(val, seenObjects)
  seenObjects.clear()
}

// 深度递归收集依赖
function _traverse(val, seen) {
  let i, keys
  const isA = Array.isArray(val)
  if (!isA && !isObject(val)) {
    return
  }
  if (val.__ob__) {
    // 如果这个对象的属性的深度收集器的id已经存在,结束递归
    const depId = val.__ob__.dep.id
    if (seen.has(depId)) {
      return
    }
    seen.add(depId)
  }
  if (isA) {
    i = val.length
    while (i--) {
      // 触发getter
      _traverse(val[i], seen)
    }
  } else {
    keys = Object.keys(val)
    i = keys.length
    while (i--) {
      // 触发getter
      _traverse(val[keys[i]], seen)
    }
  }
}
