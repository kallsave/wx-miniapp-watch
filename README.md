wx-miniapp-watch
========================================

功能
------------
给微信小程序带来
- 1.vue体验的watch语法(immediate, deep),给App,Page,Component函数增加watch的功能
- 2.全局状态管理globalWatch,给App,Page,Component函数增加监听app.globalData的globalWatch的功能

安装
------------
npm install wx-miniapp-watch --save

使用
------------
```javascript
// app.js
// 导入js给App,Page,Component增加扩展globalWatch,watch的扩展
import 'wx-miniapp-watch'
```

```javascript
// app.js
App({
  globalData: {
    test: 0
  },
  data: {
    count: 1
  },
  // 能监听在app.globalData申明的变量
  globalWatch: {
     // 监听app.globalData.test的变化
    test: {
      handler(newVal, oldVal) {
        console.log(newVal, oldVal)
      },
      // 第一次立刻执行
      immediate: true,
      // 是否是同步,默认异步
      sync: true,
      // 深度监听
      deep: true,
    }
  },
  // 能监听在data申明的变量
  watch: {
    // 监听data.count的变化
    count: {
      handler(newVal, oldVal) {
        console.log(newVal, oldVal)
      }
    }
  }
})
```

```javascript
// page.js
Page({
  data: {
    bar: 0,
    count: '',
    
  },
  // 能监听在app.globalData申明的变量
  globalWatch: {
    // 监听app.globalData.test的变化
    test: {
      handler(newVal, oldVal) {
        console.log(newVal, oldVal)
      },
      // 第一次立刻执行
      immediate: true,
      // 是否是同步,默认异步
      sync: true,
      // 深度监听
      deep: true,
    }
  },
  // 能监听在data申明的变量
  watch: {
    // 监听data.bar的变化
    bar: {
      handler(newVal) {
        console.log(newVal)
      },
      // 第一次立刻执行
      immediate: true,
      // 是否是同步,默认异步
      sync: true,
      // 深度监听
      deep: true,
    },
    count: 'countChangeHandler'
  },
  countChangeHandler() {
    console.log(this.data.count)
  }
})
```

```javascript
// component.js
Component({
  data: {
    foo: 0
  },
  ready() {
    this.data.foo = 1
  },
  // 监听app.globalData.test的变化
  globalWatch: {
    test: {
      handler(newVal, oldVal) {
        console.log(newVal, oldVal)
      },
      // 第一次立刻执行
      immediate: true,
      // 是否是同步,默认异步
      sync: true,
    }
  },
  // 能监听在properties, data申明的变量
  watch: {
    // 监听data.foo的变化
    foo: {
      handler(newVal) {
        console.log(newVal)
      },
      // 第一次立刻执行
      immediate: true,
      // 是否是同步,默认异步
      sync: true,
      // 深度监听
      deep: true,
    },
    count: 'countChangeHandler'
  },
  methods: {
    countChangeHandler() {
      console.log(this.data.count)
    }
  }
})
```
