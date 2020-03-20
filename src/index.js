import appWatchInstaller from './construction/app'
import pageWatchInstaller from './construction/page'
import componentWatchInstaller from './construction/component'

const wxWatch = {
  install() {
    if (this.installed) {
      return
    }
    this.installed = true
    appWatchInstaller.install()
    pageWatchInstaller.install()
    componentWatchInstaller.install()
  },
  verson: '0.0.1'
}

export default wxWatch

wxWatch.install()
