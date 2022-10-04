import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../server/draftConvert'
import { htmlToDraftServer } from '../server/resolvers/toDraft'

describe("draftToHtml", () => {
  it('correctly translates bold and italic and bold-italic', () => {
    const rawDraftJS: any = {
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
    {description: "bullet-list", html: "<ul><li>first</li><li>second</li></ul>"},
    {description: "link", html: `<p><a href="google.com"> Link </a></p>`}
  ]
  for (const t of tests) {
    it(t.description, () => {
      const draft = htmlToDraftServer(t.html)
      const html = draftToHTML(convertFromRaw(draft))
      html.should.equal(t.html)
    })
  }
})
