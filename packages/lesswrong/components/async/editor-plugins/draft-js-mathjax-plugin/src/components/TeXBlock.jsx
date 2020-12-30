import React, { Component } from 'react'
import MathJaxNode from './MathJaxNode'
import TeXInput from './TeXInput'
import { finishEdit, saveTeX } from '../modifiers/utils'
import Styles from './styles'

const styles = Styles.block

export default class TeXBlock extends Component {

  constructor(props) {
    super(props)

    this.state = this.getInitialState()

    this._update = (key) => {
      if (this.state.editMode) { return }
      const store = this.props.blockProps.getStore()

      this.setState({ editMode: true }, () => {
        store.setReadOnly(true)
        if (key) { store.teXToUpdate = {} }
      })
    }

    this.onChange = ({ teX }) => {
      this.setState({ teX })
    }

    this.save = (after) => {
      this.setState({ editMode: false }, () => {
        const store = this.props.blockProps.getStore()
        const { teX } = this.state
        const { contentState, block } = this.props
        store.completion.updateMostUsedTeXCmds(
          teX,
          block.getData().teX,
        )
        finishEdit(store)(
          ...saveTeX({
            after,
            contentState,
            teX,
            block,
          }),
        )
      })
    }

    this.getCaretPos = () => {
      const { dir } = this.props.blockProps.getStore().teXToUpdate
      if (!dir || dir === 'l') { return this.state.teX.length }
      return 0
    }
  }

  getInitialState() {
    const { block } = this.props
    const teX = block.getData().get('teX')
    return { editMode: teX.length === 0, teX }
  }

  componentWillMount() {
    const store = this.props.blockProps.getStore()
    if (this.state.editMode) {
      store.setReadOnly(true)
    }
  }

  componentWillReceiveProps(nextProps) {
    const { key } = nextProps.blockProps.getStore().teXToUpdate
    if (key === nextProps.block.getKey()) {
      this._update(key)
    }
  }

  render() {
    const { editMode, teX, displaystyle } = this.state

    const store = this.props.blockProps.getStore()
    const completion = store.completion

    let input = null
    if (editMode) {
      // className={'TeXBlock-edit'}
      input = (
        <TeXInput
          onChange={this.onChange}
          teX={teX}
          displaystyle={displaystyle}
          finishEdit={this.save}
          completion={completion}
          caretPosFn={this.getCaretPos}
          style={styles.edit}
        />
      )
    }

    const rendered = (
      <MathJaxNode>
        {teX}
      </MathJaxNode>
      )

    const style = styles[(editMode ? 'preview' : 'rendered')]
    return (
      <div
        style={{ position: editMode ?
          'relative' : undefined,
        }}
      >
        {input}
        <div
          onMouseDown={() => this._update()}
          style={style}
        >
          {rendered}
        </div>
      </div>
    )
  }
}
