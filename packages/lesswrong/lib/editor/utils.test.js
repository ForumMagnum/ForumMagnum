import React from 'react';
import { chai } from 'meteor/practicalmeteor:chai'
import { render } from 'enzyme'

import { autolink } from './utils'

chai.should()

describe('Autolink', () => {
  const tests = [
    {
      description: 'autolinks multiple links',
      textIn: 'text1 https://www.google.com/ text2 https://www.google.com/foo text3',
      want: <p>
        text1{' '}
        <a href="https://www.google.com/">https://www.google.com/</a>{' '}
        text2{' '}
        <a href="https://www.google.com/foo">https://www.google.com/foo</a>{' '}
        text3
      </p>
    }, {
      description: 'does nothing to linkless text',
      textIn: 'text1',
      want: <p />
    }, {
      description: 'autolinks only link',
      textIn: 'www.google.com',
      want: <p><a href="http://www.google.com">www.google.com</a></p>
    }, {
      description: 'does not render user input html',
      textIn: '<span>test</span> www.google.com',
      want: <p>{'<span>test</span>'} <a href="http://wwww.google.com">www.google.com</a></p>
    }
  ]

  for (const t of tests) {
    it(t.description, () => {
      const got = autolink(t.textIn)
      render(got).text().should.equal(render(t.want).text())
    })
  }
})
