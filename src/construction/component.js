import { mergeOptions } from '../util/merge-options'

const createdTimes = ['created', 'attached', 'ready']
const destroyedTimes = ['onUnload']
const originComponent = Component

export default {
  install() {
    if (this.installed) {
      return
    }
    this.installed = true
    Component = function (options) {
      options = mergeOptions(options, createdTimes, destroyedTimes)
      originComponent(options)
    }
  }
}
