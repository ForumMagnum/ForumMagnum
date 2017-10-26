/* eslint-disable prefer-reflect, default-case, react/display-name */
import React from 'react'
import H2Icon from 'material-ui/svg-icons/editor/title'
import {white, red500, greenA200} from 'material-ui/styles/colors';

import Plugin from './plugin'
import { ToolbarButton } from './ToolbarButton'

export const H1 = 'HEADINGS/HEADING-ONE'
export const H2 = 'HEADINGS/HEADING-TWO'
export const H3 = 'HEADINGS/HEADING-THREE'
export const H4 = 'HEADINGS/HEADING-FOUR'
export const H5 = 'HEADINGS/HEADING-FIVE'
export const H6 = 'HEADINGS/HEADING-SIX'

export type Props = {
  editorState: any,
  onChange(editorState: any): void,
  DEFAULT_NODE: string
}

export const makeTagNode = Tag => {
  const NodeComponent = ({
    attributes,
    children,
    node
  }: {
    attributes: Object,
    children: any,
    node: any
  }) => {
    const align = node.data.get('align')
    return (
      <Tag {...attributes} style={{ textAlign: align }}>
        {children}
      </Tag>
    )
  }

  NodeComponent.displayName = `${Tag}-node`

  return NodeComponent
}

export const makeTagMark = Tag => {
  const MarkComponent = ({ children }: { children: any }) => (
    <Tag>{children}</Tag>
  )

  MarkComponent.displayName = `${Tag}-mark`

  return MarkComponent
}

const createNode = (type: string, el: any, next: any) => ({
  kind: 'block',
  type,
  // data: Data.create({ style: el.attribs.style }),
  nodes: next(el.childNodes)
})

class HeadingsPlugin extends Plugin {
  constructor(props: Props) {
    super(props)

    this.DEFAULT_NODE = props.DEFAULT_NODE
  }

  props: Props

  // eslint-disable-next-line react/display-name
  createButton = (type, icon) => ({ editorState, onChange }: Props) => {
    const onClick = e => {
      e.preventDefault()

      const isActive = editorState.blocks.some(block => block.type === type)
      onChange(
        editorState
          .transform()
          .setBlock(isActive ? this.DEFAULT_NODE : type)
          .apply()
      )
    }

    const isActive = editorState.blocks.some(block => block.type === type)

    return <ToolbarButton onClick={onClick} isActive={isActive} icon={icon} />
  }

  nodes = {
    [H1]: makeTagNode('h1'),
    [H2]: makeTagNode('h2'),
    [H3]: makeTagNode('h3'),
    [H4]: makeTagNode('h4'),
    [H5]: makeTagNode('h5'),
    [H6]: makeTagNode('h6'),
  }

  toolbarButtons = [
    this.createButton(H2, <H2Icon className="slate-h2-icon"/>),
    this.createButton(H3, <H2Icon className="slate-h3-icon"/>),
  ]

  deserialize = (el, next) => {
    switch (el.tagName.toLowerCase()) {
      case 'h1':
        return createNode(H1, el, next)
      case 'h2':
        return createNode(H2, el, next)
      case 'h3':
        return createNode(H3, el, next)
      case 'h4':
        return createNode(H4, el, next)
      case 'h5':
        return createNode(H5, el, next)
      case 'h6':
        return createNode(H6, el, next)
    }
  }

  serialize = (
    object: { type: string, kind: string, data: any },
    children: any[]
  ) => {
    if (object.kind !== 'block') {
      return
    }
    const style = { textAlign: object.data.get('align') }

    switch (object.type) {
      case H1:
        return <h1 style={style}>{children}</h1>
      case H2:
        return <h2 style={style}>{children}</h2>
      case H3:
        return <h3 style={style}>{children}</h3>
      case H4:
        return <h4 style={style}>{children}</h4>
      case H5:
        return <h5 style={style}>{children}</h5>
      case H6:
        return <h6 style={style}>{children}</h6>
    }
  }
}

HeadingsPlugin.name = 'headings'

export default HeadingsPlugin;
