import { def } from '../util/lang'

// 数组原型
const arrayProto = Array.prototype

// 继承一层数组原型,是个新类
export const arrayMethods = Object.create(arrayProto)

// 这些数组的方法会改变数组的元素,需要做代理
export const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

methodsToPatch.forEach((method) => {
  const original = arrayProto[method]
  // 定义数组代理层方法
  def(arrayMethods, method, function () {
    const args = []
    Array.prototype.push.apply(args, arguments)

    // 原数组执行原来的操作
    const result = original.apply(this, args)

    // 拿到收集元素的ob
    const ob = this.__ob__

    // 存放新增数组元素
    let inserted
    // 为add 进array中的元素进行observe
    switch (method) {
      case 'push':
        inserted = args
        break
      case 'unshift':
        inserted = args
        break
      case 'splice':
        // 第三个参数开始才是新增元素
        inserted = args.slice(2)
        break
    }
    if (inserted) {
      // 动态去添加新增元素的observe
      ob.observeArray(inserted)
    }
    // 数组元素改变触发数组的发布消息
    ob.dep.notify()
    return result
  })
})
