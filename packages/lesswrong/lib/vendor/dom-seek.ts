/*
Modified from: https://github.com/tilgovi/dom-seek

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

const E_END = 'Iterator exhausted before seek ended.'
const E_SHOW = 'Argument 1 of seek must use filter NodeFilter.SHOW_TEXT.'
const E_WHERE = 'Argument 2 of seek must be an integer or a Text Node.'

const DOCUMENT_POSITION_PRECEDING = 2
const SHOW_TEXT = 4
const TEXT_NODE = 3


export default function seek(iter: AnyBecauseTodo, where: AnyBecauseTodo) {
  if (iter.whatToShow !== SHOW_TEXT) {
    let error: AnyBecauseTodo

    // istanbul ignore next
    try {
      error = new DOMException(E_SHOW, 'InvalidStateError')
    } catch {
      error = new Error(E_SHOW);
      error.code = 11
      error.name = 'InvalidStateError'
      error.toString = () => `InvalidStateError: ${E_SHOW}`
    }

    throw error
  }

  let count = 0
  let node = iter.referenceNode
  let predicates = null

  if (isInteger(where)) {
    predicates = {
      forward: () => count < where,
      backward: () => count > where || !iter.pointerBeforeReferenceNode,
    }
  } else if (isText(where)) {
    let forward = before(node, where) ? () => false : () => node !== where
    let backward = () => node !== where || !iter.pointerBeforeReferenceNode
    predicates = {forward, backward}
  } else {
    throw new TypeError(E_WHERE)
  }

  while (predicates.forward()) {
    node = iter.nextNode()

    if (node === null) {
      throw new RangeError(E_END)
    }

    count += node.nodeValue.length
  }

  if (iter.nextNode()) {
    node = iter.previousNode()
  }

  while (predicates.backward()) {
    node = iter.previousNode()

    if (node === null) {
      throw new RangeError(E_END)
    }

    count -= node.nodeValue.length
  }

  if (!isText(iter.referenceNode)) {
    throw new RangeError(E_END);
  }

  return count
}


function isInteger(n: AnyBecauseTodo) {
  if (typeof n !== 'number') return false;
  return isFinite(n) && Math.floor(n) === n;
}


function isText(node: AnyBecauseTodo) {
  return node.nodeType === TEXT_NODE
}


function before(ref: AnyBecauseTodo, node: AnyBecauseTodo) {
  return ref.compareDocumentPosition(node) & DOCUMENT_POSITION_PRECEDING
}
