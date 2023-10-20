/*
Modified from: https://github.com/tilgovi/dom-anchor-text-position

Copyright (c) 2015 Randall Leeds

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

import seek from './dom-seek'

const SHOW_TEXT = 4

export function fromRange(root: AnyBecauseTodo, range: AnyBecauseTodo) {
  if (root === undefined) {
    throw new Error('missing required parameter "root"')
  }
  if (range === undefined) {
    throw new Error('missing required parameter "range"')
  }

  let document = root.ownerDocument
  let prefix = document.createRange()

  let startNode = range.startContainer
  let startOffset = range.startOffset

  prefix.setStart(root, 0)
  prefix.setEnd(startNode, startOffset)

  let start = rangeToString(prefix).length
  let end = start + rangeToString(range).length

  return {
    start: start,
    end: end,
  }
}


export function toRange(root: AnyBecauseTodo, selector: AnyBecauseTodo = {}) {
  if (root === undefined) {
    throw new Error('missing required parameter "root"')
  }

  const document = root.ownerDocument
  const range = document.createRange()
  const iter = document.createNodeIterator(root, SHOW_TEXT)

  const start: AnyBecauseTodo = selector.start || 0
  const end: AnyBecauseTodo = selector.end || start

  const startOffset = start - seek(iter, start);
  const startNode = iter.referenceNode;

  const remainder = end - start + startOffset;

  const endOffset = remainder - seek(iter, remainder);
  const endNode = iter.referenceNode;

  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)

  return range
}

/**
 * Return the next node after `node` in a tree order traversal of the document.
 */
function nextNode(node: AnyBecauseTodo, skipChildren?: AnyBecauseTodo) {
  if (!skipChildren && node.firstChild) {
    return node.firstChild
  }

  do {
    if (node.nextSibling) {
      return node.nextSibling
    }
    node = node.parentNode
  } while (node)

  /* istanbul ignore next */
  return node
}

function firstNode(range: AnyBecauseTodo) {
  if (range.startContainer.nodeType === Node.ELEMENT_NODE) {
    const node = range.startContainer.childNodes[range.startOffset]
    return node || nextNode(range.startContainer, true /* skip children */)
  }
  return range.startContainer
}

function firstNodeAfter(range: AnyBecauseTodo) {
  if (range.endContainer.nodeType === Node.ELEMENT_NODE) {
    const node = range.endContainer.childNodes[range.endOffset]
    return node || nextNode(range.endContainer, true /* skip children */)
  }
  return nextNode(range.endContainer)
}

function forEachNodeInRange(range: AnyBecauseTodo, cb: AnyBecauseTodo) {
  let node = firstNode(range)
  const pastEnd = firstNodeAfter(range)
  while (node !== pastEnd) {
    cb(node)
    node = nextNode(node)
  }
}

/**
 * A ponyfill for Range.toString().
 * Spec: https://dom.spec.whatwg.org/#dom-range-stringifier
 *
 * Works around the buggy Range.toString() implementation in IE and Edge.
 * See https://github.com/tilgovi/dom-anchor-text-position/issues/4
 */
function rangeToString(range: AnyBecauseTodo) {
  // This is a fairly direct translation of the Range.toString() implementation
  // in Blink.
  let text = ''
  forEachNodeInRange(range, (node: AnyBecauseTodo) => {
    if (node.nodeType !== Node.TEXT_NODE) {
      return
    }
    const start = node === range.startContainer ? range.startOffset : 0
    const end = node === range.endContainer ? range.endOffset : node.textContent.length
    text += node.textContent.slice(start, end)
  })
  return text
}
