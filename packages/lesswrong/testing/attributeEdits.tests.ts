import { testStartup } from './testMain';
import { attributeEdits, attributionsToSpans, spansToAttributions, applyAttributionsToText } from '../server/attributeEdits';
import cheerio from 'cheerio';
import chai from 'chai';
import * as _ from 'underscore';

testStartup();

describe('Diff attribution tracking', () => {
  it('applyAttributionsToText', () => {
    // @ts-ignore
    const $ = cheerio.load('<div class="c">123456</div>', null, false);
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
  });

  it('spansToAttributions', () => {
    chai.assert.deepEqual(
      spansToAttributions('<div><span class="by_x">12</span><span class="by_y">34</span><span class="by_z">5</span><span class="by_w">6</span></div>'),
      ['x','x','y','y','z','w']
    );
  });

  it('attributeEdits', () => {
    chai.assert.deepEqual(
      attributeEdits("<div>Asdf</div>", "<div>Asdf ghjk</div>", "2", [..._.times(4, ()=>"1")]),
      [..._.times(4, ()=>"1"), ..._.times(5, ()=>"2")]
    );
    
    chai.assert.deepEqual(
      attributeEdits("<div> Asdf</div>", "<div> Asdf ghjk</div>", "2", [..._.times(5, ()=>"1")]),
      [..._.times(5, ()=>"1"), ..._.times(5, ()=>"2")]
    );
    
    chai.assert.deepEqual(
      attributeEdits("<div> Asdf ghjk</div>", "<div> Asdf</div>", "2", [..._.times(10, ()=>"1")]),
      [..._.times(5, ()=>"1")]
    );
    
    chai.assert.deepEqual(
      attributeEdits("<div> <span>x</span> Asdf</div>", "<div>  Asdf ghjk</div>", "2", [..._.times(7, ()=>"1")]),
      [..._.times(6, ()=>"1"), ..._.times(5, ()=>"2")]
    );
    
    chai.assert.deepEqual(
      attributeEdits(
        "<div><p>Lorem ipsum.</p></div>",
        "<div><p>Lorem ipsum.</p><p>Second paragraph.</p></div>",
        "3",
        [..._.times(6, ()=>"1"), ..._.times(6, ()=>"2")]),
      [..._.times(6, ()=>"1"), ..._.times(6, ()=>"2"),  ..._.times(17, ()=>"3")]
    );
  });
});
