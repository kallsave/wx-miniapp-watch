import { observe } from '../observer/index'
import { createWatcher } from '../observer/watcher'
import {
  isPlainObject,
  isFunction,
  isArray,
  isEmptyObject
} from './lang'

let hasObserveGlobalData = false

function watchData(vm, data, watcher, hookName, isGlobalWatch) {
  if (!isPlainObject(data)) {
    return
  }

  if (!hasObserveGlobalData || !isGlobalWatch) {
    if (isGlobalWatch) {
      hasObserveGlobalData = true
    }
    observe(data)
  }
  
  for (const key in watcher) {
    const item = watcher[key]
    const value = data[key]
    if (isFunction(item)) {
      if (value === undefined) {
        warnMissMountedData(hookName, isGlobalWatch, key)
        continue
      }
      createWatcher(data, key, item.bind(vm), false, false)
    } else if (isPlainObject(item) && isFunction(item.handler)) {
      if (value === undefined) {
        warnMissMountedData(hookName, isGlobalWatch, key)
        continue
      }
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

function warnMissMountedData(hookName, isGlobalWatch, key) {
  const mountedData = isGlobalWatch ? 'app.globalData' : 'data'
  console.warn(`${hookName} hook warn: the key '${key}' have to mounte in ${mountedData} to be watch`)
}

function warnMissCreaedHooks(hookName, createdHooks) {
  console.warn(`${hookName} hook need ${createdHooks.join(' or ')} lifecycle function hook`)
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
        watchData(this, data, watcher, watch, false)
      }
      if (hasGlobalWatchHook) {
        let globalData
        if (!isApp) {
          globalData = getApp().globalData
        } else {
          globalData = options.globalData
        }
        watchData(this, globalData, globalWatcher, globalWatch, true)
      }
      return originCreatedHook.apply(this, arguments)
    }
  } else {
    const hookName = hasWatchHook ? watch : globalWatch
    warnMissCreaedHooks(hookName, createdHooks)
  }
  return options
}
