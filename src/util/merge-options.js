

import { observe } from '../observer/index.js'
import { createAsynWatcher } from '../observer/watcher.js'
import { isPlainObject, isFunction, isArray } from './lang.js'

function watchData(data, watcher) {
  observe(data)
  for (const key in watcher) {
    const item = watcher[key]
    if (isFunction(item)) {
      createAsynWatcher(data, key, item.bind(this))
    } else if (isPlainObject(item) && isFunction(item.handler)) {
      if (item.immediate) {
        item.handler(data[key])
      }
      createAsynWatcher(data, key, item.handler.bind(this), item.deep)
    }
  }
}

export function mergeOptions(options, createdTimes, destroyedTimes, { watch, globalWatch } = { watch: 'watch', globalWatch: 'globalWatch' }) {
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
          watchData(data, watcher)
        }
      }
      if (globalWatch) {
        const globalWatcher = options[globalWatch]
        if (isPlainObject(globalWatcher)) {
          try {
            const globalData = getApp().globalData
            watchData(globalData, globalWatcher)
          } catch (err) {
            console.log(err)
          }
        }
      }
      return originCreatedTime.apply(this, arguments)
    }
  }
  return options
}
