import {
  mergeOptions,
} from '../../src/util/merge-options'

import {
  getApp
} from './app'

function Component(options) {
  options.created()
  options.attached()
  return options
}

const createdHooks = ['created', 'attached', 'ready']
const destroyedHooks = ['onUnload']
const originComponent = Component

Component = function (options) {
  options = mergeOptions(
    options,
    createdHooks,
    destroyedHooks,
    false,
    false,
  )
  return originComponent(options)
}

export const expectData = {
  hasRegister: false,
  number: 0,
  count: 0,
  age: 0,
}

const component = Component({
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
})

export default component
