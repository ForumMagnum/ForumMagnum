import cheerio from 'cheerio';
import { tagIsHeading } from './utils/tocUtil';

export function addDropcapsTo(postBody: cheerio.Root) {
  // Search for a paragraph to add a dropcap to. It must:
  //  * Be one of the first three top-level elements
  //  * Be at least 100 characters long
  //  * Not be a heading, in the ToC-sense
  //  * Have a capital roman letter (/[A-Z]/) as its first character
  const topLevelElements = postBody.root().children();
  for (let i=0; i<topLevelElements.length && i<3; i++) {
    const paragraph = topLevelElements[i];
    if (isValidParagraphForDropcap(paragraph)) {
      applyDropcapToParagraph(paragraph);
      break;
    }
  }
}

function isValidParagraphForDropcap(paragraph: cheerio.Element): boolean {
  const text = cheerio(paragraph).text();
  
  // Minimum length
  if (text.length < 100) {
    return false;
  }
  
  // Not a heading
  return !tagIsHeading(paragraph);
  
  return true;
}

function applyDropcapToParagraph(paragraph: cheerio.Element) {
  // Traverse to the first text node
  let pos: cheerio.Element|null = paragraph;
  while(pos && pos.type !== "text") {
    if (pos.type === "tag") {
      pos = pos.children[0];
    } else {
      pos = pos.next;
    }
  }
  if (pos && pos.type === "text" && pos.data) {
    const text = pos.data;
    const firstChar = text.substring(0, 1);
    
    if (firstChar.match(/[A-Z]/)) {
      const restOfText = text.substring(1);
      const $pos = cheerio(pos);
      cheerio(`<span class="dropcap dropcap-${firstChar}">${firstChar}</span>`).insertBefore($pos);
      $pos.replaceWith(restOfText);
    }
  }
}

type DropcapFont = {
  name: string
  description: string
  format: "truetype"
  path: (letter: string) => string
};
const dropcapFonts = [
  {
    name: "goudy",
    description: "Goudy Initialen",
    format: "truetype",
    path: (letter: string) => `/dropcaps/goudy/Goudy-Initialen-${letter}.ttf`,
  },
  {
    name: "kanzlei",
    description: "Kanzlei Initialen",
    format: "truetype",
    path: (letter: string) => `/dropcaps/kanzlei/Kanzlei-Initialen-${letter}.ttf`,
  },
  {
    name: "yinit",
    description: "Yinit",
    format: "truetype",
    path: (letter: string) => `/dropcaps/yinit/Yinit-${letter}.ttf`,
    additionalCSS: `
      margin-bottom: -8px;
      margin-top: 8px;
    `
  },
];

export function getDropcapStylesheet(): string {
  const sb: string[] = [];
  
  for (let letterIndex=0; letterIndex<26; letterIndex++) {
    const letter = String.fromCharCode(65+letterIndex);
    for (const font of dropcapFonts) {
      sb.push(`
        @font-face {
          font-family: "${font.name}-${letter}";
          src: url("${font.path(letter)}") format("${font.format}");
        }
        .dropcaps-${font.name} .dropcap-${letter} {
          font-family: "${font.name}-${letter}";
          font-size: 100px;
          float: left;
          line-height: 100px;
          margin-right: 2px;
          ${font.additionalCSS}
        }
      `);
    }
  }
  return sb.join('');
}
