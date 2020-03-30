wx-miniapp-watch
========================================

功能
------------
给微信小程序带来
- 1.vue体验的watch语法(immediate, deep),给App,Page,Component函数增加watch的功能
- 2.全局状态管理globalWatch,给App,Page,Component函数增加watch的功能


使用
-----------
```javascript
// app.js
// 给App, Page, Component函数增加watch功能监听data的数据
// 给Page, Component函数增加globalWatch功能监听getApp().global的数据
import 'wx-miniapp-watch'
```

```javascript
// index.js
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
      // 立刻执行
      immediate: true
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
    bar: 0
  },
  // 能监听在app.globalData申明的变量
  globalWatch: {
     // 监听app.globalData.test的变化
    test: {
      handler(newVal, oldVal) {
        console.log(newVal, oldVal)
      }
    }
  },
  // 能监听在data申明的变量
  watch: {
    // 监听data.bar的变化
    bar: {
      handler(newVal) {
        console.log(newVal)
      }
    }
  }
})
```

```javascript
// component.js
Component({
  data: {
    foo: 0
  },
  // 监听app.globalData.test的变化
  globalWatch: {
    test: {
      handler(newVal, oldVal) {
        console.log(newVal, oldVal)
      }
    }
  },
  // 能监听在properties, data申明的变量
  watch: {
    // 监听data.foo的变化
    foo: {
      handler(newVal) {
        console.log(newVal)
      }
    }
  }
})
```
