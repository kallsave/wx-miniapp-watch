import { mergeOptions } from '../util/merge-options'

const createdHooks = ['onLoad']
const destroyedHooks = ['onUnload']
const originPage = Page

export default {
  install() {
    if (this.installed) {
      return
    }
    this.installed = true
    Page = function (options) {
      options = mergeOptions(
        options,
        createdHooks,
        destroyedHooks,
        { watch: 'watch', globalWatch: 'globalWatch' },
        false,
        false,
      )
      originPage(options)
    }
  }
}
