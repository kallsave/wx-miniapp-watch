import { observe } from '../observer/index'
import { createWatcher } from '../observer/watcher'
import {
  isPlainObject,
  isFunction,
  isArray,
  isEmptyObject
} from './lang'

function watchData(vm, data, watcher) {
  if (!isPlainObject(data)) {
    return
  }
  observe(data)
  for (const key in watcher) {
    const item = watcher[key]
    if (isFunction(item)) {
      createWatcher(data, key, item.bind(vm), false, false)
    } else if (isPlainObject(item) && isFunction(item.handler)) {
      if (item.immediate) {
        item.handler.call(vm, data[key])
      }
      createWatcher(data, key, item.handler.bind(vm), item.deep, item.sync)
    }
  }
}

function getCreatedHook(options, createdHooks) {
  for (let i = 0; i < createdHooks.length; i++) {
    const hook = createdHooks[i]
    if (options[hook]) {
      return hook
    }
  }
}

export function mergeOptions(
  options,
  createdHooks,
  destroyedHooks, 
  { watch, globalWatch } = { watch: 'watch', globalWatch: 'globalWatch' },
  isApp,
  isComponent,
) {
  const watcher = options[watch]
  const globalWatcher = options[globalWatch]
  const hasWatchHook = watcher && isPlainObject(watcher)
  const hasGlobalWatchHook = globalWatcher && isPlainObject(globalWatcher)

  if (!hasWatchHook && !hasGlobalWatchHook) {
    return options
  }

  let createdHookOptions
  let createdHook
  let originCreatedHook

  if (!isComponent) {
    createdHook = getCreatedHook(options, createdHooks)
    createdHookOptions = options
  } else {
    const lifetimes = options.lifetimes
    if (!lifetimes || isEmptyObject(lifetimes)) {
      createdHook = getCreatedHook(options, createdHooks)
      createdHookOptions = options
    } else {
      const assignOptions = {
        ...options,
        ...lifetimes,
      }
      createdHook = getCreatedHook(assignOptions, createdHooks)
      createdHookOptions = lifetimes[createdHook] ? lifetimes : options
    }
  }

  originCreatedHook = createdHookOptions[createdHook]

  const hasOriginCreatedHook = originCreatedHook && isFunction(originCreatedHook)

  if (hasOriginCreatedHook) {
    createdHookOptions[createdHook] = function () {
      if (hasWatchHook) {
        const data = this.data
        watchData(this, data, watcher)
      }
      if (hasGlobalWatchHook) {
        let globalData
        if (!isApp) {
          globalData = getApp().globalData
        } else {
          globalData = options.globalData
        }
        watchData(this, globalData, globalWatcher)
      }
      return originCreatedHook.apply(this, arguments)
    }
  } else {
    const hookName = hasWatchHook ? watch : globalWatch
    console.warn(`${hookName} hook need ${createdHooks.join(' or ')} lifecycle function hook`)
  }
  return options
}
