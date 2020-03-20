import { mergeOptions } from '../util/merge-options'

const createdTimes = ['onLaunch']
const destroyedTimes = []
const originApp = App

export default {
  install() {
    if (this.installed) {
      return
    }
    this.installed = true
    App = function (options) {
      options = mergeOptions(options, createdTimes, destroyedTimes, { watch: 'watch' })
      originApp(options)
    }
  }
}
