// TODO; how to test individual file
// TODO; how to test anything
import { chai } from 'meteor/practicalmeteor:chai'
import { autolink } from './utils'

chai.should()

describe.only('Autolink', () => {
  it('autolinks multiple links', () => {
    const textIn = 'text1 https://www.google.com/ text2 https://www.google.com/foo text3'
    const want = [
      '<p>text1 ',
      '<a href="https://www.google.com/">https://www.google.com/</a> ',
      'text2 ',
      '<a href="https://www.google.com/foo">https://www.google.com/foo</a> ',
      'text3</p>'
    ].join('')
    const got = autolink(textIn)
    got.should.equal(want)
  })

  it('does nothing to linkless text', () => {
    const textIn = 'text1'
    const want = '<p>text1</p>'
    const got = autolink(textIn)
    got.should.equal(want)
  })

  it('autolinks only link', () => {
    const textIn = 'www.google.com'
    const want = '<p><a href="http://www.google.com">www.google.com</a></p>'
    const got = autolink(textIn)
    got.should.equal(want)
  })
})
