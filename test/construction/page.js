import {
  mergeOptions,
} from '../../src/util/merge-options'

import {
  getApp
} from './app'

function Page(options) {
  options.onLoad()
  options.onShow()
  return options
}

const createdHooks = ['onLoad']
const destroyedHooks = ['onUnload']
const originPage = Page

Page = function (options) {
  options = mergeOptions(
    options,
    createdHooks,
    destroyedHooks,
    false,
    false,
  )
  return originPage(options)
}

export const expectData = {
  hasRegister: false,
  number: 0,
  count: 0,
  age: 0,
}

const page = Page({
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
})

export default page
