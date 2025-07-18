import { StylesContextType } from "@/components/hooks/useStyles";
import type { StyleDefinition } from "@/server/styleGeneration";
import { create as jssCreate, SheetsRegistry } from "jss";
import jssCamelCase from "jss-plugin-camel-case";
import jssDefaultUnit from "jss-plugin-default-unit";
import jssGlobal from "jss-plugin-global";
import jssNested from "jss-plugin-nested";
import jssPropsSort from "jss-plugin-props-sort";
import jssVendorPrefixer from "jss-plugin-vendor-prefixer";

// This `any` should actually be `CSSProperties` from either MUI or JSS but this
// currently causes an avalanche of type errors, I think due to the fact that
// we're stuck on a precambrian version of MUI. Upgrading would probably fix this.
export type JssStyles<ClassKey extends string = string> = Record<ClassKey, AnyBecauseHard>;

export type JssStylesCallback<ClassKey extends string = string> = (theme: ThemeType) => JssStyles<ClassKey>;

export function getJss() {
  return jssCreate({
    plugins: [
      jssGlobal(),
      jssNested(),
      jssCamelCase(),
      jssDefaultUnit(),
      jssVendorPrefixer(),
      jssPropsSort(),
    ],
  });
}

export function createStylesContext(theme: ThemeType): StylesContextType {
  return {
    theme,
    mountedStyles: new Map<string, {
      refcount: number;
      styleDefinition: StyleDefinition<any>;
      styleNode?: HTMLStyleElement;
    }>()
  };
}


/**
 * Takes a detached style element, and inserts it into the DOM as a child of
 * the `head` element, at a position determined by the precedence-affecting
 * options in `styleDefinition`.
 *
 * Style elements are children of the `head` tag, in between a style tag with ID
 * "jss-insertion-start" and a style tag with ID "jss-insertion-end". They are
 * sorted first by priority, which is both passed to this function as a number
 * and present on all style nodes as a string in the `data-priority` attribute.
 * Styles with the same priority are sorted by name, which is passed as the
 * `name` parameter and is present on the style nodes as the `data-name`
 * attribute.
 */
function insertStyleNodeAtCorrectPosition(styleNode: HTMLStyleElement, name: string, priority: number) {
  // TODO: maybe switch back to only scanning the head for the styles with data-priority
  // if I can figure out how to get the insertion-point tags into the head without them being duplicated
  // const head = document.head;
  const startNode = document.getElementById('jss-insertion-start');
  const endNode = document.getElementById('jss-insertion-end');

  if (!startNode || !endNode) {
    throw new Error('Insertion point markers not found');
  }

  styleNode.setAttribute('data-priority', priority.toString());
  styleNode.setAttribute('data-name', name);

  const styleNodes = Array.from(document.querySelectorAll('style[data-priority]'));
  let left = 0;
  let right = styleNodes.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midNode = styleNodes[mid] as HTMLStyleElement;
    const midPriority = parseInt(midNode.getAttribute('data-priority') || '0', 10);
    const midName = midNode.getAttribute('data-name') || '';
  
    if (midPriority < priority || (midPriority === priority && midName < name)) {
      left = mid + 1;
    } else if (midPriority > priority || (midPriority === priority && midName > name)) {
      right = mid - 1;
    } else {
      // Equal priority and name, insert after this node
      midNode.insertAdjacentElement('afterend', styleNode);
      return;
    }
  }

  // If we didn't find an exact match, insert at the position determined by 'left'
  if (left === styleNodes.length) {
    // Insert before the end marker
    endNode.insertAdjacentElement('beforebegin', styleNode);
  } else if (left === 0) {
    // Insert after the start marker
    startNode.insertAdjacentElement('afterend', styleNode);
  } else {
    // Insert before the node at the 'left' index
    styleNodes[left].insertAdjacentElement('beforebegin', styleNode);
  }
}


export function createAndInsertStyleNode(theme: ThemeType, styleDefinition: StyleDefinition): HTMLStyleElement {
  const stylesStr = styleNodeToString(theme, styleDefinition);
  const styleNode = document.createElement("style");
  styleNode.append(document.createTextNode(stylesStr));
  styleNode.setAttribute("data-name", styleDefinition.name);
  styleNode.setAttribute("data-priority", styleDefinition.name);
  styleNode.setAttribute("data-theme-name", theme.themeOptions.name);
  insertStyleNodeAtCorrectPosition(styleNode, styleDefinition.name, styleDefinition.options?.stylePriority ?? 0);
  return styleNode;
}

function styleNodeToString(theme: ThemeType, styleDefinition: StyleDefinition): string {
  const sheets = new SheetsRegistry()
  
  const jss = getJss();
  const sheet = jss.createStyleSheet(
    styleDefinition.styles(theme), {
      generateId: (rule,sheet) => {
        if (rule.type === 'keyframes') {
          return (rule as AnyBecauseHard).name;
        }
        return `${styleDefinition.name}-${rule.key}`
      },
    }
  );
  sheets.add(sheet);
  return sheets.toString();
}
