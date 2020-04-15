

import { observe } from '../observer/index.js'
import { createAsynWatcher } from '../observer/watcher.js'
import { isPlainObject, isFunction, isArray } from './lang.js'

function watchData(vm, data, watcher) {
  if (!isPlainObject(data)) {
    return
  }
  observe(data)
  for (const key in watcher) {
    const item = watcher[key]
    if (isFunction(item)) {
      createAsynWatcher(data, key, item.bind(vm))
    } else if (isPlainObject(item) && isFunction(item.handler)) {
      if (item.immediate) {
        item.handler.call(vm, data[key])
      }
      createAsynWatcher(data, key, item.handler.bind(vm), item.deep)
    }
  }
}

export function mergeOptions(options, createdTimes, destroyedTimes, { watch, globalWatch } = { watch: 'watch', globalWatch: 'globalWatch' }, isApp) {
  let createdTime
  for (let i = 0; i < createdTimes.length; i++) {
    const item = createdTimes[i]
    if (options[item]) {
      createdTime = item
      break
    }
  }
  if (createdTime && isFunction(options[createdTime])) {
    const originCreatedTime = options[createdTime]
    options[createdTime] = function () {
      if (watch) {
        const watcher = options[watch]
        if (isPlainObject(watcher)) {
          const data = this.data
          watchData(this, data, watcher)
        }
      }
      if (globalWatch) {
        const globalWatcher = options[globalWatch]
        if (isPlainObject(globalWatcher)) {
          let globalData
          if (!isApp) {
            watchData(this, globalData, globalWatcher)
          } else {
            globalData = options.globalData
          }
          watchData(this, globalData, globalWatcher)
        }
      }
      return originCreatedTime.apply(this, arguments)
    }
  }
  return options
}
