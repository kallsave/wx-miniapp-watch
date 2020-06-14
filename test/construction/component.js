import './app'
import componentWatchInstaller from '../../src/construction/component'

componentWatchInstaller.install()

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
  created() {
    this.data.number++
    this.data.count++
    this.data.person.age++
  },
  attached() {
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

Component(options)

export default expectData