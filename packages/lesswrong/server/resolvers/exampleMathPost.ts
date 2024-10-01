export const exampleMathPost = `<p>
  <i>This post, and much of the following sequence, was greatly aided by feedback from the following people (among others): </i>
  <a href="https://www.lesswrong.com/users/lawrencec">
    <i>Lawrence Chan</i>
  </a>
  <i>, </i>
  <a href="https://www.lesswrong.com/users/joanna-morningstar">
    <i>Joanna Morningstar</i>
  </a>
  <i>, </i>
  <a href="https://www.lesswrong.com/users/johnswentworth">
    <i>John Wentworth</i>
  </a>
  <i>, </i>
  <a href="https://www.lesswrong.com/users/mayleaf">
    <i>Samira Nedungadi</i>
  </a>
  <i>, </i>
  <a href="https://www.lesswrong.com/users/aysja">
    <i>Aysja Johnson</i>
  </a>
  <i>, </i>
  <a href="https://www.lesswrong.com/users/decodyng">
    <i>Cody Wild</i>
  </a>
  <i>, </i>
  <a href="https://www.lesswrong.com/users/jeremy-gillen">
    <i>Jeremy Gillen</i>
  </a>
  <i>, </i>
  <a href="https://www.lesswrong.com/users/ryankidd44">
    <i>Ryan Kidd</i>
  </a>
  <i>, </i>
  <a href="https://www.lesswrong.com/users/justismills">
    <i>Justis Mills</i>
  </a>
  <i> and </i>
  <a href="https://www.lesswrong.com/users/flowerfeatherfocus">
    <i>Jonathan Mustin</i>
  </a>
  <i>.</i>
</p>
<h2>Introduction &amp; motivation</h2>
<p>In the course of researching optimization, I decided that I had to really understand what entropy is.
  <span class="footnote-reference" data-footnote-reference="" data-footnote-index="1" data-footnote-id="a26yynbcolo" role="doc-noteref" id="fnrefa26yynbcolo">
    <sup>
      <a href="#fna26yynbcolo">[1]</a>
    </sup>
  </span>&nbsp;But there are a lot of other reasons why the concept is worth studying:
</p>
<ul>
  <li>Information theory:
    <ul>
      <li>Entropy tells you about the amount of information in something.</li>
      <li>It tells us how to design optimal communication protocols.</li>
      <li>It helps us understand strategies for (and limits on) file compression.</li>
    </ul>
  </li>
  <li>Statistical mechanics:
    <ul>
      <li>Entropy tells us how macroscopic physical systems act in practice.</li>
      <li>It gives us the heat equation.</li>
      <li>We can use it to improve engine efficiency.</li>
      <li>It tells us how hot things glow, which led to the discovery of quantum mechanics.</li>
    </ul>
  </li>
  <li>Epistemics (an important application to me and many others on LessWrong):
    <ul>
      <li>The concept of entropy yields the 
        <a href="https://en.wikipedia.org/wiki/Principle_of_maximum_entropy">maximum entropy principle</a>, which is extremely helpful for doing general Bayesian reasoning.
      </li>
    </ul>
  </li>
  <li>Entropy tells us how "unlikely" something is and how much we would have to fight against nature to get that outcome (i.e. optimize).</li>
  <li>It can be used to explain the 
    <a href="https://en.wikipedia.org/wiki/Entropy_as_an_arrow_of_time">arrow of time</a>.
  </li>
  <li>It is relevant to the 
    <a href="https://en.wikipedia.org/wiki/Heat_death_of_the_universe">fate of the universe.</a>
  </li>
  <li>And it's also a fun puzzle to figure out!</li>
</ul>
<p>I didn't intend to write a post about entropy when I started trying to understand it. But I found the existing resources (textbooks, Wikipedia, science explainers) so poor that it actually seems important to have a better one as a prerequisite for understanding optimization! One failure mode I was running into was that other resources tended only to be concerned about the application of the concept in their particular sub-domain. Here, I try to take on the task of synthesizing the 
  <i>abstract</i> concept of entropy, to show what's so deep and fundamental about it. In future posts, I'll talk about things like:
</p>
<ul>
  <li>How abstract entropy can be made meaningful on 
    <a href="https://www.lesswrong.com/posts/yJorhsuEKCbYrycav/dealing-with-infinite-entropy">continuous spaces</a>
  </li>
  <li>Exactly where the "second law of thermodynamics"
    <span class="footnote-reference" data-footnote-reference="" data-footnote-index="2" data-footnote-id="6gxudhss0db" role="doc-noteref" id="fnref6gxudhss0db">
      <sup>
        <a href="#fn6gxudhss0db">[2]</a>
      </sup>
    </span>&nbsp;comes from, and exactly when it holds (which turns out to be much broader than thermodynamics)
  </li>
  <li>How several domain-specific types of entropy relate to this abstract version</li>
</ul>
<p>Many people reading this will have some previous facts about entropy stored in their minds, and this can sometimes be disorienting when it's not yet clear how those facts are consistent with what I'm describing. You're welcome to skip ahead to the relevant parts and see if they're re-orienting; otherwise, if you can get through the whole explanation, I hope that it will eventually be addressed!</p>
<p>But also, please keep in mind that I'm not an expert in any of the relevant sub-fields. I've gotten feedback on this post from people who know more math &amp; physics than I do, but at the end of the day, I'm just a rationalist trying to understand the world.</p>
<h2>Abstract definition</h2>
<p>Entropy is so fundamental because it applies far beyond our own specific universe, the one where something close to the standard model of physics and general relativity are true. It applies in any system with different states. If the system has dynamical laws, that is, rules for moving between the different states, then some version of the second law of thermodynamics is also relevant. But for now we're sticking with statics; the concept of entropy can be coherently defined for sets of states even in the absence of any "laws of physics" that cause the system to evolve between states. The example I keep in my head for this is a Rubik's Cube, which I'll elaborate on in a bit.</p>
<p>
  <strong>The entropy of a state is the number of bits you need to use to uniquely distinguish it.</strong>
</p>
<p>Some useful things to note right away:</p>
<ul>
  <li>Entropy is a concrete, positive number of bits,
    <span class="footnote-reference" data-footnote-reference="" data-footnote-index="3" data-footnote-id="pi8b39u5hd7" role="doc-noteref" id="fnrefpi8b39u5hd7">
      <sup>
        <a href="#fnpi8b39u5hd7">[3]</a>
      </sup>
    </span>&nbsp;like 4, 73.89, or&nbsp;
    <span class="math-tex">
      <span class="mjpage">
        <span class="mjx-chtml">
          <span class="mjx-math" aria-label="10^{61}">
            <span class="mjx-mrow" aria-hidden="true">
              <span class="mjx-msubsup">
                <span class="mjx-base">
                  <span class="mjx-mn">
                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">10</span>
                  </span>
                </span>
                <span class="mjx-sup" style="font-size: 70.7%; vertical-align: 0.591em; padding-left: 0px; padding-right: 0.071em;">
                  <span class="mjx-texatom" style="">
                    <span class="mjx-mrow">
                      <span class="mjx-mn">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">61</span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>
            </span>
          </span>
          <style>.mjx-chtml {display: inline-block; line-height: 0; text-indent: 0; text-align: left; text-transform: none; font-style: normal; font-weight: normal; font-size: 100%; font-size-adjust: none; letter-spacing: normal; word-wrap: normal; word-spacing: normal; white-space: nowrap; float: none; direction: ltr; max-width: none; max-height: none; min-width: 0; min-height: 0; border: 0; margin: 0; padding: 1px 0}
.MJXc-display {display: block; text-align: center; margin: 1em 0; padding: 0}
.mjx-chtml[tabindex]:focus, body :focus .mjx-chtml[tabindex] {display: inline-table}
.mjx-full-width {text-align: center; display: table-cell!important; width: 10000em}
.mjx-math {display: inline-block; border-collapse: separate; border-spacing: 0}
.mjx-math * {display: inline-block; -webkit-box-sizing: content-box!important; -moz-box-sizing: content-box!important; box-sizing: content-box!important; text-align: left}
.mjx-numerator {display: block; text-align: center}
.mjx-denominator {display: block; text-align: center}
.MJXc-stacked {height: 0; position: relative}
.MJXc-stacked > * {position: absolute}
.MJXc-bevelled > * {display: inline-block}
.mjx-stack {display: inline-block}
.mjx-op {display: block}
.mjx-under {display: table-cell}
.mjx-over {display: block}
.mjx-over > * {padding-left: 0px!important; padding-right: 0px!important}
.mjx-under > * {padding-left: 0px!important; padding-right: 0px!important}
.mjx-stack > .mjx-sup {display: block}
.mjx-stack > .mjx-sub {display: block}
.mjx-prestack > .mjx-presup {display: block}
.mjx-prestack > .mjx-presub {display: block}
.mjx-delim-h > .mjx-char {display: inline-block}
.mjx-surd {vertical-align: top}
.mjx-surd + .mjx-box {display: inline-flex}
.mjx-mphantom * {visibility: hidden}
.mjx-merror {background-color: #FFFF88; color: #CC0000; border: 1px solid #CC0000; padding: 2px 3px; font-style: normal; font-size: 90%}
.mjx-annotation-xml {line-height: normal}
.mjx-menclose > svg {fill: none; stroke: currentColor; overflow: visible}
.mjx-mtr {display: table-row}
.mjx-mlabeledtr {display: table-row}
.mjx-mtd {display: table-cell; text-align: center}
.mjx-label {display: table-row}
.mjx-box {display: inline-block}
.mjx-block {display: block}
.mjx-span {display: inline}
.mjx-char {display: block; white-space: pre}
.mjx-itable {display: inline-table; width: auto}
.mjx-row {display: table-row}
.mjx-cell {display: table-cell}
.mjx-table {display: table; width: 100%}
.mjx-line {display: block; height: 0}
.mjx-strut {width: 0; padding-top: 1em}
.mjx-vsize {width: 0}
.MJXc-space1 {margin-left: .167em}
.MJXc-space2 {margin-left: .222em}
.MJXc-space3 {margin-left: .278em}
.mjx-test.mjx-test-display {display: table!important}
.mjx-test.mjx-test-inline {display: inline!important; margin-right: -1px}
.mjx-test.mjx-test-default {display: block!important; clear: both}
.mjx-ex-box {display: inline-block!important; position: absolute; overflow: hidden; min-height: 0; max-height: none; padding: 0; border: 0; margin: 0; width: 1px; height: 60ex}
.mjx-test-inline .mjx-left-box {display: inline-block; width: 0; float: left}
.mjx-test-inline .mjx-right-box {display: inline-block; width: 0; float: right}
.mjx-test-display .mjx-right-box {display: table-cell!important; width: 10000em!important; min-width: 0; max-width: none; padding: 0; border: 0; margin: 0}
.MJXc-TeX-unknown-R {font-family: monospace; font-style: normal; font-weight: normal}
.MJXc-TeX-unknown-I {font-family: monospace; font-style: italic; font-weight: normal}
.MJXc-TeX-unknown-B {font-family: monospace; font-style: normal; font-weight: bold}
.MJXc-TeX-unknown-BI {font-family: monospace; font-style: italic; font-weight: bold}
.MJXc-TeX-ams-R {font-family: MJXc-TeX-ams-R,MJXc-TeX-ams-Rw}
.MJXc-TeX-cal-B {font-family: MJXc-TeX-cal-B,MJXc-TeX-cal-Bx,MJXc-TeX-cal-Bw}
.MJXc-TeX-frak-R {font-family: MJXc-TeX-frak-R,MJXc-TeX-frak-Rw}
.MJXc-TeX-frak-B {font-family: MJXc-TeX-frak-B,MJXc-TeX-frak-Bx,MJXc-TeX-frak-Bw}
.MJXc-TeX-math-BI {font-family: MJXc-TeX-math-BI,MJXc-TeX-math-BIx,MJXc-TeX-math-BIw}
.MJXc-TeX-sans-R {font-family: MJXc-TeX-sans-R,MJXc-TeX-sans-Rw}
.MJXc-TeX-sans-B {font-family: MJXc-TeX-sans-B,MJXc-TeX-sans-Bx,MJXc-TeX-sans-Bw}
.MJXc-TeX-sans-I {font-family: MJXc-TeX-sans-I,MJXc-TeX-sans-Ix,MJXc-TeX-sans-Iw}
.MJXc-TeX-script-R {font-family: MJXc-TeX-script-R,MJXc-TeX-script-Rw}
.MJXc-TeX-type-R {font-family: MJXc-TeX-type-R,MJXc-TeX-type-Rw}
.MJXc-TeX-cal-R {font-family: MJXc-TeX-cal-R,MJXc-TeX-cal-Rw}
.MJXc-TeX-main-B {font-family: MJXc-TeX-main-B,MJXc-TeX-main-Bx,MJXc-TeX-main-Bw}
.MJXc-TeX-main-I {font-family: MJXc-TeX-main-I,MJXc-TeX-main-Ix,MJXc-TeX-main-Iw}
.MJXc-TeX-main-R {font-family: MJXc-TeX-main-R,MJXc-TeX-main-Rw}
.MJXc-TeX-math-I {font-family: MJXc-TeX-math-I,MJXc-TeX-math-Ix,MJXc-TeX-math-Iw}
.MJXc-TeX-size1-R {font-family: MJXc-TeX-size1-R,MJXc-TeX-size1-Rw}
.MJXc-TeX-size2-R {font-family: MJXc-TeX-size2-R,MJXc-TeX-size2-Rw}
.MJXc-TeX-size3-R {font-family: MJXc-TeX-size3-R,MJXc-TeX-size3-Rw}
.MJXc-TeX-size4-R {font-family: MJXc-TeX-size4-R,MJXc-TeX-size4-Rw}
.MJXc-TeX-vec-R {font-family: MJXc-TeX-vec-R,MJXc-TeX-vec-Rw}
.MJXc-TeX-vec-B {font-family: MJXc-TeX-vec-B,MJXc-TeX-vec-Bx,MJXc-TeX-vec-Bw}
@font-face {font-family: MJXc-TeX-ams-R; src: local('MathJax_AMS'), local('MathJax_AMS-Regular')}
@font-face {font-family: MJXc-TeX-ams-Rw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/eot/MathJax_AMS-Regular.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/woff/MathJax_AMS-Regular.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/otf/MathJax_AMS-Regular.otf') format('opentype')}
@font-face {font-family: MJXc-TeX-cal-B; src: local('MathJax_Caligraphic Bold'), local('MathJax_Caligraphic-Bold')}
@font-face {font-family: MJXc-TeX-cal-Bx; src: local('MathJax_Caligraphic'); font-weight: bold}
@font-face {font-family: MJXc-TeX-cal-Bw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/eot/MathJax_Caligraphic-Bold.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/woff/MathJax_Caligraphic-Bold.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/otf/MathJax_Caligraphic-Bold.otf') format('opentype')}
@font-face {font-family: MJXc-TeX-frak-R; src: local('MathJax_Fraktur'), local('MathJax_Fraktur-Regular')}
@font-face {font-family: MJXc-TeX-frak-Rw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/eot/MathJax_Fraktur-Regular.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/woff/MathJax_Fraktur-Regular.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/otf/MathJax_Fraktur-Regular.otf') format('opentype')}
@font-face {font-family: MJXc-TeX-frak-B; src: local('MathJax_Fraktur Bold'), local('MathJax_Fraktur-Bold')}
@font-face {font-family: MJXc-TeX-frak-Bx; src: local('MathJax_Fraktur'); font-weight: bold}
@font-face {font-family: MJXc-TeX-frak-Bw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/eot/MathJax_Fraktur-Bold.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/woff/MathJax_Fraktur-Bold.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/otf/MathJax_Fraktur-Bold.otf') format('opentype')}
@font-face {font-family: MJXc-TeX-math-BI; src: local('MathJax_Math BoldItalic'), local('MathJax_Math-BoldItalic')}
@font-face {font-family: MJXc-TeX-math-BIx; src: local('MathJax_Math'); font-weight: bold; font-style: italic}
@font-face {font-family: MJXc-TeX-math-BIw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/eot/MathJax_Math-BoldItalic.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/woff/MathJax_Math-BoldItalic.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/otf/MathJax_Math-BoldItalic.otf') format('opentype')}
@font-face {font-family: MJXc-TeX-sans-R; src: local('MathJax_SansSerif'), local('MathJax_SansSerif-Regular')}
@font-face {font-family: MJXc-TeX-sans-Rw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/eot/MathJax_SansSerif-Regular.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/woff/MathJax_SansSerif-Regular.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/otf/MathJax_SansSerif-Regular.otf') format('opentype')}
@font-face {font-family: MJXc-TeX-sans-B; src: local('MathJax_SansSerif Bold'), local('MathJax_SansSerif-Bold')}
@font-face {font-family: MJXc-TeX-sans-Bx; src: local('MathJax_SansSerif'); font-weight: bold}
@font-face {font-family: MJXc-TeX-sans-Bw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/eot/MathJax_SansSerif-Bold.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/woff/MathJax_SansSerif-Bold.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/otf/MathJax_SansSerif-Bold.otf') format('opentype')}
@font-face {font-family: MJXc-TeX-sans-I; src: local('MathJax_SansSerif Italic'), local('MathJax_SansSerif-Italic')}
@font-face {font-family: MJXc-TeX-sans-Ix; src: local('MathJax_SansSerif'); font-style: italic}
@font-face {font-family: MJXc-TeX-sans-Iw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/eot/MathJax_SansSerif-Italic.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/woff/MathJax_SansSerif-Italic.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/otf/MathJax_SansSerif-Italic.otf') format('opentype')}
@font-face {font-family: MJXc-TeX-script-R; src: local('MathJax_Script'), local('MathJax_Script-Regular')}
@font-face {font-family: MJXc-TeX-script-Rw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/eot/MathJax_Script-Regular.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/woff/MathJax_Script-Regular.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/otf/MathJax_Script-Regular.otf') format('opentype')}
@font-face {font-family: MJXc-TeX-type-R; src: local('MathJax_Typewriter'), local('MathJax_Typewriter-Regular')}
@font-face {font-family: MJXc-TeX-type-Rw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/eot/MathJax_Typewriter-Regular.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/woff/MathJax_Typewriter-Regular.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/otf/MathJax_Typewriter-Regular.otf') format('opentype')}
@font-face {font-family: MJXc-TeX-cal-R; src: local('MathJax_Caligraphic'), local('MathJax_Caligraphic-Regular')}
@font-face {font-family: MJXc-TeX-cal-Rw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/eot/MathJax_Caligraphic-Regular.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/woff/MathJax_Caligraphic-Regular.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/otf/MathJax_Caligraphic-Regular.otf') format('opentype')}
@font-face {font-family: MJXc-TeX-main-B; src: local('MathJax_Main Bold'), local('MathJax_Main-Bold')}
@font-face {font-family: MJXc-TeX-main-Bx; src: local('MathJax_Main'); font-weight: bold}
@font-face {font-family: MJXc-TeX-main-Bw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/eot/MathJax_Main-Bold.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/woff/MathJax_Main-Bold.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/otf/MathJax_Main-Bold.otf') format('opentype')}
@font-face {font-family: MJXc-TeX-main-I; src: local('MathJax_Main Italic'), local('MathJax_Main-Italic')}
@font-face {font-family: MJXc-TeX-main-Ix; src: local('MathJax_Main'); font-style: italic}
@font-face {font-family: MJXc-TeX-main-Iw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/eot/MathJax_Main-Italic.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/woff/MathJax_Main-Italic.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/otf/MathJax_Main-Italic.otf') format('opentype')}
@font-face {font-family: MJXc-TeX-main-R; src: local('MathJax_Main'), local('MathJax_Main-Regular')}
@font-face {font-family: MJXc-TeX-main-Rw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/eot/MathJax_Main-Regular.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/woff/MathJax_Main-Regular.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/otf/MathJax_Main-Regular.otf') format('opentype')}
@font-face {font-family: MJXc-TeX-math-I; src: local('MathJax_Math Italic'), local('MathJax_Math-Italic')}
@font-face {font-family: MJXc-TeX-math-Ix; src: local('MathJax_Math'); font-style: italic}
@font-face {font-family: MJXc-TeX-math-Iw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/eot/MathJax_Math-Italic.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/woff/MathJax_Math-Italic.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/otf/MathJax_Math-Italic.otf') format('opentype')}
@font-face {font-family: MJXc-TeX-size1-R; src: local('MathJax_Size1'), local('MathJax_Size1-Regular')}
@font-face {font-family: MJXc-TeX-size1-Rw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/eot/MathJax_Size1-Regular.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/woff/MathJax_Size1-Regular.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/otf/MathJax_Size1-Regular.otf') format('opentype')}
@font-face {font-family: MJXc-TeX-size2-R; src: local('MathJax_Size2'), local('MathJax_Size2-Regular')}
@font-face {font-family: MJXc-TeX-size2-Rw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/eot/MathJax_Size2-Regular.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/woff/MathJax_Size2-Regular.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/otf/MathJax_Size2-Regular.otf') format('opentype')}
@font-face {font-family: MJXc-TeX-size3-R; src: local('MathJax_Size3'), local('MathJax_Size3-Regular')}
@font-face {font-family: MJXc-TeX-size3-Rw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/eot/MathJax_Size3-Regular.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/woff/MathJax_Size3-Regular.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/otf/MathJax_Size3-Regular.otf') format('opentype')}
@font-face {font-family: MJXc-TeX-size4-R; src: local('MathJax_Size4'), local('MathJax_Size4-Regular')}
@font-face {font-family: MJXc-TeX-size4-Rw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/eot/MathJax_Size4-Regular.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/woff/MathJax_Size4-Regular.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/otf/MathJax_Size4-Regular.otf') format('opentype')}
@font-face {font-family: MJXc-TeX-vec-R; src: local('MathJax_Vector'), local('MathJax_Vector-Regular')}
@font-face {font-family: MJXc-TeX-vec-Rw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/eot/MathJax_Vector-Regular.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/woff/MathJax_Vector-Regular.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/otf/MathJax_Vector-Regular.otf') format('opentype')}
@font-face {font-family: MJXc-TeX-vec-B; src: local('MathJax_Vector Bold'), local('MathJax_Vector-Bold')}
@font-face {font-family: MJXc-TeX-vec-Bx; src: local('MathJax_Vector'); font-weight: bold}
@font-face {font-family: MJXc-TeX-vec-Bw; src /*1*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/eot/MathJax_Vector-Bold.eot'); src /*2*/: url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/woff/MathJax_Vector-Bold.woff') format('woff'), url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS/TeX/otf/MathJax_Vector-Bold.otf') format('opentype')}
</style>
        </span>
      </span>
    </span>.
  </li>
  <li>Its definition does not rely on concepts like heat or energy, or a universe with spatial dimensions, or even anything to do with random variables.</li>
  <li>You're distinguishing the state from all the other states in a given set. Nothing about the structure or contents of this set matters for the definition to be applicable; just the number of things in the set matters.</li>
  <li>Entropy depends on an agreed-upon strategy for describing things, and is "subjective" in this sense.</li>
</ul>
<p>But after you 
  <i>agree</i> on a strategy for uniquely distinguishing states, the entropy of said states becomes fixed relative to that strategy (and there are often clearly most-sensible strategies) and thus, in that sense, objective. And further, there are limits on how low entropy can go while still describing things in a way that actually distinguishes them; the subjectivity only goes so far.
</p>
<h2>Macrostates</h2>
<p>I just defined entropy as a property of specific states, but in many contexts you don't care at all about specific states. There are a lot of reasons not to. Perhaps:</p>
<ul>
  <li>They're intractable to ever learn, like the velocity of every particle in a box.</li>
  <li>You're not even holding a specific state, but are instead designing something to deal with a "type" of state, like writing a compression algorithm for astronomical images.</li>
  <li>There are 
    <a href="https://www.lesswrong.com/posts/yJorhsuEKCbYrycav/dealing-with-infinite-entropy">uncountably many states</a>.
  </li>
  <li>Every state is just as good to you; you don't care to assign 
    <i>any</i> states lower entropy than others.
  </li>
</ul>
<p>In cases like these, we only care about 
  <strong>how many possible states</strong> there are to distinguish among.
</p>
<p>Historically, the individual states are called 
  <strong>microstates</strong>, and collections of microstates are called 
  <strong>macrostates</strong>. Usually the macrostates are connotively characterized by a generalized property of the state, like "the average speed of the particles" (temperature). In theory, a macrostate could be any subset, but usually we will care about a particular subset for some reason, and that reason will be some macroscopically observable property.
</p>
<figure class="image">
  <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267418/mirroredImages/REA49tL5jsh69X3aM/mzfawei9unujhbba0tyw.png" srcset="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/toxi3t9gnbh2rybpnkdv.png 220w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/qdqxegv64qxn1ejed9xq.png 440w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/wtf6rqzzlotlqahuheji.png 660w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267418/mirroredImages/REA49tL5jsh69X3aM/jx9pyaq2xyndpomgl5zu.png 880w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/swmu3bnczgtjx1ijxxza.png 1100w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267418/mirroredImages/REA49tL5jsh69X3aM/ypi35l93y730pnzqnofg.png 1320w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/qkemxrn1gzavsv1orjqo.png 1540w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/myhmypnq2pb3ef5a4fhw.png 1760w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/svten1hglkpg4yg4gajv.png 1980w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267418/mirroredImages/REA49tL5jsh69X3aM/antdber7ylhvmnmqobvu.png 2180w">
    <figcaption>If our system consists of the result of tossing two dice, then this grid represents all the possible outcomes. We could partition this into macrostates based on the sum of the two dice, as shown here with dashed lines.</figcaption>
  </figure>
  <h2>Two basic strategies for distinguishing states</h2>
  <p>I would say that 
    <i>any</i> method used to distinguish states forms a valid sub-type of entropy. But there are a couple really fundamental ones that are worth describing in detail. The first one I'll talk about is using 
    <strong>finite binary strings</strong> to label each individual state. The second one is using 
    <strong>yes/no questions</strong> to partition sets until you've identified your state. (Note that both these methods are defined in terms of sets of 
    <i>discrete</i> states, so 
    <a href="https://www.lesswrong.com/posts/yJorhsuEKCbYrycav/dealing-with-infinite-entropy">later I'll talk</a> about what happens in continuous spaces. A lot of real-world states have real-valued parameters, and that requires special treatment.)
  </p>
  <h3>Binary string labels</h3>
  <p>In order to be able to say which of the possible states a system is in, there has to be some pre-existing way of referring to each individual state. That is, the states must have some kind of "labels". In order to have a label, you'll need some set of symbols, which you put in sequence. And it turns out that anything of interest to us here that could be done with a finite alphabet of symbols can also be done with an alphabet of only two symbols,
    <span class="footnote-reference" data-footnote-reference="" data-footnote-index="4" data-footnote-id="mh08kmzx85q" role="doc-noteref" id="fnrefmh08kmzx85q">
      <sup>
        <a href="#fnmh08kmzx85q">[4]</a>
      </sup>
    </span>&nbsp;so we will spend the whole rest of this sequence speaking in terms of binary.
    <span class="footnote-reference" data-footnote-reference="" data-footnote-index="5" data-footnote-id="jlulplwrhrb" role="doc-noteref" id="fnrefjlulplwrhrb">
      <sup>
        <a href="#fnjlulplwrhrb">[5]</a>
      </sup>
    </span>
  </p>
  <p>It would be 
    <a href="https://en.wikipedia.org/wiki/Occam%27s_razor">parsimonious</a> to use the shortest descriptions first. Fewer symbols to process means faster processing, less space required to store the labels, et cetera. So we'll label our states starting from the shortest binary strings and working our way up.
  </p>
  <figure class="image">
    <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267418/mirroredImages/REA49tL5jsh69X3aM/j6k2xbtnvpu8n2vra2oz.png" srcset="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/eliasvtzc11tldshbnhi.png 200w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/s0bmlsr2digpvqaab8us.png 400w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/hsbrnqa5su8edozqlcwk.png 600w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/nmoecyzoeamz872e0etm.png 800w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/zhum6z2rvyzyu5wqifiw.png 1000w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/rjzfl9sdynsfzfc04gop.png 1200w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/r6ody0b3v0crrlhhw7gg.png 1400w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/r5hde4mn2xacvmxflftq.png 1600w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/geadsioikqmwfx8kexzm.png 1800w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267418/mirroredImages/REA49tL5jsh69X3aM/y5lcfpw23e7upjndkvzj.png 2000w">
      <figcaption>You could think of the binary string labels like barcodes. Their purpose is to uniquely distinguish a bunch of arbitrary objects. They may encode information about the object, or they might just be registered in a big look-up table. If you have too many objects, then you'll need to start using longer bar codes.</figcaption>
    </figure>
    <p>Here's where we can see one way in which entropy is subjective. For any given set of states, there are many ways to give labels to the individual elements – you can always just swap the labels around. In contexts where quantities of entropy are treated as objective, that's because the context includes (explicitly or implicitly) chosen rules about how we're allowed to describe the states. On top of that, while you can swap labels, there are limits to how few bits we can use overall. You could always choose a state-labeling scheme that uses more bits, but there is a minimum average number of bits we can use to describe a certain number of states (i.e. the number we get by using the shortest strings first). Often, when talking about entropy, it's an implicit assumption that we're using a maximally efficient labeling.</p>
    <p>Let's get a tiny bit more concrete by actually looking at the first several binary strings. The first string is the 
      <a href="https://en.wikipedia.org/wiki/Empty_string">"empty" string</a>, with no characters, which therefore has length 0. Next, there are only two strings which have a length of 1: the string 0 and the string 1. This means that, no matter what my system is, and no matter how many states it has, at most two states could be said to have an entropy of 1. There are twice as many strings with length 2: 00, 01, 10, and 11. Thus, there are (at most) four states that could be said to have entropy 2. For every +1 increase in entropy, there are 
      <i>twice</i> as many states that could be assigned that entropy, because there are twice as many binary strings with that length.
      <span class="footnote-reference" data-footnote-reference="" data-footnote-index="6" data-footnote-id="0qfkbz6qhwj" role="doc-noteref" id="fnref0qfkbz6qhwj">
        <sup>
          <a href="#fn0qfkbz6qhwj">[6]</a>
        </sup>
      </span>
    </p>
    <p>I think it's easy for people to get the impression that the rarity of low-entropy states comes from something more complex or metaphysical, or is tied to the nature of our universe. But it turns out to be from this simple math thing. 
      <strong>Low-entropy states are rare because short binary strings are rare.</strong>
    </p>
    <figure class="image">
      <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267418/mirroredImages/REA49tL5jsh69X3aM/dsb7dpukre3p3f9bxk7e.png" srcset="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/nia1yxgpxfpth9b1fuce.png 200w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/po308nbqqwupjqtnk6of.png 400w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/nlzjoqtbgox4q6h9hxeq.png 600w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/alzfigihnkgzgzsrn8ob.png 800w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/i9zpzc8y4trsqpgmmazk.png 1000w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/wekgtwlbjpaclie33god.png 1200w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/xvo3lx5abguwxmzpbvh4.png 1400w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/eihzrmfoy4ofohboy9sk.png 1600w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/pv7e5qbejetclmefadzz.png 1800w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267418/mirroredImages/REA49tL5jsh69X3aM/zj2rcjdx8egumgp6aect.png 2000w">
        <figcaption>The first 31 binary strings in lexical order. The first one is just a line, denoting the empty string. Shorter strings are exponentially more rare!</figcaption>
      </figure>
      <p>To be more concrete, consider the Rubik's Cube. As you turn the faces of a Rubik's Cube, you change the position and orientation of the little sub-cubes. In this way, the whole cube could be considered to have different states. There's no law that dictates how the cube moves from one state to the next; you can turn the faces however you want, or not at all. So it's not a system with a time-evolution rule. Nonetheless, we can use the concept of entropy by assigning labels to the states.</p>
      <p>Intuitively, one might say that the "solved" state of a Rubik's Cube is the most special one (to humans). Turning one side once yields a state that is slightly less special, but still pretty special. If you turn the sides randomly 
        <a href="http://www.cube20.org/qtm/">twenty times</a>, then you almost certainly end up in a state that is random-looking, which is to say, not special at all. There are about&nbsp;
        <span class="math-tex">
          <span class="mjpage">
            <span class="mjx-chtml">
              <span class="mjx-math" aria-label="4.3 \cdot 10^{19}">
                <span class="mjx-mrow" aria-hidden="true">
                  <span class="mjx-mn">
                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">4.3</span>
                  </span>
                  <span class="mjx-mo MJXc-space2">
                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.004em; padding-bottom: 0.298em;">⋅</span>
                  </span>
                  <span class="mjx-msubsup MJXc-space2">
                    <span class="mjx-base">
                      <span class="mjx-mn">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">10</span>
                      </span>
                    </span>
                    <span class="mjx-sup" style="font-size: 70.7%; vertical-align: 0.591em; padding-left: 0px; padding-right: 0.071em;">
                      <span class="mjx-texatom" style="">
                        <span class="mjx-mrow">
                          <span class="mjx-mn">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">19</span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>
            </span>
          </span>
        </span>&nbsp;possible Rubik's Cube states, and the log of that number is about 65.2
        <span class="footnote-reference" data-footnote-reference="" data-footnote-index="7" data-footnote-id="ikdk2gb237" role="doc-noteref" id="fnrefikdk2gb237">
          <sup>
            <a href="#fnikdk2gb237">[7]</a>
          </sup>
        </span>. Thus, a random Rubik's Cube state takes about 65 bits to specify.
        <span class="footnote-reference" data-footnote-reference="" data-footnote-index="8" data-footnote-id="ddpqvgrp58p" role="doc-noteref" id="fnrefddpqvgrp58p">
          <sup>
            <a href="#fnddpqvgrp58p">[8]</a>
          </sup>
        </span>
      </p>
      <figure class="image image_resized" style="width:342.836px">
        <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267418/mirroredImages/REA49tL5jsh69X3aM/ny7w2bhzkztwfkykd3lh.png" srcset="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/bzuwdlfee7nbantsuqti.png 200w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/vcfucaei6nmledxi9fiz.png 400w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/koooakj5lmn8b9zkboun.png 600w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/pvgzvabubxxrl4qnh9hh.png 800w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/ngurouglekbhbh2csfvx.png 1000w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/rlg3kk7ywfql7hz9j4c1.png 1200w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/bfjnf8xcfvcqivag3yyl.png 1400w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/dfrcbs1kplv7lsdos7af.png 1600w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/spqdtmx6ggvkjleeqcfd.png 1800w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267418/mirroredImages/REA49tL5jsh69X3aM/guvcjjqiwewsi3hcy45g.png 2000w">
          <figcaption>We could assign the empty string to the solved state, giving it zero entropy.</figcaption>
        </figure>
        <figure class="image image_resized" style="width:342.633px">
          <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267418/mirroredImages/REA49tL5jsh69X3aM/yfunbekdxgfvtahj4zbc.png" srcset="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/jfcsifpi8sx9u19gzvet.png 200w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/btbnqraugouppwfftlyn.png 400w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/xka9xdbxuaerfaqz7urb.png 600w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/mf27mxh8xsjwi0bta332.png 800w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/tbi9nlmxif8fsw3kvjhi.png 1000w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/biudaivshzccgjiy2bd2.png 1200w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/n5jbytghwiicbypb61xo.png 1400w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/yynlaqoqb2t7f7rbbbhe.png 1600w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/sqx7wq7xbo0cniyjkrvz.png 1800w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267418/mirroredImages/REA49tL5jsh69X3aM/e0skxtkc1sga32ztdguk.png 2000w">
            <figcaption>There are twelve one-move states, which could be assigned the strings from 0 to 101.</figcaption>
          </figure>
          <figure class="image image_resized" style="width:341.477px">
            <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267418/mirroredImages/REA49tL5jsh69X3aM/zk6zivsqbc7zp9gvk8nt.png" srcset="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/cufhme1jexjo2xvilymb.png 200w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/dszflevuyvspc5wrm2hq.png 400w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/xy5ososesyuuothjwedd.png 600w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/bamfachwvwhacux5r7sw.png 800w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/v8ms9hautnzyusjtuszu.png 1000w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/qqfoxr93dxaatudyn2ed.png 1200w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/nbafijdqw1swvxdqeddi.png 1400w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/kxjoenzdkzw7vg6evhih.png 1600w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/oj9ceu5awv20scst1mhq.png 1800w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267418/mirroredImages/REA49tL5jsh69X3aM/axacwz26dbfyfjpqxwg4.png 2000w">
              <figcaption>A random state like this would have a random binary string attached to it, like maybe 01100001100011011010010101100100111001001100011000110101001001001.</figcaption>
            </figure>
            <p>According to our above string-labeling, the solved state would have zero entropy. Similarly intuitively, almost-solved states would have almost-zero entropy. So if you turned one side a quarter turn, then maybe that state gets labeled with one bit of entropy. Perhaps we could carry on with this scheme, and label the states according to how many moves you need to restore the cube from that state to the solved state.
              <span class="footnote-reference" data-footnote-reference="" data-footnote-index="9" data-footnote-id="io9k70v4ks" role="doc-noteref" id="fnrefio9k70v4ks">
                <sup>
                  <a href="#fnio9k70v4ks">[9]</a>
                </sup>
              </span>&nbsp;There's nothing normative here; this just seems like a useful thing to do if you care about discussing how to solve a Rubik's Cube. You could always randomly assign binary strings to states. But we rarely want that; humans care a lot about patterns and regularities. And this is how entropy comes to be associated with the concept of "order". 
              <strong>The only reason order is associated with low entropy is because ordered states are rare.</strong> The set of ordered states is just one particular set of states that is much smaller than the whole set. And because it's a smaller set, we can assign the (intrinsically rare) smallest strings to the states in that set, and thus they get assigned lower entropy.
            </p>
            <p>You might object that ordered states are a 
              <i>very</i> special set! I would agree, but the way in which they are special has nothing to do with this abstract entropy (nor with the second law). The way in which they are special is simply the reason why we care about them in the first place. These reasons, and the exact nature of what "order" even is, constitute a whole separate subtle field of math. I'll talk about this in a future post; I think that "order" is synonymous with Kolmogorov complexity. It's somewhat unfortunate how often entropy and order are conflated, because the concept of order can be really confusing, and that confusion bleeds into confusion about entropy. But it's also worth noting that any reasonable definition of order (for example, particles in a smaller box being more ordered than particles in a bigger box, or particles in a crystal being more ordered than particles in a gas) would be a consistent definition of entropy. You'd just be deciding to assign the shorter labels to those states, and states that are "ordered" in some other way (e.g. corresponding to the digits of&nbsp;
              <span class="math-tex">
                <span class="mjpage">
                  <span class="mjx-chtml">
                    <span class="mjx-math" aria-label="\pi">
                      <span class="mjx-mrow" aria-hidden="true">
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em; padding-right: 0.003em;">π</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>) wouldn't get shorter labels. But this is fine as long as you remain consistent with that labeling.
            </p>
            <p>The binary string labeling scheme constitutes a form of absolute lower bound on average (or total) entropy. We can calculate that bound by summing the lengths of the first&nbsp;
              <span class="math-tex">
                <span class="mjpage">
                  <span class="mjx-chtml">
                    <span class="mjx-math" aria-label="W">
                      <span class="mjx-mrow" aria-hidden="true">
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>&nbsp;binary strings and dividing by&nbsp;
              <span class="math-tex">
                <span class="mjpage">
                  <span class="mjx-chtml">
                    <span class="mjx-math" aria-label="W">
                      <span class="mjx-mrow" aria-hidden="true">
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>.
              <span class="footnote-reference" data-footnote-reference="" data-footnote-index="10" data-footnote-id="8dysop0rn9w" role="doc-noteref" id="fnref8dysop0rn9w">
                <sup>
                  <a href="#fn8dysop0rn9w">[10]</a>
                </sup>
              </span>&nbsp;Let&nbsp;
              <span class="math-tex">
                <span class="mjpage">
                  <span class="mjx-chtml">
                    <span class="mjx-math" aria-label="S_W">
                      <span class="mjx-mrow" aria-hidden="true">
                        <span class="mjx-msubsup">
                          <span class="mjx-base" style="margin-right: -0.032em;">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.298em; padding-right: 0.032em;">S</span>
                            </span>
                          </span>
                          <span class="mjx-sub" style="font-size: 70.7%; vertical-align: -0.212em; padding-right: 0.071em;">
                            <span class="mjx-mi" style="">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>&nbsp;be the entropy of a set of&nbsp;
              <span class="math-tex">
                <span class="mjpage">
                  <span class="mjx-chtml">
                    <span class="mjx-math" aria-label="W">
                      <span class="mjx-mrow" aria-hidden="true">
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>&nbsp;states, and let&nbsp;
              <span class="math-tex">
                <span class="mjpage">
                  <span class="mjx-chtml">
                    <span class="mjx-math" aria-label="l(i)">
                      <span class="mjx-mrow" aria-hidden="true">
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em;">l</span>
                        </span>
                        <span class="mjx-mo">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                        </span>
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em;">i</span>
                        </span>
                        <span class="mjx-mo">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>&nbsp;be the length of the&nbsp;
              <span class="math-tex">
                <span class="mjpage">
                  <span class="mjx-chtml">
                    <span class="mjx-math" aria-label="i">
                      <span class="mjx-mrow" aria-hidden="true">
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em;">i</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>th binary string. Then the average is by definition
            </p>
            <span class="math-tex">
              <span class="mjpage mjpage__block">
                <span class="mjx-chtml MJXc-display" style="text-align: center;">
                  <span class="mjx-math" aria-label="\langle S_W \rangle = \frac{\sum_{i=0}^W l(i)}{W}.">
                    <span class="mjx-mrow" aria-hidden="true">
                      <span class="mjx-mo">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">⟨</span>
                      </span>
                      <span class="mjx-msubsup">
                        <span class="mjx-base" style="margin-right: -0.032em;">
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.298em; padding-right: 0.032em;">S</span>
                          </span>
                        </span>
                        <span class="mjx-sub" style="font-size: 70.7%; vertical-align: -0.212em; padding-right: 0.071em;">
                          <span class="mjx-mi" style="">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                          </span>
                        </span>
                      </span>
                      <span class="mjx-mo">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">⟩</span>
                      </span>
                      <span class="mjx-mo MJXc-space3">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                      </span>
                      <span class="mjx-mfrac MJXc-space3">
                        <span class="mjx-box MJXc-stacked" style="width: 4.027em; padding: 0px 0.12em;">
                          <span class="mjx-numerator" style="width: 4.027em; top: -1.886em;">
                            <span class="mjx-mrow">
                              <span class="mjx-munderover">
                                <span class="mjx-base">
                                  <span class="mjx-mo">
                                    <span class="mjx-char MJXc-TeX-size1-R" style="padding-top: 0.519em; padding-bottom: 0.519em;">∑</span>
                                  </span>
                                </span>
                                <span class="mjx-stack" style="vertical-align: -0.31em;">
                                  <span class="mjx-sup" style="font-size: 70.7%; padding-bottom: 0.411em; padding-left: 0px; padding-right: 0.071em;">
                                    <span class="mjx-mi" style="">
                                      <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                                    </span>
                                  </span>
                                  <span class="mjx-sub" style="font-size: 70.7%; padding-right: 0.071em;">
                                    <span class="mjx-texatom" style="">
                                      <span class="mjx-mrow">
                                        <span class="mjx-mi">
                                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em;">i</span>
                                        </span>
                                        <span class="mjx-mo">
                                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                                        </span>
                                        <span class="mjx-mn">
                                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">0</span>
                                        </span>
                                      </span>
                                    </span>
                                  </span>
                                </span>
                              </span>
                              <span class="mjx-mi MJXc-space1">
                                <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em;">l</span>
                              </span>
                              <span class="mjx-mo">
                                <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                              </span>
                              <span class="mjx-mi">
                                <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em;">i</span>
                              </span>
                              <span class="mjx-mo">
                                <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                              </span>
                            </span>
                          </span>
                          <span class="mjx-denominator" style="width: 4.027em; bottom: -0.795em;">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                            </span>
                          </span>
                          <span style="border-bottom: 1.3px solid; top: -0.296em; width: 4.027em;" class="mjx-line"></span>
                        </span>
                        <span style="height: 2.682em; vertical-align: -0.795em;" class="mjx-vsize"></span>
                      </span>
                      <span class="mjx-mo">
                        <span class="mjx-char MJXc-TeX-main-R" style="margin-top: -0.144em; padding-bottom: 0.372em;">.</span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>
            </span>
            <p>By looking at the above image of the first 31 binary strings, we can see that for&nbsp;
              <span class="math-tex">
                <span class="mjpage">
                  <span class="mjx-chtml">
                    <span class="mjx-math" aria-label="W = 2^n - 1">
                      <span class="mjx-mrow" aria-hidden="true">
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                        </span>
                        <span class="mjx-mo MJXc-space3">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                        </span>
                        <span class="mjx-msubsup MJXc-space3">
                          <span class="mjx-base">
                            <span class="mjx-mn">
                              <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">2</span>
                            </span>
                          </span>
                          <span class="mjx-sup" style="font-size: 70.7%; vertical-align: 0.591em; padding-left: 0px; padding-right: 0.071em;">
                            <span class="mjx-mi" style="">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">n</span>
                            </span>
                          </span>
                        </span>
                        <span class="mjx-mo MJXc-space2">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.298em; padding-bottom: 0.446em;">−</span>
                        </span>
                        <span class="mjx-mn MJXc-space2">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">1</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>,
            </p>
            <span class="math-tex">
              <span class="mjpage mjpage__block">
                <span class="mjx-chtml MJXc-display" style="text-align: center;">
                  <span class="mjx-math" aria-label="\sum_{i=0}^W l(i) = \sum_{l=0}^{n - 1} 2^l \cdot l,">
                    <span class="mjx-mrow" aria-hidden="true">
                      <span class="mjx-munderover">
                        <span class="mjx-itable">
                          <span class="mjx-row">
                            <span class="mjx-cell">
                              <span class="mjx-stack">
                                <span class="mjx-over" style="font-size: 70.7%; padding-bottom: 0.236em; padding-top: 0.141em; padding-left: 0.497em;">
                                  <span class="mjx-mi" style="">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                                  </span>
                                </span>
                                <span class="mjx-op">
                                  <span class="mjx-mo">
                                    <span class="mjx-char MJXc-TeX-size2-R" style="padding-top: 0.74em; padding-bottom: 0.74em;">∑</span>
                                  </span>
                                </span>
                              </span>
                            </span>
                          </span>
                          <span class="mjx-row">
                            <span class="mjx-under" style="font-size: 70.7%; padding-top: 0.236em; padding-bottom: 0.141em; padding-left: 0.21em;">
                              <span class="mjx-texatom" style="">
                                <span class="mjx-mrow">
                                  <span class="mjx-mi">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em;">i</span>
                                  </span>
                                  <span class="mjx-mo">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                                  </span>
                                  <span class="mjx-mn">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">0</span>
                                  </span>
                                </span>
                              </span>
                            </span>
                          </span>
                        </span>
                      </span>
                      <span class="mjx-mi MJXc-space1">
                        <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em;">l</span>
                      </span>
                      <span class="mjx-mo">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                      </span>
                      <span class="mjx-mi">
                        <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em;">i</span>
                      </span>
                      <span class="mjx-mo">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                      </span>
                      <span class="mjx-mo MJXc-space3">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                      </span>
                      <span class="mjx-munderover MJXc-space3">
                        <span class="mjx-itable">
                          <span class="mjx-row">
                            <span class="mjx-cell">
                              <span class="mjx-stack">
                                <span class="mjx-over" style="font-size: 70.7%; padding-bottom: 0.176em; padding-top: 0.141em; padding-left: 0.082em;">
                                  <span class="mjx-texatom" style="">
                                    <span class="mjx-mrow">
                                      <span class="mjx-mi">
                                        <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">n</span>
                                      </span>
                                      <span class="mjx-mo">
                                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.298em; padding-bottom: 0.446em;">−</span>
                                      </span>
                                      <span class="mjx-mn">
                                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">1</span>
                                      </span>
                                    </span>
                                  </span>
                                </span>
                                <span class="mjx-op">
                                  <span class="mjx-mo">
                                    <span class="mjx-char MJXc-TeX-size2-R" style="padding-top: 0.74em; padding-bottom: 0.74em;">∑</span>
                                  </span>
                                </span>
                              </span>
                            </span>
                          </span>
                          <span class="mjx-row">
                            <span class="mjx-under" style="font-size: 70.7%; padding-top: 0.236em; padding-bottom: 0.141em; padding-left: 0.233em;">
                              <span class="mjx-texatom" style="">
                                <span class="mjx-mrow">
                                  <span class="mjx-mi">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em;">l</span>
                                  </span>
                                  <span class="mjx-mo">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                                  </span>
                                  <span class="mjx-mn">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">0</span>
                                  </span>
                                </span>
                              </span>
                            </span>
                          </span>
                        </span>
                      </span>
                      <span class="mjx-msubsup MJXc-space1">
                        <span class="mjx-base">
                          <span class="mjx-mn">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">2</span>
                          </span>
                        </span>
                        <span class="mjx-sup" style="font-size: 70.7%; vertical-align: 0.591em; padding-left: 0px; padding-right: 0.071em;">
                          <span class="mjx-mi" style="">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em;">l</span>
                          </span>
                        </span>
                      </span>
                      <span class="mjx-mo MJXc-space2">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.004em; padding-bottom: 0.298em;">⋅</span>
                      </span>
                      <span class="mjx-mi MJXc-space2">
                        <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em;">l</span>
                      </span>
                      <span class="mjx-mo">
                        <span class="mjx-char MJXc-TeX-main-R" style="margin-top: -0.144em; padding-bottom: 0.519em;">,</span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>
            </span>
            <p>which is to say that you can sum all the lengths&nbsp;
              <span class="math-tex">
                <span class="mjpage">
                  <span class="mjx-chtml">
                    <span class="mjx-math" aria-label="l(i)">
                      <span class="mjx-mrow" aria-hidden="true">
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em;">l</span>
                        </span>
                        <span class="mjx-mo">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                        </span>
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em;">i</span>
                        </span>
                        <span class="mjx-mo">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>&nbsp;by breaking it up into terms of each length&nbsp;
              <span class="math-tex">
                <span class="mjpage">
                  <span class="mjx-chtml">
                    <span class="mjx-math" aria-label="l">
                      <span class="mjx-mrow" aria-hidden="true">
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em;">l</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>&nbsp;times the number of strings of that length (
              <span class="math-tex">
                <span class="mjpage">
                  <span class="mjx-chtml">
                    <span class="mjx-math" aria-label="2^l">
                      <span class="mjx-mrow" aria-hidden="true">
                        <span class="mjx-msubsup">
                          <span class="mjx-base">
                            <span class="mjx-mn">
                              <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">2</span>
                            </span>
                          </span>
                          <span class="mjx-sup" style="font-size: 70.7%; vertical-align: 0.591em; padding-left: 0px; padding-right: 0.071em;">
                            <span class="mjx-mi" style="">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em;">l</span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>). Next, it can be shown by induction that that sum has a closed form;
            </p>
            <span class="math-tex">
              <span class="mjpage mjpage__block">
                <span class="mjx-chtml MJXc-display" style="text-align: center;">
                  <span class="mjx-math" aria-label="\sum_{l=0}^{n - 1} 2^l \cdot l = 2^n(n - 1) - 2^n + 2.">
                    <span class="mjx-mrow" aria-hidden="true">
                      <span class="mjx-munderover">
                        <span class="mjx-itable">
                          <span class="mjx-row">
                            <span class="mjx-cell">
                              <span class="mjx-stack">
                                <span class="mjx-over" style="font-size: 70.7%; padding-bottom: 0.176em; padding-top: 0.141em; padding-left: 0.082em;">
                                  <span class="mjx-texatom" style="">
                                    <span class="mjx-mrow">
                                      <span class="mjx-mi">
                                        <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">n</span>
                                      </span>
                                      <span class="mjx-mo">
                                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.298em; padding-bottom: 0.446em;">−</span>
                                      </span>
                                      <span class="mjx-mn">
                                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">1</span>
                                      </span>
                                    </span>
                                  </span>
                                </span>
                                <span class="mjx-op">
                                  <span class="mjx-mo">
                                    <span class="mjx-char MJXc-TeX-size2-R" style="padding-top: 0.74em; padding-bottom: 0.74em;">∑</span>
                                  </span>
                                </span>
                              </span>
                            </span>
                          </span>
                          <span class="mjx-row">
                            <span class="mjx-under" style="font-size: 70.7%; padding-top: 0.236em; padding-bottom: 0.141em; padding-left: 0.233em;">
                              <span class="mjx-texatom" style="">
                                <span class="mjx-mrow">
                                  <span class="mjx-mi">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em;">l</span>
                                  </span>
                                  <span class="mjx-mo">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                                  </span>
                                  <span class="mjx-mn">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">0</span>
                                  </span>
                                </span>
                              </span>
                            </span>
                          </span>
                        </span>
                      </span>
                      <span class="mjx-msubsup MJXc-space1">
                        <span class="mjx-base">
                          <span class="mjx-mn">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">2</span>
                          </span>
                        </span>
                        <span class="mjx-sup" style="font-size: 70.7%; vertical-align: 0.591em; padding-left: 0px; padding-right: 0.071em;">
                          <span class="mjx-mi" style="">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em;">l</span>
                          </span>
                        </span>
                      </span>
                      <span class="mjx-mo MJXc-space2">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.004em; padding-bottom: 0.298em;">⋅</span>
                      </span>
                      <span class="mjx-mi MJXc-space2">
                        <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em;">l</span>
                      </span>
                      <span class="mjx-mo MJXc-space3">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                      </span>
                      <span class="mjx-msubsup MJXc-space3">
                        <span class="mjx-base">
                          <span class="mjx-mn">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">2</span>
                          </span>
                        </span>
                        <span class="mjx-sup" style="font-size: 70.7%; vertical-align: 0.591em; padding-left: 0px; padding-right: 0.071em;">
                          <span class="mjx-mi" style="">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">n</span>
                          </span>
                        </span>
                      </span>
                      <span class="mjx-mo">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                      </span>
                      <span class="mjx-mi">
                        <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">n</span>
                      </span>
                      <span class="mjx-mo MJXc-space2">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.298em; padding-bottom: 0.446em;">−</span>
                      </span>
                      <span class="mjx-mn MJXc-space2">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">1</span>
                      </span>
                      <span class="mjx-mo">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                      </span>
                      <span class="mjx-mo MJXc-space2">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.298em; padding-bottom: 0.446em;">−</span>
                      </span>
                      <span class="mjx-msubsup MJXc-space2">
                        <span class="mjx-base">
                          <span class="mjx-mn">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">2</span>
                          </span>
                        </span>
                        <span class="mjx-sup" style="font-size: 70.7%; vertical-align: 0.591em; padding-left: 0px; padding-right: 0.071em;">
                          <span class="mjx-mi" style="">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">n</span>
                          </span>
                        </span>
                      </span>
                      <span class="mjx-mo MJXc-space2">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.298em; padding-bottom: 0.446em;">+</span>
                      </span>
                      <span class="mjx-mn MJXc-space2">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">2.</span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>
            </span>
            <p>Substituting back in&nbsp;
              <span class="math-tex">
                <span class="mjpage">
                  <span class="mjx-chtml">
                    <span class="mjx-math" aria-label="n = \log(W + 1)">
                      <span class="mjx-mrow" aria-hidden="true">
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">n</span>
                        </span>
                        <span class="mjx-mo MJXc-space3">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                        </span>
                        <span class="mjx-mi MJXc-space3">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                        </span>
                        <span class="mjx-mo">
                          <span class="mjx-char"></span>
                        </span>
                        <span class="mjx-mo">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                        </span>
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                        </span>
                        <span class="mjx-mo MJXc-space2">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.298em; padding-bottom: 0.446em;">+</span>
                        </span>
                        <span class="mjx-mn MJXc-space2">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">1</span>
                        </span>
                        <span class="mjx-mo">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>,&nbsp;dividing by&nbsp;
              <span class="math-tex">
                <span class="mjpage">
                  <span class="mjx-chtml">
                    <span class="mjx-math" aria-label="W">
                      <span class="mjx-mrow" aria-hidden="true">
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>, and doing algebraic manipulation, we get that
            </p>
            <span class="math-tex">
              <span class="mjpage mjpage__block">
                <span class="mjx-chtml MJXc-display" style="text-align: center;">
                  <span class="mjx-math" aria-label="\langle S_W \rangle \leq \log(W+1) - 2 + \frac{\log(W+1)}{W}.">
                    <span class="mjx-mrow" aria-hidden="true">
                      <span class="mjx-mo">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">⟨</span>
                      </span>
                      <span class="mjx-msubsup">
                        <span class="mjx-base" style="margin-right: -0.032em;">
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.298em; padding-right: 0.032em;">S</span>
                          </span>
                        </span>
                        <span class="mjx-sub" style="font-size: 70.7%; vertical-align: -0.212em; padding-right: 0.071em;">
                          <span class="mjx-mi" style="">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                          </span>
                        </span>
                      </span>
                      <span class="mjx-mo">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">⟩</span>
                      </span>
                      <span class="mjx-mo MJXc-space3">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.446em;">≤</span>
                      </span>
                      <span class="mjx-mi MJXc-space3">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                      </span>
                      <span class="mjx-mo">
                        <span class="mjx-char"></span>
                      </span>
                      <span class="mjx-mo">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                      </span>
                      <span class="mjx-mi">
                        <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                      </span>
                      <span class="mjx-mo MJXc-space2">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.298em; padding-bottom: 0.446em;">+</span>
                      </span>
                      <span class="mjx-mn MJXc-space2">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">1</span>
                      </span>
                      <span class="mjx-mo">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                      </span>
                      <span class="mjx-mo MJXc-space2">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.298em; padding-bottom: 0.446em;">−</span>
                      </span>
                      <span class="mjx-mn MJXc-space2">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">2</span>
                      </span>
                      <span class="mjx-mo MJXc-space2">
                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.298em; padding-bottom: 0.446em;">+</span>
                      </span>
                      <span class="mjx-mfrac MJXc-space2">
                        <span class="mjx-box MJXc-stacked" style="width: 5.026em; padding: 0px 0.12em;">
                          <span class="mjx-numerator" style="width: 5.026em; top: -1.59em;">
                            <span class="mjx-mrow">
                              <span class="mjx-mi">
                                <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                              </span>
                              <span class="mjx-mo">
                                <span class="mjx-char"></span>
                              </span>
                              <span class="mjx-mo">
                                <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                              </span>
                              <span class="mjx-mi">
                                <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                              </span>
                              <span class="mjx-mo MJXc-space2">
                                <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.298em; padding-bottom: 0.446em;">+</span>
                              </span>
                              <span class="mjx-mn MJXc-space2">
                                <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">1</span>
                              </span>
                              <span class="mjx-mo">
                                <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                              </span>
                            </span>
                          </span>
                          <span class="mjx-denominator" style="width: 5.026em; bottom: -0.795em;">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                            </span>
                          </span>
                          <span style="border-bottom: 1.3px solid; top: -0.296em; width: 5.026em;" class="mjx-line"></span>
                        </span>
                        <span style="height: 2.385em; vertical-align: -0.795em;" class="mjx-vsize"></span>
                      </span>
                      <span class="mjx-mo">
                        <span class="mjx-char MJXc-TeX-main-R" style="margin-top: -0.144em; padding-bottom: 0.372em;">.</span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>
            </span>
            <p>This is a very tight inequality. It's exact when&nbsp;
              <span class="math-tex">
                <span class="mjpage">
                  <span class="mjx-chtml">
                    <span class="mjx-math" aria-label="W = 2^n - 1">
                      <span class="mjx-mrow" aria-hidden="true">
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                        </span>
                        <span class="mjx-mo MJXc-space3">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                        </span>
                        <span class="mjx-msubsup MJXc-space3">
                          <span class="mjx-base">
                            <span class="mjx-mn">
                              <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">2</span>
                            </span>
                          </span>
                          <span class="mjx-sup" style="font-size: 70.7%; vertical-align: 0.591em; padding-left: 0px; padding-right: 0.071em;">
                            <span class="mjx-mi" style="">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">n</span>
                            </span>
                          </span>
                        </span>
                        <span class="mjx-mo MJXc-space2">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.298em; padding-bottom: 0.446em;">−</span>
                        </span>
                        <span class="mjx-mn MJXc-space2">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">1</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>, and&nbsp;
              <span class="math-tex">
                <span class="mjpage">
                  <span class="mjx-chtml">
                    <span class="mjx-math" aria-label="\langle S_W \rangle">
                      <span class="mjx-mrow" aria-hidden="true">
                        <span class="mjx-mo">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">⟨</span>
                        </span>
                        <span class="mjx-msubsup">
                          <span class="mjx-base" style="margin-right: -0.032em;">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.298em; padding-right: 0.032em;">S</span>
                            </span>
                          </span>
                          <span class="mjx-sub" style="font-size: 70.7%; vertical-align: -0.212em; padding-right: 0.071em;">
                            <span class="mjx-mi" style="">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                            </span>
                          </span>
                        </span>
                        <span class="mjx-mo">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">⟩</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>&nbsp;is monotonic, and&nbsp;
              <span class="math-tex">
                <span class="mjpage">
                  <span class="mjx-chtml">
                    <span class="mjx-math" aria-label="\log">
                      <span class="mjx-mrow" aria-hidden="true">
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>&nbsp;grows very slowly.
            </p>
            <p>The three terms are ordered by their 
              <a href="https://en.wikipedia.org/wiki/Big_O_notation">big-O</a> behavior. In the limit of large numbers of states, we really don't care about the smaller terms, and we use&nbsp;
              <span class="math-tex">
                <span class="mjpage">
                  <span class="mjx-chtml">
                    <span class="mjx-math" aria-label="\langle S_W \rangle = O(\log W)">
                      <span class="mjx-mrow" aria-hidden="true">
                        <span class="mjx-mo">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">⟨</span>
                        </span>
                        <span class="mjx-msubsup">
                          <span class="mjx-base" style="margin-right: -0.032em;">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.298em; padding-right: 0.032em;">S</span>
                            </span>
                          </span>
                          <span class="mjx-sub" style="font-size: 70.7%; vertical-align: -0.212em; padding-right: 0.071em;">
                            <span class="mjx-mi" style="">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                            </span>
                          </span>
                        </span>
                        <span class="mjx-mo">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">⟩</span>
                        </span>
                        <span class="mjx-mo MJXc-space3">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                        </span>
                        <span class="mjx-mi MJXc-space3">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.298em;">O</span>
                        </span>
                        <span class="mjx-mo">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                        </span>
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                        </span>
                        <span class="mjx-mo">
                          <span class="mjx-char"></span>
                        </span>
                        <span class="mjx-mi MJXc-space1">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                        </span>
                        <span class="mjx-mo">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>. Thus, the average entropy grows as the length of the longest strings in the set.
            </p>
            <h3>Yes/no questions</h3>
            <p>There's another very natural way we could use bits to distinguish one state from a set of states (especially when all the states are the same to us). This method is identical to the kids' game 
              <a href="https://en.wikipedia.org/wiki/Guess_Who%3F">Guess Who?</a>. In this game, you and your opponent each pick a person card from a fixed set of possible person cards. Then you try to guess which card your opponent has picked by asking yes-or-no questions about the person, like, "Do they have blonde hair?". You each have a board in front of you with copies of all the cards, so you can flip down the ones you've eliminated (which is highly satisfying). The way to minimize the expected number of questions you'll need to guess the person
              <span class="footnote-reference" data-footnote-reference="" data-footnote-index="11" data-footnote-id="krma9vb21f" role="doc-noteref" id="fnrefkrma9vb21f">
                <sup>
                  <a href="#fnkrma9vb21f">[11]</a>
                </sup>
              </span>&nbsp;is to ask questions that eliminate half
              <span class="footnote-reference" data-footnote-reference="" data-footnote-index="12" data-footnote-id="y50eygbc9ig" role="doc-noteref" id="fnrefy50eygbc9ig">
                <sup>
                  <a href="#fny50eygbc9ig">[12]</a>
                </sup>
              </span>&nbsp;the remaining possible cards. If you start with&nbsp;
              <span class="math-tex">
                <span class="mjpage">
                  <span class="mjx-chtml">
                    <span class="mjx-math" aria-label="W = 2^n">
                      <span class="mjx-mrow" aria-hidden="true">
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                        </span>
                        <span class="mjx-mo MJXc-space3">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                        </span>
                        <span class="mjx-msubsup MJXc-space3">
                          <span class="mjx-base">
                            <span class="mjx-mn">
                              <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">2</span>
                            </span>
                          </span>
                          <span class="mjx-sup" style="font-size: 70.7%; vertical-align: 0.591em; padding-left: 0px; padding-right: 0.071em;">
                            <span class="mjx-mi" style="">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">n</span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>&nbsp;cards, then this will require&nbsp;
              <span class="math-tex">
                <span class="mjpage">
                  <span class="mjx-chtml">
                    <span class="mjx-math" aria-label="n">
                      <span class="mjx-mrow" aria-hidden="true">
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">n</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>&nbsp;questions, and therefore you'll use&nbsp;
              <span class="math-tex">
                <span class="mjpage">
                  <span class="mjx-chtml">
                    <span class="mjx-math" aria-label="n">
                      <span class="mjx-mrow" aria-hidden="true">
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">n</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>&nbsp;bits of information to pinpoint a state, making your entropy equal to&nbsp;
              <span class="math-tex">
                <span class="mjpage">
                  <span class="mjx-chtml">
                    <span class="mjx-math" aria-label="n = \log(W)">
                      <span class="mjx-mrow" aria-hidden="true">
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">n</span>
                        </span>
                        <span class="mjx-mo MJXc-space3">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                        </span>
                        <span class="mjx-mi MJXc-space3">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                        </span>
                        <span class="mjx-mo">
                          <span class="mjx-char"></span>
                        </span>
                        <span class="mjx-mo">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                        </span>
                        <span class="mjx-mi">
                          <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                        </span>
                        <span class="mjx-mo">
                          <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>. This is your entropy for 
              <i>every</i> specific card; you never assign a card zero entropy.
            </p>
            <figure class="image">
              <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267418/mirroredImages/REA49tL5jsh69X3aM/k7asndjp0qkchc5j7sj1.gif" srcset="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/j4dvcida0tx873530rgb.gif 200w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/dpfbqm72nx2fcyqupjhd.gif 400w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/h1gffamcubuot6hbn3pd.gif 600w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/oeqbnjnwslvsbgtg8rxp.gif 800w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/osdlgdqdfjvdzhdj8v7l.gif 1000w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/akojfncoxivxto7c3zaj.gif 1200w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/plqsjs6ibzltzqrwnzub.gif 1400w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/oepy3lopmdmqkpagfeqt.gif 1600w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/tln7kfro0i5nzf6jp1ks.gif 1800w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267418/mirroredImages/REA49tL5jsh69X3aM/xhp1l2lfrlpeyyrxak8u.gif 2000w">
                <figcaption>An illustration of one player's view of Guess Who?.</figcaption>
              </figure>
              <p>This way of measuring entropy is usually more useful for macrostates, because typically we have a huge number of microstates in a macrostate, and we don't care about any of the individual ones, just how many there are. So to assign entropy to a microstate in this case, we just look at which macrostate it's in (e.g. check its temperature), calculate the number of possible microstates that are consistent with that macrostate, and take the log.</p>
              <p>If a Rubik's Cube is in the macrostate of being one move away from solved, then (since there are 12 such (micro)states) according to the yes/no questions method of assigning entropy, that macrostate has an entropy of&nbsp;
                <span class="math-tex">
                  <span class="mjpage">
                    <span class="mjx-chtml">
                      <span class="mjx-math" aria-label="\log(12) = 3.58">
                        <span class="mjx-mrow" aria-hidden="true">
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char"></span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                          </span>
                          <span class="mjx-mn">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">12</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                          </span>
                          <span class="mjx-mo MJXc-space3">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                          </span>
                          <span class="mjx-mn MJXc-space3">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">3.58</span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>&nbsp;bits. The number of microstates in the macrostate "one face is solved" is much, much higher, and so that macrostate has a much higher entropy. As we'll talk about in a later post, increased temperature means an increased number of possible microstates, so a higher-temperature object has higher entropy.
              </p>
              <h3>How they compare</h3>
              <p>You may notice that while the binary string model gives us&nbsp;
                <span class="math-tex">
                  <span class="mjpage">
                    <span class="mjx-chtml">
                      <span class="mjx-math" aria-label="O(\log W)">
                        <span class="mjx-mrow" aria-hidden="true">
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.298em;">O</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                          </span>
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char"></span>
                          </span>
                          <span class="mjx-mi MJXc-space1">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>&nbsp;entropy, the yes/no question model gives us 
                <i>exactly</i>&nbsp;
                <span class="math-tex">
                  <span class="mjpage">
                    <span class="mjx-chtml">
                      <span class="mjx-math" aria-label="\log(W)">
                        <span class="mjx-mrow" aria-hidden="true">
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char"></span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                          </span>
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
                <span class="footnote-reference" data-footnote-reference="" data-footnote-index="13" data-footnote-id="9i6jb0p1fl" role="doc-noteref" id="fnref9i6jb0p1fl">
                  <sup>
                    <a href="#fn9i6jb0p1fl">[13]</a>
                  </sup>
                </span>. This reveals an underlying subtlety about our models. The label-assignment form of entropy is somewhat 
                <i>less</i> than the binary questions form of entropy. Both are formalizations of the number of bits you need to describe something. But the question-answering thing seems like a pretty solidly optimal strategy; how could you possibly do it in fewer bits?
              </p>
              <p>Imagine that the questions are fixed. For every state (e.g. Guess Who? card), the answers to the series of questions are just a list of yeses and nos, which is the same as a binary string. So each state could be said to be labeled with a binary string which is&nbsp;
                <span class="math-tex">
                  <span class="mjpage">
                    <span class="mjx-chtml">
                      <span class="mjx-math" aria-label="\log(W)">
                        <span class="mjx-mrow" aria-hidden="true">
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char"></span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                          </span>
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>&nbsp;bits long. This is now just like our previous binary string strategy, except that setup uses the strings of all lengths 
                <i>up to</i>&nbsp;
                <span class="math-tex">
                  <span class="mjpage">
                    <span class="mjx-chtml">
                      <span class="mjx-math" aria-label="\log(W)">
                        <span class="mjx-mrow" aria-hidden="true">
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char"></span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                          </span>
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>, and this one uses only strings of 
                <i>exactly</i> length&nbsp;
                <span class="math-tex">
                  <span class="mjpage">
                    <span class="mjx-chtml">
                      <span class="mjx-math" aria-label="\log(W)">
                        <span class="mjx-mrow" aria-hidden="true">
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char"></span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                          </span>
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>.
              </p>
              <p>The difference is that, if you had the states labeled with the shorter strings, and you were playing the game by asking a series of questions (equivalent to "Is the card's label's first bit 0?"), then you would sometimes reach the end of a binary string before you'd asked all&nbsp;
                <span class="math-tex">
                  <span class="mjpage">
                    <span class="mjx-chtml">
                      <span class="mjx-math" aria-label="\log(W)">
                        <span class="mjx-mrow" aria-hidden="true">
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char"></span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                          </span>
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>&nbsp;questions. If the state happened to be the one labeled with just a 0, and your first question was, "Is the first bit a 0?" then the answer would be "yes" – but also, there would be further information, which is that there were no more bits left in the string. So in this formulation, that's equivalent to there being 
                <i>three</i> pieces of information: "yes", "no" and "all done". If you were expecting only two possible answers, this could be considered a type of cheating, smuggling in extra information. It's as if all the finite binary strings need to have a special terminating character at the end.
              </p>
              <p>So, the minimum average number of bits you need to distinguish a state depends on whether you're handed a whole label all at once (and know that's the whole label), or whether you need to query for the label one bit at a time (and figure out for yourself when you've received the whole label).</p>
              <h2>Exactly what is a bit?</h2>
              <p>In the opening definition of entropy, I used the word "bit", but didn't define it. Now that we've talked about cutting sets of states in half, it's a good time to pause and point out that 
                <i>that</i> is what a bit is. It's often very natural and useful to think of bits as thing-like, i.e. of bits as existing, of there being a certain number of bits "in" something, or of them moving around through space. This is true in some cases, especially in computer storage, but it can be confusing because that's not really how it works in general.
                <span class="footnote-reference" data-footnote-reference="" data-footnote-index="14" data-footnote-id="thq2hgp2ob" role="doc-noteref" id="fnrefthq2hgp2ob">
                  <sup>
                    <a href="#fnthq2hgp2ob">[14]</a>
                  </sup>
                </span>&nbsp;It's often 
                <i>not</i> the case that the bits are somewhere specific, even though it feels like they're "in there", and that can contribute to them (and entropy) feeling elusive and mysterious.
              </p>
              <p>For a state to "have" a bit "in" it just means that there was another way for that state to be (which it is not). If a state has a degree of freedom in it that has two possible values, then you can coherently think of the bit as being "in" that degree of freedom. But note that this relies on counterfactual alternatives; it is not 
                <i>inherently</i> inside the specific state.
              </p>
              <p>Concretely, a state could have a simple switch in it (or a particle with up or down spin, or an object which could be in either of two boxes). If half of the entire set of possible states has the switch on, and the other half has the switch off, then I think it's fair to say that the bit is in the switch, or that the switch is one bit of entropy (or information). However, if 99% of states have the switch on and 1% have it off, then it contains significantly less than one bit, and if 
                <i>all</i> states have the switch on, then it is zero bits.
              </p>
              <p>As a simple example of a bit not being clearly located, consider a system that is just a bunch of balls in a box, where the set of possible states is just different numbers of balls. One way to divide up the state space is between states with an even number of balls versus states with an odd number of balls. This divides the state space in half, and that constitutes a bit of information that does not reside somewhere specific; it can be "flipped" by removing any single ball.</p>
              <p>Thus, you can also see that just because you've defined a bit somewhere, it doesn't mean that feature 
                <i>must</i> represent a bit. Though the quantity "the number of times you can cut the state space in half" is an objective property of a state space, the exact 
                <i>ways</i> that you cut the space in half are arbitrary. So just because your state contains a switch that could be flipped does not mean that the switch 
                <i>must</i> represent a bit.
              </p>
              <figure class="image">
                <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/igim4qyzqda1kpe09dke.png" srcset="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/lczaoc0jdhugbbc0giaa.png 200w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/tqbstdzytqphart9eo6k.png 400w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/qah4d5tgnet5xbqjwhki.png 600w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/jjvcvstluyo7r5yyq0kk.png 800w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/we4lkm8gwnpsbfdk9q5l.png 1000w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/nxviknkaiwklxqcacyt5.png 1200w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/alrwacbuzw4hkqqrokkt.png 1400w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/fk0ccxvhlhdcompdv2cj.png 1600w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267419/mirroredImages/REA49tL5jsh69X3aM/qhsetwrcciopcdlwsll8.png 1800w, https://res.cloudinary.com/lesswrong-2-0/image/upload/v1674267418/mirroredImages/REA49tL5jsh69X3aM/qdbyzbnnwie5uvej2wkg.png 2000w">
                  <figcaption>If you have a system with four states A, B, C and D, and your first bit is {A, B}/{C, D}, then your second bit could either be {A, C}/{B, D} or {A, D}/{B, C}. Either way, the entropy of the system is exactly two bits.</figcaption>
                </figure>
                <h2>Probabilities over states</h2>
                <p>In all of the above discussion of average entropies, we implicitly treated the states as equally likely. This is not always true, and it's also a problematic premise if there are 
                  <a href="https://www.lesswrong.com/posts/yJorhsuEKCbYrycav/dealing-with-infinite-entropy">infinitely many states</a>. If you want to get the average entropy when some states are more likely than others, then you can just take a standard expected value:
                </p>
                <span class="math-tex">
                  <span class="mjpage mjpage__block">
                    <span class="mjx-chtml MJXc-display" style="text-align: center;">
                      <span class="mjx-math" aria-label="\mathbb{E}[S_X] = \sum_{x \in X} {p(x) S(x)}.">
                        <span class="mjx-mrow" aria-hidden="true">
                          <span class="mjx-texatom">
                            <span class="mjx-mrow">
                              <span class="mjx-mi">
                                <span class="mjx-char MJXc-TeX-ams-R" style="padding-top: 0.446em; padding-bottom: 0.298em;">E</span>
                              </span>
                            </span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">[</span>
                          </span>
                          <span class="mjx-msubsup">
                            <span class="mjx-base" style="margin-right: -0.032em;">
                              <span class="mjx-mi">
                                <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.298em; padding-right: 0.032em;">S</span>
                              </span>
                            </span>
                            <span class="mjx-sub" style="font-size: 70.7%; vertical-align: -0.212em; padding-right: 0.071em;">
                              <span class="mjx-mi" style="">
                                <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.024em;">X</span>
                              </span>
                            </span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">]</span>
                          </span>
                          <span class="mjx-mo MJXc-space3">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                          </span>
                          <span class="mjx-munderover MJXc-space3">
                            <span class="mjx-itable">
                              <span class="mjx-row">
                                <span class="mjx-cell">
                                  <span class="mjx-op" style="padding-left: 0.017em;">
                                    <span class="mjx-mo">
                                      <span class="mjx-char MJXc-TeX-size2-R" style="padding-top: 0.74em; padding-bottom: 0.74em;">∑</span>
                                    </span>
                                  </span>
                                </span>
                              </span>
                              <span class="mjx-row">
                                <span class="mjx-under" style="font-size: 70.7%; padding-top: 0.236em; padding-bottom: 0.141em;">
                                  <span class="mjx-texatom" style="">
                                    <span class="mjx-mrow">
                                      <span class="mjx-mi">
                                        <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                                      </span>
                                      <span class="mjx-mo">
                                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.225em; padding-bottom: 0.372em;">∈</span>
                                      </span>
                                      <span class="mjx-mi">
                                        <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.024em;">X</span>
                                      </span>
                                    </span>
                                  </span>
                                </span>
                              </span>
                            </span>
                          </span>
                          <span class="mjx-texatom MJXc-space1">
                            <span class="mjx-mrow">
                              <span class="mjx-mi">
                                <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.446em;">p</span>
                              </span>
                              <span class="mjx-mo">
                                <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                              </span>
                              <span class="mjx-mi">
                                <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                              </span>
                              <span class="mjx-mo">
                                <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                              </span>
                              <span class="mjx-mi">
                                <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.298em; padding-right: 0.032em;">S</span>
                              </span>
                              <span class="mjx-mo">
                                <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                              </span>
                              <span class="mjx-mi">
                                <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                              </span>
                              <span class="mjx-mo">
                                <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                              </span>
                            </span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="margin-top: -0.144em; padding-bottom: 0.372em;">.</span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
                <p>Here,&nbsp;
                  <span class="math-tex">
                    <span class="mjpage">
                      <span class="mjx-chtml">
                        <span class="mjx-math" aria-label="S">
                          <span class="mjx-mrow" aria-hidden="true">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.298em; padding-right: 0.032em;">S</span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>&nbsp;is our entropy,&nbsp;
                  <span class="math-tex">
                    <span class="mjpage">
                      <span class="mjx-chtml">
                        <span class="mjx-math" aria-label="X">
                          <span class="mjx-mrow" aria-hidden="true">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.024em;">X</span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>&nbsp;is the set of possible states&nbsp;
                  <span class="math-tex">
                    <span class="mjpage">
                      <span class="mjx-chtml">
                        <span class="mjx-math" aria-label="x">
                          <span class="mjx-mrow" aria-hidden="true">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>,&nbsp;and&nbsp;
                  <span class="math-tex">
                    <span class="mjpage">
                      <span class="mjx-chtml">
                        <span class="mjx-math" aria-label="p(x)">
                          <span class="mjx-mrow" aria-hidden="true">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.446em;">p</span>
                            </span>
                            <span class="mjx-mo">
                              <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                            </span>
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                            </span>
                            <span class="mjx-mo">
                              <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>&nbsp;is the probability of each state. If&nbsp;
                  <span class="math-tex">
                    <span class="mjpage">
                      <span class="mjx-chtml">
                        <span class="mjx-math" aria-label="p">
                          <span class="mjx-mrow" aria-hidden="true">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.446em;">p</span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>&nbsp;is uniform and the size of&nbsp;
                  <span class="math-tex">
                    <span class="mjpage">
                      <span class="mjx-chtml">
                        <span class="mjx-math" aria-label="X">
                          <span class="mjx-mrow" aria-hidden="true">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.024em;">X</span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>&nbsp;is&nbsp;
                  <span class="math-tex">
                    <span class="mjpage">
                      <span class="mjx-chtml">
                        <span class="mjx-math" aria-label="W">
                          <span class="mjx-mrow" aria-hidden="true">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>, then the minimum average entropy is the thing we already calculated above. If&nbsp;
                  <span class="math-tex">
                    <span class="mjpage">
                      <span class="mjx-chtml">
                        <span class="mjx-math" aria-label="p">
                          <span class="mjx-mrow" aria-hidden="true">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.446em;">p</span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>&nbsp;is not uniform, then the best thing we could do is give the most likely states the shortest strings, which could give us an average entropy that is arbitrarily small (depending on how non-uniform&nbsp;
                  <span class="math-tex">
                    <span class="mjpage">
                      <span class="mjx-chtml">
                        <span class="mjx-math" aria-label="p">
                          <span class="mjx-mrow" aria-hidden="true">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.446em;">p</span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>&nbsp;is).
                </p>
                <p>That's what we could do in the binary string labels model. But what about in the yes/no questions model? What if, for example, we know that our friend likes picking the "Susan" card more often? If the cards aren't equally likely, then we shouldn't just be picking questions that cut the remaining 
                  <i>number</i> of cards in half; instead we should be picking questions that cut the remaining 
                  <i>probability mass</i> in half. So, if we know our friend picks Susan half the time, then a very reasonable first question would be, "Is your card Susan?".
                </p>
                <p>But now our labels are not the same lengths. This feels like it's bringing us back to the binary string model; if they're not the same length, how do we know when we've asked enough questions? Don't we need an "end of string" character again? But a subtle difference remains. In the binary string model, the string 0 and the string 1 both refer to specific states. But in our game of Guess Who?, the first bit of all the strings refers to the answer to the question, "Is your card Susan?". If the answer is yes, then that state (the Susan card) just gets the string 1. If the answer is no, then the first bit of all the remaining states (i.e. the non-Susan cards) is 0 – but there's a second question for all of them, and therefore a second bit. No card has the string that is just 0.</p>
                <p>The generalization here is that, in the yes/no questions model, no binary string label of a state can be a 
                  <strong>prefix</strong> of another state's binary string label. If 1 is a state's whole label, then no other label can even start with a 1. (In the version of the game where all states are equally likely, we just use equally-sized strings for all of them, and it is the case that no string can be a prefix of a different string of the same size.)
                </p>
                <p>This is how you can use different-sized labels without having an additional "all done" symbol. If the bits known so far match a whole label, then they are not a prefix of any other label. Therefore they could not match any other label, and so you know the bits must refer to the label they already match so far. And using different-sized labels in your "prefix code" lets you reduce your expected entropy in cases where the states are not equally likely.</p>
                <p>There are infinitely many prefix codes that one could make (each of which could have finitely or infinitely many finite binary strings).
                  <span class="footnote-reference" data-footnote-reference="" data-footnote-index="15" data-footnote-id="ola1nhif4ee" role="doc-noteref" id="fnrefola1nhif4ee">
                    <sup>
                      <a href="#fnola1nhif4ee">[15]</a>
                    </sup>
                  </span>&nbsp;It turns out that for a given probability distribution&nbsp;
                  <span class="math-tex">
                    <span class="mjpage">
                      <span class="mjx-chtml">
                        <span class="mjx-math" aria-label="undefined">
                          <span class="mjx-mrow" aria-hidden="true">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">u</span>
                            </span>
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">n</span>
                            </span>
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.003em;">d</span>
                            </span>
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">e</span>
                            </span>
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.519em; padding-right: 0.06em;">f</span>
                            </span>
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em;">i</span>
                            </span>
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">n</span>
                            </span>
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">e</span>
                            </span>
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.003em;">d</span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>&nbsp;over states, the encoding that minimizes average entropy uses strings that have one bit for every halving that it takes to get to&nbsp;
                  <span class="math-tex">
                    <span class="mjpage">
                      <span class="mjx-chtml">
                        <span class="mjx-math" aria-label="undefined">
                          <span class="mjx-mrow" aria-hidden="true">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">u</span>
                            </span>
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">n</span>
                            </span>
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.003em;">d</span>
                            </span>
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">e</span>
                            </span>
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.519em; padding-right: 0.06em;">f</span>
                            </span>
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em;">i</span>
                            </span>
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">n</span>
                            </span>
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">e</span>
                            </span>
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.003em;">d</span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>&nbsp;(e.g. if&nbsp;
                  <span class="math-tex">
                    <span class="mjpage">
                      <span class="mjx-chtml">
                        <span class="mjx-math" aria-label="p(x) = \frac{1}{4}">
                          <span class="mjx-mrow" aria-hidden="true">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.446em;">p</span>
                            </span>
                            <span class="mjx-mo">
                              <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                            </span>
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                            </span>
                            <span class="mjx-mo">
                              <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                            </span>
                            <span class="mjx-mo MJXc-space3">
                              <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                            </span>
                            <span class="mjx-mfrac MJXc-space3">
                              <span class="mjx-box MJXc-stacked" style="width: 0.495em; padding: 0px 0.12em;">
                                <span class="mjx-numerator" style="font-size: 70.7%; width: 0.7em; top: -1.372em;">
                                  <span class="mjx-mn" style="">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">1</span>
                                  </span>
                                </span>
                                <span class="mjx-denominator" style="font-size: 70.7%; width: 0.7em; bottom: -0.676em;">
                                  <span class="mjx-mn" style="">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">4</span>
                                  </span>
                                </span>
                                <span style="border-bottom: 1.3px solid; top: -0.296em; width: 0.495em;" class="mjx-line"></span>
                              </span>
                              <span style="height: 1.449em; vertical-align: -0.478em;" class="mjx-vsize"></span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>, that's two halvings, so use two bits to encode the state&nbsp;
                  <span class="math-tex">
                    <span class="mjpage">
                      <span class="mjx-chtml">
                        <span class="mjx-math" aria-label="x">
                          <span class="mjx-mrow" aria-hidden="true">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>). In other words we can use labels such that
                </p>
                <span class="math-tex">
                  <span class="mjpage mjpage__block">
                    <span class="mjx-chtml MJXc-display" style="text-align: center;">
                      <span class="mjx-math" aria-label="S(x) = \log\frac{1}{p(x)},">
                        <span class="mjx-mrow" aria-hidden="true">
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.298em; padding-right: 0.032em;">S</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                          </span>
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                          </span>
                          <span class="mjx-mo MJXc-space3">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                          </span>
                          <span class="mjx-mi MJXc-space3">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char"></span>
                          </span>
                          <span class="mjx-mfrac MJXc-space1">
                            <span class="mjx-box MJXc-stacked" style="width: 2.053em; padding: 0px 0.12em;">
                              <span class="mjx-numerator" style="width: 2.053em; top: -1.368em;">
                                <span class="mjx-mn">
                                  <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">1</span>
                                </span>
                              </span>
                              <span class="mjx-denominator" style="width: 2.053em; bottom: -1.09em;">
                                <span class="mjx-mrow">
                                  <span class="mjx-mi">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.446em;">p</span>
                                  </span>
                                  <span class="mjx-mo">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                                  </span>
                                  <span class="mjx-mi">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                                  </span>
                                  <span class="mjx-mo">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                                  </span>
                                </span>
                              </span>
                              <span style="border-bottom: 1.3px solid; top: -0.296em; width: 2.053em;" class="mjx-line"></span>
                            </span>
                            <span style="height: 2.458em; vertical-align: -1.09em;" class="mjx-vsize"></span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="margin-top: -0.144em; padding-bottom: 0.519em;">,</span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
                <p>and therefore,</p>
                <span class="math-tex">
                  <span class="mjpage mjpage__block">
                    <span class="mjx-chtml MJXc-display" style="text-align: center;">
                      <span class="mjx-math" aria-label="\mathbb{E}[S_X] = \sum_{x \in X} {p(x) \log\frac{1}{p(x)}},">
                        <span class="mjx-mrow" aria-hidden="true">
                          <span class="mjx-texatom">
                            <span class="mjx-mrow">
                              <span class="mjx-mi">
                                <span class="mjx-char MJXc-TeX-ams-R" style="padding-top: 0.446em; padding-bottom: 0.298em;">E</span>
                              </span>
                            </span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">[</span>
                          </span>
                          <span class="mjx-msubsup">
                            <span class="mjx-base" style="margin-right: -0.032em;">
                              <span class="mjx-mi">
                                <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.298em; padding-right: 0.032em;">S</span>
                              </span>
                            </span>
                            <span class="mjx-sub" style="font-size: 70.7%; vertical-align: -0.212em; padding-right: 0.071em;">
                              <span class="mjx-mi" style="">
                                <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.024em;">X</span>
                              </span>
                            </span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">]</span>
                          </span>
                          <span class="mjx-mo MJXc-space3">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                          </span>
                          <span class="mjx-munderover MJXc-space3">
                            <span class="mjx-itable">
                              <span class="mjx-row">
                                <span class="mjx-cell">
                                  <span class="mjx-op" style="padding-left: 0.017em;">
                                    <span class="mjx-mo">
                                      <span class="mjx-char MJXc-TeX-size2-R" style="padding-top: 0.74em; padding-bottom: 0.74em;">∑</span>
                                    </span>
                                  </span>
                                </span>
                              </span>
                              <span class="mjx-row">
                                <span class="mjx-under" style="font-size: 70.7%; padding-top: 0.236em; padding-bottom: 0.141em;">
                                  <span class="mjx-texatom" style="">
                                    <span class="mjx-mrow">
                                      <span class="mjx-mi">
                                        <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                                      </span>
                                      <span class="mjx-mo">
                                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.225em; padding-bottom: 0.372em;">∈</span>
                                      </span>
                                      <span class="mjx-mi">
                                        <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.024em;">X</span>
                                      </span>
                                    </span>
                                  </span>
                                </span>
                              </span>
                            </span>
                          </span>
                          <span class="mjx-texatom MJXc-space1">
                            <span class="mjx-mrow">
                              <span class="mjx-mi">
                                <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.446em;">p</span>
                              </span>
                              <span class="mjx-mo">
                                <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                              </span>
                              <span class="mjx-mi">
                                <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                              </span>
                              <span class="mjx-mo">
                                <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                              </span>
                              <span class="mjx-mi MJXc-space1">
                                <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                              </span>
                              <span class="mjx-mo">
                                <span class="mjx-char"></span>
                              </span>
                              <span class="mjx-mfrac MJXc-space1">
                                <span class="mjx-box MJXc-stacked" style="width: 2.053em; padding: 0px 0.12em;">
                                  <span class="mjx-numerator" style="width: 2.053em; top: -1.368em;">
                                    <span class="mjx-mn">
                                      <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">1</span>
                                    </span>
                                  </span>
                                  <span class="mjx-denominator" style="width: 2.053em; bottom: -1.09em;">
                                    <span class="mjx-mrow">
                                      <span class="mjx-mi">
                                        <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.446em;">p</span>
                                      </span>
                                      <span class="mjx-mo">
                                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                                      </span>
                                      <span class="mjx-mi">
                                        <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                                      </span>
                                      <span class="mjx-mo">
                                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                                      </span>
                                    </span>
                                  </span>
                                  <span style="border-bottom: 1.3px solid; top: -0.296em; width: 2.053em;" class="mjx-line"></span>
                                </span>
                                <span style="height: 2.458em; vertical-align: -1.09em;" class="mjx-vsize"></span>
                              </span>
                            </span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="margin-top: -0.144em; padding-bottom: 0.519em;">,</span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
                <p>which is minimal. (This is also how we can assign an entropy to a macrostate of unequally-likely microstates; we still want it to represent the number of yes/no questions we'd have to ask to get to a specific microstate, only now it has to be an expected value, and not an exact number.)</p>
                <p>This definition, formally equivalent to Shannon entropy and Gibbs entropy, is often considered canonical, so it's worth taking a step back and reminding ourselves how it compares to what else we've talked about. In the beginning, we had a set of equally-likely states, and we gave the ones we "liked" shorter binary string labels so they required fewer bits to refer to. Next, we had sets of equally likely states that we didn't care to distinguish among, and we gave them all equally long labels, and just cared about how many bits were needed to narrow down to one state. Here, we have 
                  <i>un</i>equally-likely states, and we're assigning them prefix-codes in relation to their probability, so that we can minimize the expected number of bits we need to describe a state from the distribution.
                </p>
                <p>All of these are ways of using bits to uniquely distinguish states, and thus they are all types of entropy.</p>
                <h2>Negentropy</h2>
                <p>Negentropy is the "potential" for the state (micro or macro) to be higher entropy – literally the maximum entropy minus the state's entropy:
                  <span class="footnote-reference" data-footnote-reference="" data-footnote-index="16" data-footnote-id="mq56rpxbm2c" role="doc-noteref" id="fnrefmq56rpxbm2c">
                    <sup>
                      <a href="#fnmq56rpxbm2c">[16]</a>
                    </sup>
                  </span>
                </p>
                <span class="math-tex">
                  <span class="mjpage mjpage__block">
                    <span class="mjx-chtml MJXc-display" style="text-align: center;">
                      <span class="mjx-math" aria-label="J(x) = S_{max} - S(x).">
                        <span class="mjx-mrow" aria-hidden="true">
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.078em;">J</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                          </span>
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                          </span>
                          <span class="mjx-mo MJXc-space3">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                          </span>
                          <span class="mjx-msubsup MJXc-space3">
                            <span class="mjx-base" style="margin-right: -0.032em;">
                              <span class="mjx-mi">
                                <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.298em; padding-right: 0.032em;">S</span>
                              </span>
                            </span>
                            <span class="mjx-sub" style="font-size: 70.7%; vertical-align: -0.212em; padding-right: 0.071em;">
                              <span class="mjx-texatom" style="">
                                <span class="mjx-mrow">
                                  <span class="mjx-mi">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">m</span>
                                  </span>
                                  <span class="mjx-mi">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">a</span>
                                  </span>
                                  <span class="mjx-mi">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                                  </span>
                                </span>
                              </span>
                            </span>
                          </span>
                          <span class="mjx-mo MJXc-space2">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.298em; padding-bottom: 0.446em;">−</span>
                          </span>
                          <span class="mjx-mi MJXc-space2">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.298em; padding-right: 0.032em;">S</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                          </span>
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="margin-top: -0.144em; padding-bottom: 0.372em;">.</span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
                <p>Note that while the entropy of a state is something you can determine from (a labeling of) just that state, the negentropy is a function of the maximum 
                  <i>possible</i> entropy state, and so it's determined by the entire collection of states in the system. If you have two systems, A and B, where the only difference is that B has twice as many states as A, then any state in both systems will have one more bit of 
                  <i>neg</i>entropy in system B (even though they have the same 
                  <i>entropy</i> in both systems).
                </p>
                <p>When we have a finite number of states, then&nbsp;
                  <span class="math-tex">
                    <span class="mjpage">
                      <span class="mjx-chtml">
                        <span class="mjx-math" aria-label="S_{max}">
                          <span class="mjx-mrow" aria-hidden="true">
                            <span class="mjx-msubsup">
                              <span class="mjx-base" style="margin-right: -0.032em;">
                                <span class="mjx-mi">
                                  <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.298em; padding-right: 0.032em;">S</span>
                                </span>
                              </span>
                              <span class="mjx-sub" style="font-size: 70.7%; vertical-align: -0.212em; padding-right: 0.071em;">
                                <span class="mjx-texatom" style="">
                                  <span class="mjx-mrow">
                                    <span class="mjx-mi">
                                      <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">m</span>
                                    </span>
                                    <span class="mjx-mi">
                                      <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">a</span>
                                    </span>
                                    <span class="mjx-mi">
                                      <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                                    </span>
                                  </span>
                                </span>
                              </span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>&nbsp;is just some specific binary string length. But for systems with an 
                  <a href="https://www.lesswrong.com/posts/yJorhsuEKCbYrycav/dealing-with-infinite-entropy">infinite number of states</a> (and thus no bound on how long their labels are),&nbsp;
                  <span class="math-tex">
                    <span class="mjpage">
                      <span class="mjx-chtml">
                        <span class="mjx-math" aria-label="S_{max}">
                          <span class="mjx-mrow" aria-hidden="true">
                            <span class="mjx-msubsup">
                              <span class="mjx-base" style="margin-right: -0.032em;">
                                <span class="mjx-mi">
                                  <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.298em; padding-right: 0.032em;">S</span>
                                </span>
                              </span>
                              <span class="mjx-sub" style="font-size: 70.7%; vertical-align: -0.212em; padding-right: 0.071em;">
                                <span class="mjx-texatom" style="">
                                  <span class="mjx-mrow">
                                    <span class="mjx-mi">
                                      <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">m</span>
                                    </span>
                                    <span class="mjx-mi">
                                      <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">a</span>
                                    </span>
                                    <span class="mjx-mi">
                                      <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                                    </span>
                                  </span>
                                </span>
                              </span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>&nbsp;is infinite, and since&nbsp;
                  <span class="math-tex">
                    <span class="mjpage">
                      <span class="mjx-chtml">
                        <span class="mjx-math" aria-label="S(x)">
                          <span class="mjx-mrow" aria-hidden="true">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.298em; padding-right: 0.032em;">S</span>
                            </span>
                            <span class="mjx-mo">
                              <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                            </span>
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                            </span>
                            <span class="mjx-mo">
                              <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>&nbsp;is finite for every state&nbsp;
                  <span class="math-tex">
                    <span class="mjpage">
                      <span class="mjx-chtml">
                        <span class="mjx-math" aria-label="x">
                          <span class="mjx-mrow" aria-hidden="true">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>, every specific state just does actually have infinite negentropy.
                </p>
                <p>If we're using entropy as the number of yes/no questions, and all the states are equally likely, then they all have equal entropy, and therefore zero negentropy. If they have different probabilities and we've assigned them labels with a prefix code, then we're back to having a different maximum length to subtract from.</p>
                <p>If we're considering the entropy of a macrostate, then what is the maximum "possible" entropy? I'd say that the maximum entropy macrostate is the whole set of states.
                  <span class="footnote-reference" data-footnote-reference="" data-footnote-index="17" data-footnote-id="0hgb7ntsh85h" role="doc-noteref" id="fnref0hgb7ntsh85h">
                    <sup>
                      <a href="#fn0hgb7ntsh85h">[17]</a>
                    </sup>
                  </span>&nbsp;Therefore the negentropy of a macrostate&nbsp;
                  <span class="math-tex">
                    <span class="mjpage">
                      <span class="mjx-chtml">
                        <span class="mjx-math" aria-label="M">
                          <span class="mjx-mrow" aria-hidden="true">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.081em;">M</span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>&nbsp;is how many halvings it takes to get from the whole set of states to&nbsp;
                  <span class="math-tex">
                    <span class="mjpage">
                      <span class="mjx-chtml">
                        <span class="mjx-math" aria-label="M">
                          <span class="mjx-mrow" aria-hidden="true">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.081em;">M</span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>.
                </p>
                <p>If the system has an infinite number of microstates, then a macrostate could have finite 
                  <i>or</i> infinite negentropy; a macrostate made of a 
                  <i>finite</i> number of microstates would have infinite negentropy, but a macrostate that was, say, one-quarter of the total (infinite) set of states would have a negentropy of 2. As above, if the states are not equally likely, then the generalization of macrostate negentropy is not in terms of 
                  <i>number</i> of microstates but instead their probability mass. Then, the negentropy of a macrostate&nbsp;
                  <span class="math-tex">
                    <span class="mjpage">
                      <span class="mjx-chtml">
                        <span class="mjx-math" aria-label="M">
                          <span class="mjx-mrow" aria-hidden="true">
                            <span class="mjx-mi">
                              <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.081em;">M</span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>&nbsp;is
                </p>
                <span class="math-tex">
                  <span class="mjpage mjpage__block">
                    <span class="mjx-chtml MJXc-display" style="text-align: center;">
                      <span class="mjx-math" aria-label="J(M) = \log\frac{1}{p(M)}.">
                        <span class="mjx-mrow" aria-hidden="true">
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.078em;">J</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                          </span>
                          <span class="mjx-mi">
                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.081em;">M</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                          </span>
                          <span class="mjx-mo MJXc-space3">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                          </span>
                          <span class="mjx-mi MJXc-space3">
                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char"></span>
                          </span>
                          <span class="mjx-mfrac MJXc-space1">
                            <span class="mjx-box MJXc-stacked" style="width: 2.532em; padding: 0px 0.12em;">
                              <span class="mjx-numerator" style="width: 2.532em; top: -1.368em;">
                                <span class="mjx-mn">
                                  <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">1</span>
                                </span>
                              </span>
                              <span class="mjx-denominator" style="width: 2.532em; bottom: -1.09em;">
                                <span class="mjx-mrow">
                                  <span class="mjx-mi">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.446em;">p</span>
                                  </span>
                                  <span class="mjx-mo">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                                  </span>
                                  <span class="mjx-mi">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.081em;">M</span>
                                  </span>
                                  <span class="mjx-mo">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                                  </span>
                                </span>
                              </span>
                              <span style="border-bottom: 1.3px solid; top: -0.296em; width: 2.532em;" class="mjx-line"></span>
                            </span>
                            <span style="height: 2.458em; vertical-align: -1.09em;" class="mjx-vsize"></span>
                          </span>
                          <span class="mjx-mo">
                            <span class="mjx-char MJXc-TeX-main-R" style="margin-top: -0.144em; padding-bottom: 0.372em;">.</span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
                <p>One concrete example of negentropy would be a partially-scrambled Rubik's Cube. Using the distance-from-solved entropy discussed above, a cube that is merely 10 moves from solved is far from the maximum entropy of 26 moves from solved, and thus has large negentropy.</p>
                <p>Another example shows that negentropy could be considered the potential bits of information you could store in the state than you currently are. If your file is 3 KB in size, but can be losslessly compressed to 1 KB, then your file has about 1 KB of entropy and 2 KB of negentropy (because the highest-entropy file you can store in that space is an incompressible 3 KB).</p>
                <h2>What's next</h2>
                <p>At the risk of over-emphasizing, all the above is (if my understanding is correct) the 
                  <i>definition</i> of entropy, the very source of its meaningfulness. Any other things that use the term "entropy", or are associated with it, do so because they come from the above ideas. In a future post I try to trace out very explicitly how that works for several named types of entropy. In addition, 
                  <a href="https://www.lesswrong.com/posts/yJorhsuEKCbYrycav/dealing-with-infinite-entropy">we will show</a> how these ideas can meaningfully carry over to systems with continuous state spaces, and also consider moving between states over time, which will allow us to work out other implications following directly from the abstract definition.
                </p>
                <ol class="footnote-section footnotes" data-footnote-section="" role="doc-endnotes">
                  <li class="footnote-item" data-footnote-item="" data-footnote-index="1" data-footnote-id="a26yynbcolo" role="doc-endnote" id="fna26yynbcolo">
                    <span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="a26yynbcolo">
                      <sup>
                        <strong>
                          <a href="#fnrefa26yynbcolo">^</a>
                        </strong>
                      </sup>
                    </span>
                    <div class="footnote-content" data-footnote-content="">
                      <p>The quickest gloss is that optimization is a decrease in entropy. So it's a pretty tight connection! But those six words are hiding innumerable subtleties.</p>
                    </div>
                  </li>
                  <li class="footnote-item" data-footnote-item="" data-footnote-index="2" data-footnote-id="6gxudhss0db" role="doc-endnote" id="fn6gxudhss0db">
                    <span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="6gxudhss0db">
                      <sup>
                        <strong>
                          <a href="#fnref6gxudhss0db">^</a>
                        </strong>
                      </sup>
                    </span>
                    <div class="footnote-content" data-footnote-content="">
                      <p>Something like "the entropy of a closed system tends to increase over time"; there are 
                        <a href="https://en.wikipedia.org/wiki/Second_law_of_thermodynamics#Various_statements_of_the_law">many</a> formulations.
                      </p>
                    </div>
                  </li>
                  <li class="footnote-item" data-footnote-item="" data-footnote-index="3" data-footnote-id="pi8b39u5hd7" role="doc-endnote" id="fnpi8b39u5hd7">
                    <span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="pi8b39u5hd7">
                      <sup>
                        <strong>
                          <a href="#fnrefpi8b39u5hd7">^</a>
                        </strong>
                      </sup>
                    </span>
                    <div class="footnote-content" data-footnote-content="">
                      <p>Some contexts will use "nats" or "dits" or whatever. This comes from using logarithms with different bases, and is just a change of units, like meters versus feet.</p>
                    </div>
                  </li>
                  <li class="footnote-item" data-footnote-item="" data-footnote-index="4" data-footnote-id="mh08kmzx85q" role="doc-endnote" id="fnmh08kmzx85q">
                    <span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="mh08kmzx85q">
                      <sup>
                        <strong>
                          <a href="#fnrefmh08kmzx85q">^</a>
                        </strong>
                      </sup>
                    </span>
                    <div class="footnote-content" data-footnote-content="">
                      <p>I've justified the use of binary 
                        <a href="https://www.lesswrong.com/posts/Kyc5dFDzBg4WccrbK/an-intuitive-explanation-of-solomonoff-induction#Binary_Sequences">before</a>. There's a lot of interesting detail to go into about what changes when you use three symbols or more, but all of the heavy-lifting conclusions are the same. Turing machines that use three symbols can compute exactly the set of things that Turing machines with two symbols can; the length of a number&nbsp;
                        <span class="math-tex">
                          <span class="mjpage">
                            <span class="mjx-chtml">
                              <span class="mjx-math" aria-label="n">
                                <span class="mjx-mrow" aria-hidden="true">
                                  <span class="mjx-mi">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">n</span>
                                  </span>
                                </span>
                              </span>
                            </span>
                          </span>
                        </span>&nbsp;is&nbsp;
                        <span class="math-tex">
                          <span class="mjpage">
                            <span class="mjx-chtml">
                              <span class="mjx-math" aria-label="O(\log n)">
                                <span class="mjx-mrow" aria-hidden="true">
                                  <span class="mjx-mi">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.298em;">O</span>
                                  </span>
                                  <span class="mjx-mo">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                                  </span>
                                  <span class="mjx-mi">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                                  </span>
                                  <span class="mjx-mo">
                                    <span class="mjx-char"></span>
                                  </span>
                                  <span class="mjx-mi MJXc-space1">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">n</span>
                                  </span>
                                  <span class="mjx-mo">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                                  </span>
                                </span>
                              </span>
                            </span>
                          </span>
                        </span>&nbsp;whether it's represented in binary or trinary; et cetera.
                      </p>
                    </div>
                  </li>
                  <li class="footnote-item" data-footnote-item="" data-footnote-index="5" data-footnote-id="jlulplwrhrb" role="doc-endnote" id="fnjlulplwrhrb">
                    <span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="jlulplwrhrb">
                      <sup>
                        <strong>
                          <a href="#fnrefjlulplwrhrb">^</a>
                        </strong>
                      </sup>
                    </span>
                    <div class="footnote-content" data-footnote-content="">
                      <p>Binary strings are usually written out with 0s and 1s, and I'll do that in the text. But I personally always visualize them as strings of little white and black squares, which is what I'll use in the illustrations. This is probably because I first learned about them in the context of Turing machines with tapes.</p>
                    </div>
                  </li>
                  <li class="footnote-item" data-footnote-item="" data-footnote-index="6" data-footnote-id="0qfkbz6qhwj" role="doc-endnote" id="fn0qfkbz6qhwj">
                    <span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="0qfkbz6qhwj">
                      <sup>
                        <strong>
                          <a href="#fnref0qfkbz6qhwj">^</a>
                        </strong>
                      </sup>
                    </span>
                    <div class="footnote-content" data-footnote-content="">
                      <p>Note that the entropy of a state is the 
                        <i>length</i> of its label, and not the label itself; the specific layout of 0s and 1s just serves to distinguish that label from other labels of the same length.
                      </p>
                    </div>
                  </li>
                  <li class="footnote-item" data-footnote-item="" data-footnote-index="7" data-footnote-id="ikdk2gb237" role="doc-endnote" id="fnikdk2gb237">
                    <span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="ikdk2gb237">
                      <sup>
                        <strong>
                          <a href="#fnrefikdk2gb237">^</a>
                        </strong>
                      </sup>
                    </span>
                    <div class="footnote-content" data-footnote-content="">
                      <p>Justification for merely taking the log comes from the derivation at the end of this section, though you may have been able to intuit it already!</p>
                    </div>
                  </li>
                  <li class="footnote-item" data-footnote-item="" data-footnote-index="8" data-footnote-id="ddpqvgrp58p" role="doc-endnote" id="fnddpqvgrp58p">
                    <span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="ddpqvgrp58p">
                      <sup>
                        <strong>
                          <a href="#fnrefddpqvgrp58p">^</a>
                        </strong>
                      </sup>
                    </span>
                    <div class="footnote-content" data-footnote-content="">
                      <p>Again, this is assuming you're using a binary string labeling scheme that uses all the smaller strings before using bigger strings. You could always decide to label every state with binary strings of length 100.</p>
                    </div>
                  </li>
                  <li class="footnote-item" data-footnote-item="" data-footnote-index="9" data-footnote-id="io9k70v4ks" role="doc-endnote" id="fnio9k70v4ks">
                    <span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="io9k70v4ks">
                      <sup>
                        <strong>
                          <a href="#fnrefio9k70v4ks">^</a>
                        </strong>
                      </sup>
                    </span>
                    <div class="footnote-content" data-footnote-content="">
                      <p>The typical minimal notation for describing Rubik's Cube algorithms has one letter for each of the six faces (F, B, L, R, U, D), and then an apostrophe for denoting counter-clockwise (and a number of other symbols for more compact representations). This means that six of the one-move states have a label of length one, and six others have length two. This all comes out in the big-O wash, and the label lengths will end up differing by a constant factor, because e.g.&nbsp;
                        <span class="math-tex">
                          <span class="mjpage">
                            <span class="mjx-chtml">
                              <span class="mjx-math" aria-label="\log_6(x) = \frac{\log_2(x)}{\log_2(6)} = 0.387\cdot \log_2(x)">
                                <span class="mjx-mrow" aria-hidden="true">
                                  <span class="mjx-msubsup">
                                    <span class="mjx-base">
                                      <span class="mjx-mi">
                                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                                      </span>
                                    </span>
                                    <span class="mjx-sub" style="font-size: 70.7%; vertical-align: -0.377em; padding-right: 0.071em;">
                                      <span class="mjx-mn" style="">
                                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">6</span>
                                      </span>
                                    </span>
                                  </span>
                                  <span class="mjx-mo">
                                    <span class="mjx-char"></span>
                                  </span>
                                  <span class="mjx-mo">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                                  </span>
                                  <span class="mjx-mi">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                                  </span>
                                  <span class="mjx-mo">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                                  </span>
                                  <span class="mjx-mo MJXc-space3">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                                  </span>
                                  <span class="mjx-mfrac MJXc-space3">
                                    <span class="mjx-box MJXc-stacked" style="width: 2.324em; padding: 0px 0.12em;">
                                      <span class="mjx-numerator" style="font-size: 70.7%; width: 3.286em; top: -1.725em;">
                                        <span class="mjx-mrow" style="">
                                          <span class="mjx-msubsup">
                                            <span class="mjx-base">
                                              <span class="mjx-mi">
                                                <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                                              </span>
                                            </span>
                                            <span class="mjx-sub" style="font-size: 83.3%; vertical-align: -0.327em; padding-right: 0.06em;">
                                              <span class="mjx-mn" style="">
                                                <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">2</span>
                                              </span>
                                            </span>
                                          </span>
                                          <span class="mjx-mo">
                                            <span class="mjx-char"></span>
                                          </span>
                                          <span class="mjx-mo">
                                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                                          </span>
                                          <span class="mjx-mi">
                                            <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                                          </span>
                                          <span class="mjx-mo">
                                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                                          </span>
                                        </span>
                                      </span>
                                      <span class="mjx-denominator" style="font-size: 70.7%; width: 3.286em; bottom: -1.018em;">
                                        <span class="mjx-mrow" style="">
                                          <span class="mjx-msubsup">
                                            <span class="mjx-base">
                                              <span class="mjx-mi">
                                                <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                                              </span>
                                            </span>
                                            <span class="mjx-sub" style="font-size: 83.3%; vertical-align: -0.327em; padding-right: 0.06em;">
                                              <span class="mjx-mn" style="">
                                                <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">2</span>
                                              </span>
                                            </span>
                                          </span>
                                          <span class="mjx-mo">
                                            <span class="mjx-char"></span>
                                          </span>
                                          <span class="mjx-mo">
                                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                                          </span>
                                          <span class="mjx-mn">
                                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">6</span>
                                          </span>
                                          <span class="mjx-mo">
                                            <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                                          </span>
                                        </span>
                                      </span>
                                      <span style="border-bottom: 1.3px solid; top: -0.296em; width: 2.324em;" class="mjx-line"></span>
                                    </span>
                                    <span style="height: 1.939em; vertical-align: -0.72em;" class="mjx-vsize"></span>
                                  </span>
                                  <span class="mjx-mo MJXc-space3">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                                  </span>
                                  <span class="mjx-mn MJXc-space3">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">0.387</span>
                                  </span>
                                  <span class="mjx-mo MJXc-space2">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.004em; padding-bottom: 0.298em;">⋅</span>
                                  </span>
                                  <span class="mjx-msubsup MJXc-space2">
                                    <span class="mjx-base">
                                      <span class="mjx-mi">
                                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                                      </span>
                                    </span>
                                    <span class="mjx-sub" style="font-size: 70.7%; vertical-align: -0.377em; padding-right: 0.071em;">
                                      <span class="mjx-mn" style="">
                                        <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.372em;">2</span>
                                      </span>
                                    </span>
                                  </span>
                                  <span class="mjx-mo">
                                    <span class="mjx-char"></span>
                                  </span>
                                  <span class="mjx-mo">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                                  </span>
                                  <span class="mjx-mi">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.225em; padding-bottom: 0.298em;">x</span>
                                  </span>
                                  <span class="mjx-mo">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                                  </span>
                                </span>
                              </span>
                            </span>
                          </span>
                        </span>.
                      </p>
                    </div>
                  </li>
                  <li class="footnote-item" data-footnote-item="" data-footnote-index="10" data-footnote-id="8dysop0rn9w" role="doc-endnote" id="fn8dysop0rn9w">
                    <span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="8dysop0rn9w">
                      <sup>
                        <strong>
                          <a href="#fnref8dysop0rn9w">^</a>
                        </strong>
                      </sup>
                    </span>
                    <div class="footnote-content" data-footnote-content="">
                      <p>I'll have bits of math throughout this sequence. This is a pretty math-heavy concept, but I still don't think that most of the actual equations are 
                        <i>essential</i> for gaining a useful understanding of entropy (though it 
                        <i>is</i> essential to understand how logarithms work). So if you feel disinclined to follow the derivations, I'd still encourage you to continue reading the prose.
                      </p>
                      <p>None of the derivations in this sequence are here for the purpose of rigorously 
                        <i>proving</i> anything, and I've tried to include them when the structure of the equations actually helped me understand the concepts more clearly.
                      </p>
                    </div>
                  </li>
                  <li class="footnote-item" data-footnote-item="" data-footnote-index="11" data-footnote-id="krma9vb21f" role="doc-endnote" id="fnkrma9vb21f">
                    <span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="krma9vb21f">
                      <sup>
                        <strong>
                          <a href="#fnrefkrma9vb21f">^</a>
                        </strong>
                      </sup>
                    </span>
                    <div class="footnote-content" data-footnote-content="">
                      <p>Wikipedia informs me that this is not technically the optimal strategy for 
                        <i>winning</i> the game, because if you are behind and your opponent plays optimally, then you're better off guessing specific people and hoping to get lucky.
                      </p>
                    </div>
                  </li>
                  <li class="footnote-item" data-footnote-item="" data-footnote-index="12" data-footnote-id="y50eygbc9ig" role="doc-endnote" id="fny50eygbc9ig">
                    <span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="y50eygbc9ig">
                      <sup>
                        <strong>
                          <a href="#fnrefy50eygbc9ig">^</a>
                        </strong>
                      </sup>
                    </span>
                    <div class="footnote-content" data-footnote-content="">
                      <p>Or as close to half as you can get.</p>
                    </div>
                  </li>
                  <li class="footnote-item" data-footnote-item="" data-footnote-index="13" data-footnote-id="9i6jb0p1fl" role="doc-endnote" id="fn9i6jb0p1fl">
                    <span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="9i6jb0p1fl">
                      <sup>
                        <strong>
                          <a href="#fnref9i6jb0p1fl">^</a>
                        </strong>
                      </sup>
                    </span>
                    <div class="footnote-content" data-footnote-content="">
                      <p>Again, only exact when&nbsp;
                        <span class="math-tex">
                          <span class="mjpage">
                            <span class="mjx-chtml">
                              <span class="mjx-math" aria-label="W">
                                <span class="mjx-mrow" aria-hidden="true">
                                  <span class="mjx-mi">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                                  </span>
                                </span>
                              </span>
                            </span>
                          </span>
                        </span>&nbsp;is a power of 2, but in any case, the binary string one is strictly less than the yes/no questions one, which is what we want to resolve here.
                      </p>
                    </div>
                  </li>
                  <li class="footnote-item" data-footnote-item="" data-footnote-index="14" data-footnote-id="thq2hgp2ob" role="doc-endnote" id="fnthq2hgp2ob">
                    <span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="thq2hgp2ob">
                      <sup>
                        <strong>
                          <a href="#fnrefthq2hgp2ob">^</a>
                        </strong>
                      </sup>
                    </span>
                    <div class="footnote-content" data-footnote-content="">
                      <p>For this reason I've been careful not to use the phrase "bit string", instead sticking with "binary string". For our purposes, a binary string is a bit string if each of those symbols 
                        <i>could</i> have been the flipped value (for some relevant definition of "could").
                      </p>
                    </div>
                  </li>
                  <li class="footnote-item" data-footnote-item="" data-footnote-index="15" data-footnote-id="ola1nhif4ee" role="doc-endnote" id="fnola1nhif4ee">
                    <span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="ola1nhif4ee">
                      <sup>
                        <strong>
                          <a href="#fnrefola1nhif4ee">^</a>
                        </strong>
                      </sup>
                    </span>
                    <div class="footnote-content" data-footnote-content="">
                      <p>Examples of finite prefix codes: {0, 1}, {0, 10, 11}, {00, 01, 10, 110, 1110, 1111}</p>
                      <p>Example of an infinite prefix code: {0, 10, 110, 1110, 11110, ... }</p>
                    </div>
                  </li>
                  <li class="footnote-item" data-footnote-item="" data-footnote-index="16" data-footnote-id="mq56rpxbm2c" role="doc-endnote" id="fnmq56rpxbm2c">
                    <span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="mq56rpxbm2c">
                      <sup>
                        <strong>
                          <a href="#fnrefmq56rpxbm2c">^</a>
                        </strong>
                      </sup>
                    </span>
                    <div class="footnote-content" data-footnote-content="">
                      <p>Note that for many systems, 
                        <i>most</i> states have maximum or near-maximum entropy, such that the negentropy is virtually the same as the 
                        <i>average</i> entropy minus the state's entropy; this would also mean that most states have virtually zero negentropy.
                      </p>
                    </div>
                  </li>
                  <li class="footnote-item" data-footnote-item="" data-footnote-index="17" data-footnote-id="0hgb7ntsh85h" role="doc-endnote" id="fn0hgb7ntsh85h">
                    <span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="0hgb7ntsh85h">
                      <sup>
                        <strong>
                          <a href="#fnref0hgb7ntsh85h">^</a>
                        </strong>
                      </sup>
                    </span>
                    <div class="footnote-content" data-footnote-content="">
                      <p>You could argue that the maximum entropy macrostate is just the macrostate that contains only the highest entropy state(s). I think the spirit of macrostates is that you don't consider individual states, and thus it would be "cheating" to pick out specific states to form your macrostate. In the spirit of&nbsp;
                        <span class="math-tex">
                          <span class="mjpage">
                            <span class="mjx-chtml">
                              <span class="mjx-math" aria-label="S = \log(W)">
                                <span class="mjx-mrow" aria-hidden="true">
                                  <span class="mjx-mi">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.298em; padding-right: 0.032em;">S</span>
                                  </span>
                                  <span class="mjx-mo MJXc-space3">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.077em; padding-bottom: 0.298em;">=</span>
                                  </span>
                                  <span class="mjx-mi MJXc-space3">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.372em; padding-bottom: 0.519em;">log</span>
                                  </span>
                                  <span class="mjx-mo">
                                    <span class="mjx-char"></span>
                                  </span>
                                  <span class="mjx-mo">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">(</span>
                                  </span>
                                  <span class="mjx-mi">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                                  </span>
                                  <span class="mjx-mo">
                                    <span class="mjx-char MJXc-TeX-main-R" style="padding-top: 0.446em; padding-bottom: 0.593em;">)</span>
                                  </span>
                                </span>
                              </span>
                            </span>
                          </span>
                        </span>, the way to maximize&nbsp;
                        <span class="math-tex">
                          <span class="mjpage">
                            <span class="mjx-chtml">
                              <span class="mjx-math" aria-label="S">
                                <span class="mjx-mrow" aria-hidden="true">
                                  <span class="mjx-mi">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.519em; padding-bottom: 0.298em; padding-right: 0.032em;">S</span>
                                  </span>
                                </span>
                              </span>
                            </span>
                          </span>
                        </span>&nbsp;is to maximize&nbsp;
                        <span class="math-tex">
                          <span class="mjpage">
                            <span class="mjx-chtml">
                              <span class="mjx-math" aria-label="W">
                                <span class="mjx-mrow" aria-hidden="true">
                                  <span class="mjx-mi">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                                  </span>
                                </span>
                              </span>
                            </span>
                          </span>
                        </span>, that is, include all states into&nbsp;
                        <span class="math-tex">
                          <span class="mjpage">
                            <span class="mjx-chtml">
                              <span class="mjx-math" aria-label="W">
                                <span class="mjx-mrow" aria-hidden="true">
                                  <span class="mjx-mi">
                                    <span class="mjx-char MJXc-TeX-math-I" style="padding-top: 0.446em; padding-bottom: 0.298em; padding-right: 0.104em;">W</span>
                                  </span>
                                </span>
                              </span>
                            </span>
                          </span>
                        </span>.
                      </p>
                    </div>
                  </li>
                </ol>
`

export const exampleMathGlossary = `[
{
"term": "\\langle S_W \\rangle",
"explanation": "The average entropy of a set of W states, representing the expected number of bits needed to uniquely identify a state.",
"concreteExample": "For a Rubik's Cube with 43 quintillion states, ⟨S_W⟩ ≈ 65.2 bits on average to specify a random state.",
"whyItMatters": "This quantifies the complexity or information content of a system, crucial for understanding optimization and information theory.",
"mathBasics": "⟨ ⟩ denotes an average, S is entropy, W is the number of states."
},
{
"term": "\\sum_{i=0}^W l(i)",
"explanation": "The sum of the lengths of binary strings used to label W states, from the shortest to the longest.",
"concreteExample": "For 4 states labeled 0, 1, 00, 01, this sum would be 0 + 1 + 1 + 2 + 2 = 6.",
"whyItMatters": "This sum helps calculate the minimum average entropy, showing how efficiency in labeling relates to information content.",
"mathBasics": "Σ means sum, i=0 to W means add up terms as i goes from 0 to W, l(i) is the length of the ith label."
},
{
"term": "\\frac{1}{W}",
"explanation": "The reciprocal of the number of states, used to calculate the average entropy per state.",
"concreteExample": "If there are 8 states, 1/W = 1/8 = 0.125, meaning each state represents 12.5% of the total.",
"whyItMatters": "This factor normalizes the total entropy, allowing comparison between systems with different numbers of states.",
"mathBasics": "The fraction bar means divide, 1 is divided by W (the number of states)."
},
{
"term": "\\log(W+1)",
"explanation": "The logarithm of the number of states plus one, approximating the average entropy for large W.",
"concreteExample": "For a system with 1023 states, log(1024) = 10 bits, close to the actual average entropy.",
"whyItMatters": "This simplification helps us quickly estimate entropy for large systems without complex calculations.",
"mathBasics": "log is the logarithm function, typically base 2 in information theory; (W+1) means add 1 to W."
},
{
"term": "\\mathbb{E}[S_X]",
"explanation": "The expected value (average) of entropy S for a probability distribution X over states.",
"concreteExample": "If X has states {0,1} with probabilities {0.75, 0.25}, E[S_X] = 0.75 log(1/0.75) + 0.25 log(1/0.25) ≈ 0.81 bits.",
"whyItMatters": "This generalizes entropy to systems with unequal probabilities, crucial for real-world applications in information theory.",
"mathBasics": "E[ ] denotes expected value or average, S_X is the entropy of distribution X."
}
]`

