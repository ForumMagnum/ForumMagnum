import React, { Component } from 'react'
import processTeX from '../mathjax/processTeX'

/**
 * React component to render maths using mathjax
 */
class MathJaxNode extends Component {
  constructor(props) {
    super(props)
    this.timeout = props.timeout
    this.annul = null
    this.state = { ready: window.MathJax && window.MathJax.ready }
  }

  componentDidMount() {
    if (this.state.ready) this.typeset()
    else {
      const { check } = this.props
      this.annul = setInterval(() => {
        if (window.MathJax && window.MathJax.isReady) {
          this.setState({ ready: true })
          clearInterval(this.annul)
        } else {
          if (this.timeout < 0) { clearInterval(this.annul) }
          this.timeout -= check
        }
      }, check)
    }
  }

  /**
   * Prevent update when the tex has not changed
   */
  shouldComponentUpdate(nextProps, nextState) {
    return (
      nextProps.children !== this.props.children
      || nextProps.inline !== this.props.inline
      || nextState.ready !== this.state.ready
    )
  }

  /**
   * Update the jax, force update if the display mode changed
   */
  componentDidUpdate(prevProps) {
    const forceUpdate = prevProps.inline !== this.props.inline
    this.typeset(forceUpdate)
  }

  /**
   * Clear the math when unmounting the node
   */
  componentWillUnmount() {
    clearInterval(this.annul)
    this.clear()
  }

  /**
   * Create a script
   * @param  {String} text
   * @return {DOMNode} script
   */
  setScriptText(text) {
    const { inline } = this.props

    if (!this.script) {
      this.script = document.createElement('script')
      this.script.type = `math/tex; ${inline ? '' : 'mode=display'}`
      this.node.appendChild(this.script)
    }

    if ('text' in this.script) {
      // IE8, etc
      this.script.text = text
    } else {
      this.script.textContent = text
    }

    return this.script
  }

  /**
   * Clear the jax
   */
  clear() {
    const MathJax = window.MathJax

    if (!this.script || !MathJax || !MathJax.isReady) {
      return
    }

    const jax = MathJax.Hub.getJaxFor(this.script)
    if (jax) {
      jax.Remove()
    }
  }

  /**
   * Update math in the node.
   * @param {Boolean} forceUpdate
   */
  typeset(forceUpdate) {
    const MathJax = window.MathJax
    const { children, onRender } = this.props

    const text = children

    if (forceUpdate) {
      this.clear()
    }

    if (!forceUpdate && this.script) {
      MathJax.Hub.Queue(() => {
        const jax = MathJax.Hub.getJaxFor(this.script)

        if (jax) jax.Text(text, onRender)
        else {
          const script = this.setScriptText(text)
          processTeX(MathJax, script, onRender)
        }
      })
    } else {
      const script = this.setScriptText(text)
      MathJax.Hub.Queue(() =>
        processTeX(MathJax, script, onRender),
      )
    }
  }


  render() {
    if (this.state.ready) {
      return <span ref={(node) => { this.node = node }} />
    }
    return <span style={{ color: 'red' }}>{this.props.children}</span>
  }

}

MathJaxNode.defaultProps = {
  inline: false,
  onRender: () => {},
  timeout: 10000,
  check: 50,
}

export default MathJaxNode
