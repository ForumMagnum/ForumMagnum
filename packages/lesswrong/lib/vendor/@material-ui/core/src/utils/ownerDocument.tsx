function ownerDocument(node: Node) {
  return (node && node.ownerDocument) || document;
}

export default ownerDocument;
