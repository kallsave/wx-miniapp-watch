const _toString = Object.prototype.toString

export function toRawType(value) {
  return _toString.call(value).slice(8, -1)
}

export function isObject(value) {
  return value !== null && typeof value === 'object'
}

export function isArray(value) {
  return toRawType(value) === 'Array'
}

export function isPlainObject(value) {
  return toRawType(value) === 'Object'
}

export function isFunction(value) {
  return toRawType(value) === 'Function'
}

export function def(obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    configurable: true,
    writable: true
  })
}

export function remove(arr, item) {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}
