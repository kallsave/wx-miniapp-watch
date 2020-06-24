import './app'
import componentWatchInstaller from '../../src/construction/component'

componentWatchInstaller.install()

const expectData = {
  hasRegister: false,
  hasLogin: false,
  number: 0,
  count: 0,
  age: 0,
  runCount: 0,
}

const options = {
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
  attached() {
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
  methods: {
    numberChangeHanlder() {
      expectData.number++
      this.runCount()
    },
    runCount() {
      expectData.runCount++
    }
  },
}

Component(options)

export default expectData
