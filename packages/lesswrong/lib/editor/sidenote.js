export const isSidenote = (node) => {
  return node.nodeName === 'SPAN'
    && node.hasAttribute('data-sidenote');
}

export const toSidenoteHtml = (text) => {
  return '<span data-sidenote>' +
            '<span class="sidenoteNumber"></span>' +
            `<span class="sidenote">${text}</span>` +
          '</span>'
}
