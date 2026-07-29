// Builds the inline rule that recognizes `\(...\)` / `\[...\]` / `\begin{}...`
// math. `singleBackslashInline` selects the inline delimiter dialect:
//  - false (default, reader surfaces): legacy doubled delimiters, i.e.
//    markdown source `\\(...\\)` / `\\[...\\]`.
//  - true (agent surfaces): bare `\(...\)` for inline math, while display math
//    keeps the legacy doubled delimiter.
//
// Agent markdown deliberately does not recognize bare `\[...\]` as display
// math. CommonMark uses that syntax for escaped literal square brackets, and
// the agent read API emits it for prose such as `[section]`. Display math from
// agents has the unambiguous `$$...$$` form instead.
// `\begin{env}...\end{env}` is single-backslash in both dialects.
function makeMathRule (singleBackslashInline: boolean) {
  var openInline = singleBackslashInline ? '\\(' : '\\\\('
  var openDisplay = '\\\\['
  var closeInline = singleBackslashInline ? '\\)' : '\\\\)'
  var closeDisplay = '\\\\]'
  return function math (state: AnyBecauseTodo, silent: AnyBecauseTodo) {
    var src: string = state.src
    var pos: number = state.pos
    if (src.charCodeAt(pos) !== 0x5C /* \ */) {
      return false
    }
    var rest = src.slice(pos)
    var type: AnyBecauseTodo, contentStart: number, endMarker: string, includeMarkers = false
    var beginMatch = rest.match(/^\\begin\{([^}]*)\}/)
    if (beginMatch) {
      type = 'math'
      contentStart = pos
      endMarker = '\\end{' + beginMatch[1] + '}'
      includeMarkers = true
    } else if (rest.startsWith(openInline)) {
      type = 'inline_math'
      contentStart = pos + openInline.length
      endMarker = closeInline
    } else if (rest.startsWith(openDisplay)) {
      type = 'display_math'
      contentStart = pos + openDisplay.length
      endMarker = closeDisplay
    } else {
      return false
    }
    var endMarkerPos = src.indexOf(endMarker, contentStart)
    if (endMarkerPos === -1) {
      return false
    }
    var nextPos = endMarkerPos + endMarker.length
    if (!silent) {
      var token = state.push(type, '', 0)
      token.content = includeMarkers
        ? src.slice(pos, nextPos)
        : src.slice(contentStart, endMarkerPos)
    }
    state.pos = nextPos
    return true
  }
}

function texMath (state: AnyBecauseTodo, silent: boolean) {
  var startMathPos = state.pos
  if (state.src.charCodeAt(startMathPos) !== 0x24 /* $ */) {
    return false
  }

  // Parse tex math according to http://pandoc.org/README.html#math
  var endMarker = '$'
  var afterStartMarker = state.src.charCodeAt(++startMathPos)
  if (afterStartMarker === 0x24 /* $ */) {
    endMarker = '$$'
    if (state.src.charCodeAt(++startMathPos) === 0x24 /* $ */) {
      // 3 markers are too much
      return false
    }
  } else {
    // Skip if opening $ is succeeded by a space character
    if (afterStartMarker === 0x20 /* space */ || afterStartMarker === 0x09 /* \t */ || afterStartMarker === 0x0a /* \n */) {
      return false
    }
  }
  var endMarkerPos = state.src.indexOf(endMarker, startMathPos)
  if (endMarkerPos === -1) {
    return false
  }
  if (state.src.charCodeAt(endMarkerPos - 1) === 0x5C /* \ */) {
    return false
  }
  var nextPos = endMarkerPos + endMarker.length
  if (endMarker.length === 1) {
    // Skip if $ is preceded by a space character
    var beforeEndMarker = state.src.charCodeAt(endMarkerPos - 1)
    if (beforeEndMarker === 0x20 /* space */ || beforeEndMarker === 0x09 /* \t */ || beforeEndMarker === 0x0a /* \n */) {
      return false
    }
    // Skip if closing $ is succeeded by a digit (eg $5 $10 ...)
    var suffix = state.src.charCodeAt(nextPos)
    if (suffix >= 0x30 && suffix < 0x3A) {
      return false
    }
  }

  if (!silent) {
    var token = state.push(endMarker.length === 1 ? 'inline_math' : 'display_math', '', 0)
    token.content = state.src.slice(startMathPos, endMarkerPos)
  }
  state.pos = nextPos
  return true
}

function escapeHtml (html: string) {
  return html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ')
}

function extend (options: AnyBecauseTodo, defaults: AnyBecauseTodo) {
  return Object.keys(defaults).reduce(function (result, key) {
    if (result[key] === undefined) {
      result[key] = defaults[key]
    }
    return result
  }, options)
}

var mapping: AnyBecauseTodo = {
  'math': 'Math',
  'inline_math': 'InlineMath',
  'display_math': 'DisplayMath'
}

export default function (options?: any) {
  var defaults = {
    beforeMath: '',
    afterMath: '',
    beforeInlineMath: '\\(',
    afterInlineMath: '\\)',
    beforeDisplayMath: '\\[',
    afterDisplayMath: '\\]'
  }
  // When set, render math as the editable-dialect `<span class="math-tex">`
  // representation that `MathNode.importDOM` consumes (the inverse of the
  // `latex-spans` Turndown rule), rather than bare `\(...\)` / `\[...\]`
  // text. The agent write path uses this so agent-supplied `$...$`
  // round-trips into real MathNodes; the publishing path leaves the bare
  // delimiters for `renderMathInHtml` to pre-render for readers.
  var wrapInMathTex = !!(options && options.wrapInMathTex)
  // When set, `\(...\)` opens inline math with a single backslash. Bare
  // `\[...\]` remains escaped literal brackets because that syntax is
  // ambiguous in CommonMark; agent display math uses `$$...$$`.
  var singleBackslashInlineDelimiter = !!(options && options.singleBackslashInlineDelimiter)
  options = extend(options || {}, defaults)

  return function (md: AnyBecauseTodo) {
    md.inline.ruler.before('escape', 'math', makeMathRule(singleBackslashInlineDelimiter))
    md.inline.ruler.push('texMath', texMath)

    Object.keys(mapping).forEach(function (key) {
      var before = options['before' + mapping[key]]
      var after = options['after' + mapping[key]]
      md.renderer.rules[key] = function (tokens: AnyBecauseTodo, idx: AnyBecauseTodo) {
        var rendered = before + escapeHtml(tokens[idx].content) + after
        // The `\(...\)` / `\[...\]` delimiters inside the span carry the
        // inline-vs-display distinction, so a span tag works for both.
        return wrapInMathTex ? '<span class="math-tex">' + rendered + '</span>' : rendered
      }
    })
  }
}
