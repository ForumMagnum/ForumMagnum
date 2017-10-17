/* eslint-disable prefer-reflect, default-case, react/display-name */
import React from 'react'
import H2Icon from 'material-ui/svg-icons/editor/title'
// import { Data } from 'slate'
import Plugin from './plugin'

export const H2 = 'HEADINGS/HEADING-TWO'
export const H3 = 'HEADINGS/HEADING-THREE'
import { ToolbarButton } from './ToolbarButton'

import {white, red500, greenA200} from 'material-ui/styles/colors';

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

export default class HeadingsPlugin extends Plugin {
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

  name = 'headings'

  nodes = {
    [H2]: makeTagNode('h2'),
    [H3]: makeTagNode('h3'),
  }

  toolbarButtons = [
    this.createButton(H2, <H2Icon className="slate-h2-icon"/>),
    this.createButton(H3, <H2Icon className="slate-h3-icon"/>),
  ]

  deserialize = (el, next) => {
    switch (el.tagName.toLowerCase()) {
      case 'h2':
        return createNode(H2, el, next)
      case 'h3':
        return createNode(H3, el, next)
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
      case H2:
        return <h2 style={style}>{children}</h2>
      case H3:
        return <h3 style={style}>{children}</h3>
    }
  }
}
