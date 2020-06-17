import appInstaller from './construction/app'
import pageInstaller from './construction/page'
import componentInstaller from './construction/component'

const plugin = {
  install() {
    if (this.installed) {
      return
    }
    this.installed = true
    appInstaller.install()
    pageInstaller.install()
    componentInstaller.install()
  },
  verson: '1.0.8'
}

plugin.install()

export default plugin
