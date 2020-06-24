import '../config/index'
import appWatchInstaller from '../../src/construction/app'

appWatchInstaller.install()

const expectData = {
  hasRegister: false,
  hasLogin: false,
  number: 0,
  count: 0,
  age: 0,
  runCount: 0,
}

const options = {
  globalData: {
    hasRegister: expectData.hasRegister,
    hasLogin: expectData.hasLogin,
  },
  data: {
    number: expectData.number,
    count: expectData.count,
    person: {
      age: expectData.age,
    }
  },
  onLaunch() {
    this.data.number++
    this.data.count++
    this.data.person.age++
    this.$watch('number', () => {
      expectData.number++
      this.runCount()
    }, {
      immediate: true
    })
    this.$globalWatch('hasLogin', (newVal) => {
      expectData.hasLogin = newVal
      this.runCount()
    }, {
      immediate: true
    })
  },
  onShow() {
    Promise.resolve().then(() => {
      this.globalData.hasRegister = true
      this.globalData.hasLogin = true
    })
    this.data.number++
    this.data.count++
    this.data.person.age++
  },
  globalWatch: {
    hasRegister: {
      handler(newVal) {
        expectData.hasRegister = newVal
        this.runCount()
      },
      immediate: true
    }
  },
  watch: {
    number: 'numberChangeHanlder',
    count(newVal) {
      expectData.count++
      this.runCount()
    },
    person: {
      handler(newVal) {
        expectData.age++
        this.runCount()
      },
      immediate: true,
      deep: true,
    },
  },
  numberChangeHanlder() {
    expectData.number++
    this.runCount()
  },
  runCount() {
    expectData.runCount++
  }
}

App(options)

global.getApp = function () {
  return options
}

export default expectData
