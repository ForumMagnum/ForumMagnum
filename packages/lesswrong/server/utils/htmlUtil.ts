import cheerio from 'cheerio';
import HtmlLexer from 'html-lexer';

export function cheerioParse(html: string) {
  //@ts-ignore
  return cheerio.load(html, null, false);
}

/**
 * Tokenize HTML. Wraps around the html-lexer library to give it a conventional
 * API taking a string, rather than an awkward streaming thing.
 */
export function tokenizeHtml(html: string): [string,string][] {
  const result: [string,string][] = [];
  const lexer = new HtmlLexer({
    write: (token) => result.push(token),
    end: () => null
  })
  lexer.write(html);
  return result;
}
