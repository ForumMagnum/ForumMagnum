import React from 'react'

const _isAlpha = key => key.length === 1 &&
      /[a-z]/.test(key.toLowerCase())

function indent({ text, start, end }, unindent = false) {
  const nl0 = text.slice(0, start).split('\n').length - 1
  const nl1 = nl0 + (text.slice(start, end).split('\n').length - 1)
  let nStart = start
  let nEnd = end
  const nText = text
    .split('\n')
    .map((l, i) => {
      if (i < nl0 || i > nl1) { return l }
      if (!unindent) {
        if (i === nl0) { nStart += 2 }
        nEnd += 2
        return `  ${l}`
      }
      if (l.startsWith('  ')) {
        if (i === nl0) { nStart -= 2 }
        nEnd -= 2
        return l.slice(2)
      }
      if (l.startsWith(' ')) {
        if (i === nl0) { nStart -= 1 }
        nEnd -= 1
        return l.slice(1)
      }
      return l
    })
    .join('\n')
  return { text: nText, start: nStart, end: nEnd }
}

const closeDelim = {
  '{': '}',
  '(': ')',
  '[': ']',
  '|': '|',
}

class TeXInput extends React.Component {

  constructor(props) {
    super(props)
    const {
      onChange,
      caretPosFn,
    } = props

    const pos = caretPosFn()
    this.state = {
      start: pos,
      end: pos,
    }

    this.completionList = []
    this.index = 0

    this._onChange = () => onChange({
      teX: this.teXinput.value,
    })

    this._onSelect = () => {
      const { selectionStart: start, selectionEnd: end } = this.teXinput
      this.setState({ start, end })
    }

    this._moveCaret = (offset, relatif = false) => {
      const { teX: value } = this.props
      const { start, end } = this.state

      if (start !== end) return

      let newOffset = relatif ? start + offset : offset
      if (newOffset < 0) {
        newOffset = 0
      } else if (newOffset > value.length) {
        newOffset = value.length
      }

      this.setState({ start: newOffset, end: newOffset })
    }

    this._insertText = (text, offset = 0) => {
      let { teX: value } = this.props
      let { start, end } = this.state
      value = value.slice(0, start) + text + value.slice(end)
      start += text.length + offset
      if (start < 0) {
        start = 0
      } else if (start > value.length) {
        start = value.length
      }
      end = start
      onChange({ teX: value })
      this.setState({ start, end })
    }

    this.onBlur = () => this.props.finishEdit()

    this.handleKey = this.handleKey.bind(this)
  }

  componentDidMount() {
    const { start, end } = this.state
    setTimeout(() => {
      this.teXinput.focus()
      this.teXinput.setSelectionRange(start, end)
    }, 0)
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.teX !== nextProps.teX) {
      return true
    }
    const { start, end } = nextState
    const { selectionStart, selectionEnd } = this.teXinput
    if (start === selectionStart && end === selectionEnd) {
      return false
    }
    return true
  }

  componentDidUpdate(prevProps, prevState) {
    const { start: s, end: e } = prevState
    const { start: ns, end: ne } = this.state
    if (s !== ns || e !== ne) {
      this.teXinput.setSelectionRange(ns, ne)
    }
  }

  handleKey(evt) {
    const { teX, finishEdit, onChange, displaystyle, completion } = this.props
    const { start, end } = this.state
    const inlineMode = displaystyle !== undefined
    const collapsed = start === end
    const cplDisable = completion.status === 'none'
    const key = evt.key

    if (!cplDisable && key !== 'Tab' && key !== 'Shift') {
      this.completionList = []
      this.index = 0
    }

    switch (key) {
      case '$': {
        if (inlineMode) {
          evt.preventDefault()
          onChange({ displaystyle: !displaystyle })
        }
        break
      }
      case 'Escape': {
        evt.preventDefault()
        finishEdit(1)
        break
      }
      case 'ArrowLeft': {
        const atBegin = collapsed && end === 0
        if (atBegin) {
          evt.preventDefault()
          finishEdit(0)
        }
        break
      }
      case 'ArrowRight': {
        const atEnd = collapsed && start === teX.length
        if (atEnd) {
          evt.preventDefault()
          finishEdit(1)
        }
        break
      }
      default:
        if (
          Object.prototype.hasOwnProperty
          .call(closeDelim, key)
        ) {
          // insertion d'un délimiteur
          evt.preventDefault()
          this._insertText(key + closeDelim[key], -1)
        } else if (
          !cplDisable && ((
            _isAlpha(key) &&
            completion.status === 'auto'
          ) || (
            key === 'Tab' &&
            this.completionList.length > 1
          ) || (
            completion.status === 'manual' &&
            evt.ctrlKey &&
            key === ' '
          ))
        ) {
          // completion
          this._handleCompletion(evt)
        } else if (key === 'Tab') {
          // gestion de l'indentation
          const lines = teX.split('\n')
          if (inlineMode || lines.length <= 1) {
            // pas d'indentation dans ce cas
            evt.preventDefault()
            finishEdit(evt.shiftKey ? 0 : 1)
          } else {
            const {
              text,
              start: ns,
              end: ne,
            } = indent(
              { text: teX, start, end },
              evt.shiftKey,
            )
            evt.preventDefault()
            onChange({ teX: text })
            setTimeout(() => this.setState({
              start: ns,
              end: ne,
            }), 0)
          }
        }
    }
  }

  _handleCompletion(evt) {
    const { completion, teX, onChange } = this.props
    const { start, end } = this.state
    const key = evt.key
    const prefix = completion.getLastTeXCommand(teX.slice(0, start))
    const pl = prefix.length
    const startCmd = start - pl
    const isAlpha = _isAlpha(key)
    let ns = start
    let offset

    if (!pl) { return }

    if (isAlpha || (evt.ctrlKey && key === ' ')) {
      this.completionList = completion.computeCompletionList(
        prefix + (isAlpha ? key : ''),
      )
    }

    const L = this.completionList.length
    if (L === 0) {
      return
    } else if (L === 1) {
      // une seule possibilité: insertion!
      this.index = 0
    } else if (key === 'Tab') {
      // Tab ou S-Tab: on circule...
      offset = evt.shiftKey ? -1 : 1
      this.index += offset
      this.index = (this.index === -1) ? L - 1 : this.index % L
    } else {
      // isAlpha est true et plusieurs completions possibles
      this.index = 0
      ns = isAlpha ? ns + 1 : ns // pour avancer après la lettre insérée le cas échéant
    }

    const cmd = this.completionList[this.index]
    const endCmd = startCmd + cmd.length
    const teXUpdated = teX.slice(0, startCmd) +
      cmd + teX.slice(end)
    ns = L === 1 ? endCmd : ns

    evt.preventDefault()
    onChange({ teX: teXUpdated })
    setTimeout(() => this.setState({
      start: ns,
      end: endCmd,
    }), 0)
  }

  // handleKey(evt) {
  //   const key = evt.key

  //   const { teX, finishEdit, onChange, displaystyle, completion } = this.props
  //   const { start, end } = this.state
  //   const inlineMode = displaystyle !== undefined

  //   const collapsed = start === end
  //   const atEnd = collapsed && teX.length === end
  //   const atBegin = collapsed && end === 0

  //   const ArrowLeft = key === 'ArrowLeft'
  //   const ArrowRight = key === 'ArrowRight'
  //   const Escape = key === 'Escape'
  //   const Tab = key === 'Tab'
  //   const Space = key === ' '
  //   const $ = key === '$'
  //   const Shift = evt.shiftKey
  //   const Ctrl = evt.ctrlKey
    // const isDelim = Object.prototype.hasOwnProperty
    //   .call(closeDelim, key)

  //   const toggleDisplaystyle = $ && inlineMode

  //   const findCompletion = Tab && this.completionList.length > 1
  //   const launchCompletion = Ctrl && Space
  //   const isAlpha = key.length === 1 &&
  //     /[a-z]/.test(key.toLowerCase())

  //   // sortie du mode édition
  //   if ((
  //     ArrowLeft && atBegin
  //   ) || (
  //     ArrowRight && atEnd
  //   ) || (
  //     Tab && this.completionList.length === 0
  //   ) || (
  //     Escape
  //   )) {
  //     evt.preventDefault()
  //     finishEdit(ArrowLeft ? 0 : 1)
  //   }

  //   if (toggleDisplaystyle) {
  //     evt.preventDefault()
  //     onChange({ displaystyle: !displaystyle })
  //   }

  //   // insertion d'un délimiteur
  //   if (isDelim) {
  //     evt.preventDefault()
  //     this._insertText(key + closeDelim[key], -1)
  //   }

  //   // completion
  //   if (!findCompletion) {
  //     this.index = 0
  //     this.completionList = []
  //   }
  //   if (
  //     completion.status !== 'none' &&
  //     (
  //       (isAlpha && completion.status === 'auto') ||
  //       launchCompletion ||
  //       findCompletion
  //     )
  //   ) {
  //     const prefix = getLastTeXCommand(teX.slice(0, start))
  //     const pl = prefix.length
  //     const startCmd = start - pl
  //     let ns = start
  //     let offset

  //     if (!pl) { return }

  //     if (isAlpha || launchCompletion) {
  //       this.completionList = computeCompletionList(
  //         prefix + (launchCompletion ? '' : key),
  //         this.teXCommands,
  //         this.mostUsedCommands,
  //       )
  //     }

  //     const L = this.completionList.length
  //     if (L === 0) {
  //       return
  //     } else if (L === 1) {
  //       // une seule possibilité: insertion!
  //       this.index = 0
  //     } else if (findCompletion) {
  //       // Tab ou S-Tab: on circule...
  //       offset = Shift ? -1 : 1
  //       this.index += offset
  //       this.index = (this.index === -1) ? L - 1 : this.index % L
  //     } else {
  //       // isAlpha est true et plusieurs completions possibles
  //       this.index = 0
  //       ns = isAlpha ? ns + 1 : ns // pour avancer après la lettre insérée le cas échéant
  //     }

  //     const cmd = this.completionList[this.index]
  //     const endCmd = startCmd + cmd.length
  //     const teXUpdated = teX.slice(0, startCmd) +
  //       cmd + teX.slice(end)
  //     ns = L === 1 ? endCmd : ns

  //     evt.preventDefault()
  //     onChange({ teX: teXUpdated })
  //     setTimeout(() => this.setState({
  //       start: ns,
  //       end: endCmd,
  //     }), 0)
  //   }
  // }

  render() {
    const { teX, className, style } = this.props
    const teXArray = teX.split('\n')
    const rows = teXArray.length
    const cols = teXArray
      .map(tl => tl.length)
      .reduce((acc, size) => (size > acc ? size : acc), 1)
    return (
      <textarea
        rows={rows}
        cols={cols}
        className={className}
        value={teX}
        onChange={this._onChange}
        onSelect={this._onSelect}
        onBlur={this.onBlur}
        onKeyDown={this.handleKey}
        ref={(teXinput) => { this.teXinput = teXinput }}
        style={style}
      />
    )
  }
}

export default TeXInput
