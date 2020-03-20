import { mergeOptions } from '../util/merge-options'

const createdTimes = ['onLoad']
const destroyedTimes = ['onUnload']
const originPage = Page

export default {
  install() {
    if (this.installed) {
      return
    }
    this.installed = true
    Page = function (options) {
      options = mergeOptions(options, createdTimes, destroyedTimes)
      originPage(options)
    }
  }
}
