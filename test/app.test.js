import expectData from './construction/app'

describe('test app watch', () => {

  beforeEach((done) => {
    setTimeout(() => {
      done()
    }, 1000)
  })

  it('globalWatch trigger callback', () => {
    expect(expectData.hasRegister).toBe(true)
  })

  it('watch trigger callback', () => {
    expect(expectData.number).toEqual(4)
    expect(expectData.count).toEqual(2)
    expect(expectData.age).toEqual(3)
    expect(expectData.runCount).toEqual(13)
  })

})


