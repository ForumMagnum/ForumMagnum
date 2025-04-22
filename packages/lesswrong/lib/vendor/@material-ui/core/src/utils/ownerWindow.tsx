import ownerDocument from './ownerDocument';

function ownerWindow(node: Node, fallback = window) {
  const doc = ownerDocument(node);
  return doc.defaultView || (doc as any).parentView || fallback;
}

export default ownerWindow;
