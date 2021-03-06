import { mergeOptions } from '../util/merge-options'

const createdHooks = ['onLaunch']
const destroyedHooks = []
const originApp = App

export default {
  install() {
    if (this.installed) {
      return
    }
    this.installed = true
    App = function (options) {
      options = mergeOptions(
        options,
        createdHooks,
        destroyedHooks,
        true,
        false,
      )
      originApp(options)
    }
  }
}
