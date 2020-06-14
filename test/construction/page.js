import './app'
import pageWatchInstaller from '../../src/construction/page'

pageWatchInstaller.install()

const expectData = {
  hasRegister: false,
  number: 0,
  count: 0,
  age: 0,
}

const options = {
  globalData: {
    hasRegister: expectData.hasRegister,
  },
  data: {
    number: expectData.number,
    count: expectData.count,
    person: {
      age: expectData.age,
    }
  },
  onLoad() {
    this.data.number++
    this.data.count++
    this.data.person.age++
  },
  onShow() {
    Promise.resolve().then(() => {
      this.globalData.hasRegister = true
    })
    this.data.number++
    this.data.count++
    this.data.person.age++
  },
  globalWatch: {
    hasRegister: {
      handler(newVal) {
        expectData.hasRegister = newVal
      },
      immediate: true
    }
  },
  watch: {
    number: 'numberChangeHanlder',
    count(newVal) {
      expectData.count++
    },
    person: {
      handler(newVal) {
        expectData.age++
      },
      immediate: true,
      deep: true,
    },
  },
  numberChangeHanlder() {
    expectData.number++
  }
}

Page(options)

export default expectData
