import type { LexicalEditor, TextNode } from 'lexical'
import { COMMAND_PRIORITY_LOW, SELECTION_CHANGE_COMMAND, $getSelection, $isRangeSelection } from 'lexical'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { LinkNode } from '@lexical/link'
import { getDOMRangeRect } from '../utils/getDOMRangeRect'
import { createPortal } from 'react-dom'
import Button from '@/lib/vendor/@material-ui/core/src/Button'
import Input from '@/lib/vendor/@material-ui/core/src/Input'
import ForumIcon from '@/components/common/ForumIcon'
import { mergeRegister } from '@lexical/utils'
import { LINK_CHANGE_COMMAND } from './LinkPlugin'

export function LinkInfoEditor({
  editor,
  setIsEditingLink,
  linkNode,
  linkTextNode,
}: {
  editor: LexicalEditor
  setIsEditingLink: (isEditMode: boolean) => void
  linkNode: LinkNode | null
  linkTextNode: TextNode | null
}) {
  const [position, setPosition] = useState<{
    top: number
    left: number
  } | null>(null)

  const [shouldShowLinkTextInput, setShouldShowLinkTextInput] = useState(() => linkTextNode !== null || !linkNode)

  const [url, setURL] = useState('')
  const [text, setText] = useState('')
  useEffect(() => {
    editor.getEditorState().read(() => {
      if (linkNode) {
        setURL(linkNode.getURL())
      }
      if (linkTextNode) {
        setText(linkTextNode.getTextContent())
      }
      if (!linkNode && !linkTextNode) {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) {
          return
        }
        if (!selection.isCollapsed()) {
          setShouldShowLinkTextInput(false)
          return
        }
      }
    })
  }, [editor, linkNode, linkTextNode])

  const handleSubmission = useCallback(() => {
    editor.dispatchCommand(LINK_CHANGE_COMMAND, {
      linkNode,
      linkTextNode,
      url,
      text,
    })
    setIsEditingLink(false)
  }, [editor, linkNode, linkTextNode, setIsEditingLink, text, url])

  const linkNodeDOM = useMemo(() => {
    if (!linkNode) {
      return null
    }
    return editor.getElementByKey(linkNode.getKey())
  }, [editor, linkNode])

  const updatePosition = useCallback(() => {
    const rootElement = editor.getRootElement()
    const rootParent = rootElement?.parentElement

    if (!rootElement || !rootParent) {
      return
    }

    if (linkNodeDOM) {
      const linkNodeRect = linkNodeDOM.getBoundingClientRect()

      setPosition({
        top: linkNodeRect.bottom + rootParent.scrollTop - rootParent.getBoundingClientRect().top + 10,
        left: linkNodeRect.left,
      })
    } else {
      const nativeSelection = window.getSelection()
      const rootElement = editor.getRootElement()

      if (nativeSelection !== null && rootElement !== null && rootElement.contains(nativeSelection.anchorNode)) {
        const rangeRect = getDOMRangeRect(nativeSelection, rootElement)

        setPosition({
          top: rangeRect.bottom + rootParent.scrollTop - rootParent.getBoundingClientRect().top + 10,
          left: rangeRect.left,
        })
      }
    }
  }, [editor, linkNodeDOM])

  useEffect(() => {
    updatePosition()

    return mergeRegister(
      editor.registerUpdateListener(() => {
        updatePosition()
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload) => {
          updatePosition()
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, updatePosition])

  const containerElement = editor.getRootElement()?.parentElement

  const focusInputOnMount = useCallback((input: HTMLInputElement | null) => {
    if (input) {
      input.focus()
    }
  }, [])

  const cancelLinkEdit = useCallback(() => {
    setIsEditingLink(false)
    editor.focus()
  }, [editor, setIsEditingLink])

  if (!position) {
    return null
  }

  return createPortal(
    <div
      className="bg-norm shadow-norm border-weak absolute left-0 top-0 rounded border px-3 py-1.5 text-sm print:hidden"
      style={{
        top: position.top,
        left: position.left,
      }}
      data-testid="hyperlink-form"
    >
      <form
        className="flex flex-col gap-2 py-1"
        onSubmit={(event) => {
          event.preventDefault()
          handleSubmission()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            cancelLinkEdit()
          }
        }}
      >
        {shouldShowLinkTextInput && (
          <div className="flex items-center gap-3">
            <ForumIcon icon="InfoCircle" className="flex-shrink-0" />
            <Input
              aria-label="Link text"
              placeholder="Text"
              value={text}
              onChange={(event) => {
                setText(event.target.value)
              }}
            />
          </div>
        )}
        <div className="flex items-center gap-3">
          <ForumIcon icon="Link" className="flex-shrink-0" />
          <Input
            value={url}
            aria-label="Link URL"
            placeholder="Paste link"
            onChange={(event) => {
              setURL(event.target.value)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleSubmission()
              }
            }}
            ref={focusInputOnMount}
          />
        </div>
        <div className="flex items-center justify-end gap-1.5">
          <Button shape="ghost" onClick={cancelLinkEdit}>Cancel</Button>
          <Button onClick={handleSubmission}>Apply</Button>
        </div>
      </form>
    </div>,
    containerElement ?? document.body,
  )
}
