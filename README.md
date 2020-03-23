wx-watch
========================================

Features
------------

给微信小程序带来
- 1.vue体验的watch语法(immediate, deep)
- 2.全局状态管理globalWatch


使用
-----------
// app.js
```javascript
// 给App, Page, Component函数增加watch功能监听data的数据
// 给Page, Component函数增加globalWatch功能监听getApp().global的数据
import 'wx-mixins'
```

// index.js
```javascript
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
