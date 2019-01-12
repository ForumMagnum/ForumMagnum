import React, { Component } from 'react'
import unionClassNames from 'union-class-names'
import linkifyIt from 'linkify-it'
import tlds from 'tlds'
import { Modifier, RichUtils, EditorState } from 'draft-js'

const linkify = linkifyIt()
linkify.tlds(tlds)

// The component we render when we encounter a hyperlink in the text
export default class Link extends Component {

  UNSAFE_componentWillReceiveProps () {
    const editorState = getEditorState()
    console.log('EditorState', editorState)
    const selectionState = editorState.getSelection()
    console.log('selection', selectionState)
    const start = selectionState.getStartOffset();
    const end = selectionState.getEndOffset();
    console.log('start, end', start, end)
    console.log('contentState', contentState)
    // fakeSelectionState =
    const newContentState = contentState.createEntity({
      type: 'LINK',
      mutability: 'MUTABLE',
      data: {href: 'http://foo.net'}
    })
    console.log('newContentState', newContentState)

    console.log('whats this about an entityKey', entityKey)

    const contentStateWithEntity = contentState.createEntity(
      'LINK',
      'MUTABLE',
      {url: 'http://foo.net'}
    );
    const newEditorState = EditorState.set(editorState, { currentContent: contentStateWithEntity });
    this.setState({
      editorState: RichUtils.toggleLink(
        newEditorState,
        selectionState,
        entityKey
      ),
    })
  }

  render() {
    const {
      decoratedText = '',
      theme = {},
      target = '_self',
      rel = 'noreferrer noopener',
      className,
      component,
      dir, // eslint-disable-line no-unused-vars
      entityKey, // eslint-disable-line no-unused-vars
      getEditorState, // eslint-disable-line no-unused-vars
      offsetKey, // eslint-disable-line no-unused-vars
      setEditorState, // eslint-disable-line no-unused-vars
      contentState, // eslint-disable-line no-unused-vars
      ...otherProps
    } = this.props
    const {
      depth
    } = this.state

    const combinedClassName = unionClassNames(theme.link, className)
    const links = linkify.match(decoratedText)
    const href = links && links[0] ? links[0].url : ''

    const props = {
      ...otherProps,
      href,
      target,
      rel,
      className: combinedClassName,
    }

    return component
      ? React.createElement(component, props)
      : <a {...props} />
  }
}
