import { mergeOptions } from '../util/merge-options'

const createdHooks = ['created', 'attached', 'ready']
const destroyedHooks = ['onUnload']
const originComponent = Component

export default {
  install() {
    if (this.installed) {
      return
    }
    this.installed = true
    Component = function (options) {
      options = mergeOptions(
        options,
        createdHooks,
        destroyedHooks,
        false,
        true,
      )
      originComponent(options)
    }
  }
}
