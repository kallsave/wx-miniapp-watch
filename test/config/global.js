const appInitHooks = ['onLaunch', 'onShow']

global.App = function (options) {
  const e = {}
  appInitHooks.forEach((item) => {
    const hook = options[item]
    hook && hook.call(options, e)
  })
  return options
}

const pageInitHooks = ['onLoad', 'onShow']

global.Page = function (options) {
  const e = {}
  options.onLoad(e)
  options.onShow()
  return options
}

const componentInitHooks = ['created', 'attached', 'ready']
const LIFETIMES = 'lifetimes'

global.Component = function (options) {
  const methods = options.methods || {}
  for (const key in methods) {
    options[key] = methods[key]
  }
  componentInitHooks.forEach((item) => {
    const lifetimes = options[LIFETIMES]
    const hook = lifetimes && lifetimes[item] ? lifetimes[item] : options[item]
    hook && hook.call(options)
  })
  return options
}
