import { attributeEdits, attributionsToSpans, spansToAttributions, applyAttributionsToText } from '../server/attributeEdits';
import { cheerioParse } from '../server/utils/htmlUtil';
import chai from 'chai';

describe('Diff attribution tracking', () => {
  it('applyAttributionsToText', () => {
    // @ts-ignore
    const $ = cheerioParse('<div class="c">123456</div>');
    chai.assert.deepEqual(
      // @ts-ignore
      $.html(applyAttributionsToText($, $(".c")[0].children[0], ['a','a','a','b','c','c'], 0)),
      '<span><span class="by_a">123</span><span class="by_b">4</span><span class="by_c">56</span></span>'
    );
  });
  
  it('attributionsToSpans', () => {
    chai.assert.deepEqual(
      attributionsToSpans('<div>123456</div>', ['x','x','y','y','z','w']),
      '<div><span><span class="by_x">12</span><span class="by_y">34</span><span class="by_z">5</span><span class="by_w">6</span></span></div>'
    );
    
    chai.assert.deepEqual(
      attributionsToSpans('<div>123</div><div>456</div>', ['x','x','y','y','z','w']),
      '<div><span><span class="by_x">12</span><span class="by_y">3</span></span></div><div><span><span class="by_y">4</span><span class="by_z">5</span><span class="by_w">6</span></span></div>'
    );
  });

  it('spansToAttributions', () => {
    chai.assert.deepEqual(
      spansToAttributions('<div><span class="by_x">12</span><span class="by_y">34</span><span class="by_z">5</span><span class="by_w">6</span></div>'),
      ['x','x','y','y','z','w']
    );
  });

  it('attributeEdits', () => {
    chai.assert.deepEqual(
      attributeEdits("<div>Asdf</div>", "<div>Asdf ghjk</div>", "2", [...Array.from({ length: 4 }, ()=>"1")]),
      [...Array.from({ length: 4 }, ()=>"1"), ...Array.from({ length: 5 }, ()=>"2")]
    );
    
    chai.assert.deepEqual(
      attributeEdits("<div> Asdf</div>", "<div> Asdf ghjk</div>", "2", [...Array.from({ length: 5 }, ()=>"1")]),
      [...Array.from({ length: 5 }, ()=>"1"), ...Array.from({ length: 5 }, ()=>"2")]
    );
    
    chai.assert.deepEqual(
      attributeEdits("<div> Asdf ghjk</div>", "<div> Asdf</div>", "2", [...Array.from({ length: 10 }, ()=>"1")]),
      [...Array.from({ length: 5 }, ()=>"1")]
    );
    
    chai.assert.deepEqual(
      attributeEdits("<div> <span>x</span> Asdf</div>", "<div>  Asdf ghjk</div>", "2", [...Array.from({ length: 7 }, ()=>"1")]),
      [...Array.from({ length: 6 }, ()=>"1"), ...Array.from({ length: 5 }, ()=>"2")]
    );
    
    chai.assert.deepEqual(
      attributeEdits("<div>x y</div>", "<div>x  z</div>", "2", [...Array.from({ length: 3 }, ()=>"1")]),
      [...Array.from({ length: 3 }, ()=>"1"), "2"]
    );
    
    chai.assert.deepEqual(
      attributeEdits(
        "<div><p>Lorem ipsum.</p></div>",
        "<div><p>Lorem ipsum.</p><p>Second paragraph.</p></div>",
        "3",
        [...Array.from({ length: 6 }, ()=>"1"), ...Array.from({ length: 6 }, ()=>"2")]),
      [...Array.from({ length: 6 }, ()=>"1"), ...Array.from({ length: 6 }, ()=>"2"),  ...Array.from({ length: 17 }, ()=>"3")]
    );
  });
  it("doesn't crash on test case reduced derived from rationality tag 1.1.0", () => {
    const oldHtml = "<div><p>A C D E</p></div>";
    const newHtml = "<div><p>B</p> <p>F C G</p></div>";
    attributeEdits(oldHtml, newHtml, "user2", [...Array.from({ length: oldHtml.length }, ()=>"user1")]);
  });
  it("doesn't crash on test case reduced from rationality tag 1.3.0", () => {
    const oldHtml = "<div>1 YZ</div>"
    const newHtml = "<div>1  Y W</div>"
    attributeEdits(oldHtml, newHtml, "user2", [...Array.from({ length: oldHtml.length }, ()=>"user1")]);
  });
});
