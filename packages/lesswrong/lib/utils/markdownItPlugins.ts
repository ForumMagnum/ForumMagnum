import markdownIt from "markdown-it";
import markdownItContainer from "markdown-it-container";
import markdownItFootnote from "markdown-it-footnote";
import markdownItSub from "markdown-it-sub";
import markdownItSup from "markdown-it-sup";
import markdownItMathjax from './markdownMathjax';
import { markdownCollapsibleSections } from './markdownCollapsibleSections';

let _mdi: markdownIt|null = null;
export function getMarkdownIt() {
  if (!_mdi) {
    const mdi = markdownIt({linkify: true})
    mdi.use(markdownItMathjax())
    mdi.use(markdownItContainer as AnyBecauseHard, 'spoiler')
    mdi.use(markdownItFootnote)
    mdi.use(markdownItSub)
    mdi.use(markdownItSup)
    mdi.use(markdownCollapsibleSections);
    _mdi = mdi;
  }
  return _mdi;
}

let _mdiNoMathjax: markdownIt|null = null;
export function getMarkdownItNoMathjax() {
  if (!_mdiNoMathjax) {
    // FIXME This is a copy-paste of a markdown config from conversionUtils that has gotten out of sync
    const mdi = markdownIt({ linkify: true });
    // mdi.use(markdownItMathjax()) // for performance, don't render mathjax
    mdi.use(markdownItContainer as AnyBecauseHard, "spoiler");
    mdi.use(markdownItFootnote);
    mdi.use(markdownItSub);
    mdi.use(markdownItSup);
    _mdiNoMathjax = mdi;
  }
  return _mdiNoMathjax;
}

let _mdiArbital: markdownIt|null = null;
export function getMarkdownItArbital() {
  if (!_mdiArbital) {
    const mdi = markdownIt({linkify: true})
    mdi.use(markdownItMathjax())
    _mdiArbital = mdi;
  }
  return _mdiArbital;
}

let _mdiNoPlugins: markdownIt|null = null;
export function getMarkdownItNoPlugins() {
  if (!_mdiNoPlugins) {
    const mdi = markdownIt({linkify: true})
    _mdiNoPlugins = mdi;
  }
  return _mdiNoPlugins;
}
