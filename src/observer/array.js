import { def } from '../util/lang'

const arrayProto = Array.prototype

export const arrayMethods = Object.create(arrayProto)

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
  def(arrayMethods, method, function () {
    const args = []
    Array.prototype.push.apply(args, arguments)
    const result = original.apply(this, args)
    const ob = this.__ob__

    let inserted
    switch (method) {
      case 'push':
        inserted = args
        break
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    if (inserted) {
      ob.observeArray(inserted)
    }
    ob.dep.notify()
    return result
  })
})
