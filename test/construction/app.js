import {
  mergeOptions,
} from '../../src/util/merge-options'

function App(options) {
  options.onLaunch()
  options.onShow()
  return options
}

const createdHooks = ['onLaunch']
const destroyedHooks = []
const originApp = App

App = function (options) {
  options = mergeOptions(
    options,
    createdHooks,
    destroyedHooks,
    true,
    false,
  )
  return originApp(options)
}

export const expectData = {
  hasRegister: false,
  number: 0,
  count: 0,
  age: 0,
}

const app = App({
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
  onLaunch() {
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
})

global.getApp = function () {
  return app
}

export default app
