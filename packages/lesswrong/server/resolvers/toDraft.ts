import { JSDOM } from 'jsdom'
import { sanitize } from '../vulcan-lib/utils';
import { markdownToHtmlNoLaTeX } from '../editor/conversionUtils';
import { htmlToDraft } from '../draftConvert';
import { convertToRaw } from 'draft-js';

function domBuilder(html: string) {
  const jsdom = new JSDOM(html)
  const document = jsdom.window.document;
  const bodyEl = document.body; // implicitly created
  return bodyEl
}

export function htmlToDraftServer(html: string): Draft.RawDraftContentState {
  // We have to add this type definition to the global object to allow draft-convert to properly work on the server
  const jsdom = new JSDOM();
  const globalHTMLElement = jsdom.window.HTMLElement;
  (global as any).HTMLElement = globalHTMLElement;
  // And alas, it looks like we have to add this global. This seems quite bad, and I am not fully sure what to do about it.
  (global as any).document = jsdom.window.document

  // On the server have to pass in a JS-DOM implementation to make htmlToDraft work
  //
  // The DefinitelyTyped annotation of htmlToDraft, which comes from convertFromHTML
  // in the draft-convert library, is wrong. This actually takes optional second and
  // third arguments, the second being options, and the third being a DOMBuilder
  // (verified by quick source-dive into draft-convert).
  // @ts-ignore
  const result = htmlToDraft(html, {}, domBuilder)

  // We do however at least remove it right afterwards
  delete (global as any).document
  delete (global as any).HTMLElement

  // convertToRaw wants a Draft.ContentState, but htmlToDraft produced a
  // Draft.Model.ImmutableData.ContentState. AFAICT this is the DefinitelyTyped
  // people not being careful with the const plague, not a real issue.
  // @ts-ignore
  return convertToRaw(result)
}

export function dataToDraftJS(data: any, type: string) {
  if (data===undefined || data===null) return null;

  switch (type) {
    case "draftJS": {
      return data
    }
    case "html": {
      return htmlToDraftServer(data)
    }
    case "ckEditorMarkup": {
      // CK Editor markup is just html with extra tags, so we just remove them and then handle it as html
      return htmlToDraftServer(sanitize(data))
    }
    case "markdown": {
      const html = markdownToHtmlNoLaTeX(data)
      return htmlToDraftServer(html)
    }
    default: {
      throw new Error(`Unrecognized type: ${type}`);
    }
  }
}
