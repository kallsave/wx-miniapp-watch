wx-watch
========================================

Features
------------

给微信小程序带来和vue体验的watch语法

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
  data: {
    test: 0
  },
  watch: {
    test: {
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
    test: 0
  },
  globalWatch: {
    test: {
      handler(newVal, oldVal) {
        console.log(newVal, oldVal)
      }
    }
  },
  watch: {
    test: {
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
    test: 0
  },
  globalWatch: {
    test: {
      handler(newVal, oldVal) {
        console.log(newVal, oldVal)
      }
    }
  },
  watch: {
    test: {
      handler(newVal) {
        console.log(newVal)
      }
    }
  }
})
```

