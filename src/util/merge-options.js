import { observe } from '../observer/index'
import Watcher from '../observer/watcher'

import {
  isPlainObject,
  isFunction,
  isArray,
  isEmptyObject,
  isString,
  hasOwn,
} from './lang'

function createWatcher(vm, data, expOrFn, handler, options = {}) {
  if (isPlainObject(handler)) {
    options = handler
    handler = handler.handler
  } else if (isString(handler)) {
    handler = vm[handler]
  }
  const watcher = new Watcher(data, expOrFn, handler.bind(vm), options)
  if (options.immediate) {
    handler.call(vm, watcher.value)
  }
}

function createWatchApi(vm, data, isGlobalWatch) {
  if (!isPlainObject(data)) {
    return
  }
  const apiName = isGlobalWatch ? '$globalWatch' : '$watch'
  vm[apiName] = function (expOrFn, handler, options) {
    createWatcher(vm, data, expOrFn, handler, options)
  }
}

function initWatch(vm, data, watch, isGlobalWatch) {
  if (!isPlainObject(data)) {
    return
  }
  for (const key in watch) {
    const handler = watch[key]
    if (isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, data, key, handler[i])
      }
    } else {
      createWatcher(vm, data, key, handler)
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

function getInitHook(options, createdHooks, isComponent) {
  let createdHookOptions
  let createdHook

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
  return {
    createdHook,
    createdHookOptions,
  }
}

function warnMissCreaedHooks(hookName, createdHooks) {
  console.warn(`${hookName} hook warn: using ${hookName} hook need ${createdHooks.join(' or ')} lifecycle function hook`)
}

export function mergeOptions(
  options,
  createdHooks,
  destroyedHooks,
  isApp,
  isComponent,
) {
  const globalWatch = options.globalWatch
  const watch = options.watch

  if (!isApp && !globalWatch && !watch) {
    return options
  }

  const {
    createdHookOptions,
    createdHook,
  } = getInitHook(options, createdHooks, isComponent)

  const originCreatedHook = createdHookOptions[createdHook]
  const hasOriginCreatedHook = originCreatedHook && isFunction(originCreatedHook)

  if (hasOriginCreatedHook) {
    createdHookOptions[createdHook] = function () {
      if (isApp) {
        observe(options.globalData)
      }

      let globalData
      if (!isApp) {
        globalData = getApp().globalData
      } else {
        globalData = options.globalData
      }
      initWatch(this, globalData, globalWatch, true)
      createWatchApi(this, globalData, true)

      const data = this.data
      observe(data)
      initWatch(this, data, watch, false)
      createWatchApi(this, data, false)
      return originCreatedHook.apply(this, arguments)
    }
  } else {
    const hookName = globalWatch ? 'globalWatch' : 'watch'
    warnMissCreaedHooks(hookName, createdHooks)
  }
  return options
}
