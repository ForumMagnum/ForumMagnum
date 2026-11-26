import * as Y from 'yjs';

// Must match the root key used by @lexical/yjs.
const LEXICAL_ROOT_KEY = 'root';

export const RESTORE_TRANSACTION_ORIGIN = Symbol('restore-document');

type ClonedValue = object | string | number | boolean | null;

// Lexical stores non-string attributes (numbers, booleans, objects) on
// decorator nodes' XmlElements, which yjs's default XmlElement typing
// (string-valued attributes) doesn't allow.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LexicalXmlElement = Y.XmlElement<Record<string, any>>;

interface DeltaOperation {
  insert: unknown;
  attributes?: Record<string, unknown>;
}

function cloneDelta(delta: DeltaOperation[]): DeltaOperation[] {
  return delta.map(({ insert, attributes }) => ({
    insert: cloneYValue(insert),
    ...(attributes ? { attributes: { ...attributes } } : {}),
  }));
}

function cloneXmlText(source: Y.XmlText): Y.XmlText {
  const clone = new Y.XmlText();
  for (const [name, value] of Object.entries(source.getAttributes())) {
    clone.setAttribute(name, cloneYValue(value));
  }
  clone.applyDelta(cloneDelta(source.toDelta()), { sanitize: false });
  return clone;
}

function cloneXmlChild(source: Y.XmlElement | Y.XmlText | Y.XmlHook): LexicalXmlElement | Y.XmlText {
  if (source instanceof Y.XmlText) {
    return cloneXmlText(source);
  }
  if (source instanceof Y.XmlElement) {
    return cloneXmlElement(source);
  }
  throw new Error('Unsupported Y.XmlHook in restored document');
}

function cloneXmlElement(source: Y.XmlElement): LexicalXmlElement {
  const clone: LexicalXmlElement = new Y.XmlElement(source.nodeName);
  for (const [name, value] of Object.entries(source.getAttributes())) {
    clone.setAttribute(name, cloneYValue(value));
  }
  clone.insert(0, source.toArray().map(cloneXmlChild));
  return clone;
}

/**
 * Deep-copies a value from one Y.Doc into a fresh, unintegrated Yjs type, so
 * it can be inserted into another Y.Doc. The built-in `clone()` methods can't
 * be used: YXmlText.clone() drops attributes (where Lexical stores node
 * properties) and doesn't recursively clone embedded types.
 */
function cloneYValue(value: unknown): ClonedValue {
  if (value instanceof Y.XmlText) {
    return cloneXmlText(value);
  }
  if (value instanceof Y.Text) {
    const clone = new Y.Text();
    clone.applyDelta(cloneDelta(value.toDelta()), { sanitize: false });
    return clone;
  }
  if (value instanceof Y.XmlElement) {
    return cloneXmlElement(value);
  }
  if (value instanceof Y.XmlHook || value instanceof Y.XmlFragment) {
    throw new Error(`Unsupported ${value.constructor.name} in restored document`);
  }
  if (value instanceof Y.Map) {
    const clone = new Y.Map<ClonedValue>();
    value.forEach((entry: unknown, key: string) => {
      clone.set(key, cloneYValue(entry));
    });
    return clone;
  }
  if (value instanceof Y.Array) {
    const clone = new Y.Array<ClonedValue>();
    clone.push(value.toArray().map(cloneYValue));
    return clone;
  }
  if (value instanceof Y.AbstractType || value instanceof Y.Doc) {
    throw new Error(`Unsupported ${value.constructor.name} in restored document`);
  }
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'object') {
    return value;
  }
  throw new Error(`Unsupported value of type ${typeof value} in restored document`);
}

/**
 * Replaces the Lexical content of `target` with a copy of the Lexical content
 * of `source`, as an ordinary Yjs transaction on `target`.
 *
 * This is how a restore is applied to a live document. Replacing the
 * document's stored state wholesale doesn't work: any client still holding the
 * pre-restore Y.Doc (another open tab, a collaborator, an IndexedDB cache)
 * would sync its newer history back on reconnect and undo the restore. As a
 * forward edit, the restore is newer than everything those clients have, so
 * it survives the merge.
 */
export function replaceLexicalContents(target: Y.Doc, source: Y.Doc): void {
  const targetRoot = target.get(LEXICAL_ROOT_KEY, Y.XmlText);
  const sourceRoot = source.get(LEXICAL_ROOT_KEY, Y.XmlText);
  const sourceAttributes = sourceRoot.getAttributes();

  target.transact(() => {
    for (const name of Object.keys(targetRoot.getAttributes())) {
      if (!(name in sourceAttributes)) {
        targetRoot.removeAttribute(name);
      }
    }
    for (const [name, value] of Object.entries(sourceAttributes)) {
      targetRoot.setAttribute(name, cloneYValue(value));
    }
    targetRoot.delete(0, targetRoot.length);
    targetRoot.applyDelta(cloneDelta(sourceRoot.toDelta()), { sanitize: false });
  }, RESTORE_TRANSACTION_ORIGIN);
}
