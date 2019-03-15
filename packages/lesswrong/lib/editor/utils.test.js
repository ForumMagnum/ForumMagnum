import React from 'react';
import { render } from 'enzyme'
import { convertFromRaw } from 'draft-js';
import { autolink, draftToHTML } from './utils'
import { htmlToDraftServer } from '../collections/revisions/resolvers'

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

describe("draftToHtml", () => {
  it('correctly translates bold and italic and bold-italic', () => {
    const rawDraftJS = {
      "blocks" : [ 
          {
              "data" : {},
              "depth" : 0,
              "entityRanges" : [],
              "inlineStyleRanges" : [ 
                  {
                      "length" : 6,
                      "offset" : 0,
                      "style" : "ITALIC"
                  }
              ],
              "key" : "6g37h",
              "text" : "Italic",
              "type" : "unstyled"
          }, 
          {
              "data" : {},
              "depth" : 0,
              "entityRanges" : [],
              "inlineStyleRanges" : [ 
                  {
                      "length" : 4,
                      "offset" : 0,
                      "style" : "BOLD"
                  }
              ],
              "key" : "fs9sl",
              "text" : "Bold",
              "type" : "unstyled"
          }, 
          {
              "data" : {},
              "depth" : 0,
              "entityRanges" : [],
              "inlineStyleRanges" : [ 
                  {
                      "length" : 10,
                      "offset" : 0,
                      "style" : "BOLD"
                  }, 
                  {
                      "length" : 10,
                      "offset" : 0,
                      "style" : "ITALIC"
                  }
              ],
              "key" : "9ljma",
              "text" : "BoldItalic",
              "type" : "unstyled"
          }
      ],
      "entityMap" : {}
    }
    const result = draftToHTML(convertFromRaw(rawDraftJS))
    result.should.equal("<p><em>Italic</em></p><p><strong>Bold</strong></p><p><strong><em>BoldItalic</em></strong></p>")
  })
})

describe("htmlToDraft -> draftToHtml roundtrip testing", () => {
  const tests = [
    {description: "italics", html: "<p><em>Italic</em></p>"},
    {description: "bold", html: "<p><strong>Bold</strong></p>"},
    {description: "bold-italic", html: "<p><strong><em>BoldItalic</em></strong></p>"},
    {description: "bullet-list", html: "<li>first</li><li>second</li>"},
    {description: "link", html: `<p><a href="google.com"> Link </a></p>`}
  ]
  for (const t of tests) {
    it(t.description, () => {
      const draft = htmlToDraftServer(t.html)
      const html = draftToHTML(draft)
      html.should.equal(t.html)
    })
  }
})