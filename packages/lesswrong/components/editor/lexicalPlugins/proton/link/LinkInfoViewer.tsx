import type { LinkNode } from '@lexical/link'
import { $isAutoLinkNode } from '@lexical/link'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { mergeRegister } from '@lexical/utils'
import Button from '@/lib/vendor/@material-ui/core/src/Button'
import LWTooltip from '@/components/common/LWTooltip'
import ForumIcon from '@/components/common/ForumIcon'
import type { LexicalEditor } from 'lexical'
import { COMMAND_PRIORITY_EDITOR, COMMAND_PRIORITY_LOW, SELECTION_CHANGE_COMMAND } from 'lexical'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { captureException } from '@/lib/sentryWrapper'
import { getDOMRangeRect } from '../utils/getDOMRangeRect'
import { sanitizeUrl } from '../utils/sanitizeUrl'
import { KEYBOARD_SHORTCUT_COMMAND } from '../KeyboardShortcuts/Command'
import { LINK_CHANGE_COMMAND } from './LinkPlugin'
import classNames from 'classnames'

type Props = {
  linkNode: LinkNode
  editor: LexicalEditor
  setIsEditingLink: (isEditingLink: boolean) => void
  openLink: (url: string) => void
}

export function LinkInfoViewer({ editor, linkNode, setIsEditingLink, openLink }: Props) {
  const isEditorEditable = useLexicalEditable()

  const [position, setPosition] = useState<{
    top: number
    left: number
  }>()

  const [linkUrl, isAutoLink] = useMemo(() => {
    let linkUrl = ''
    let isAutoLink = false
    editor.getEditorState().read(() => {
      const sanitizedURL = sanitizeUrl(linkNode.getURL())
      linkUrl = sanitizedURL.isFailed() ? '' : sanitizedURL.getValue()
      isAutoLink = $isAutoLinkNode(linkNode)
    })
    return [linkUrl, isAutoLink]
  }, [editor, linkNode])

  const linkNodeDOM = useMemo(() => {
    return editor.getElementByKey(linkNode.getKey())
  }, [editor, linkNode])

  const rangeRect = useRef<DOMRect>(null)
  const updatePosition = useCallback(() => {
    const nativeSelection = window.getSelection()
    const rootElement = editor.getRootElement()
    const rootParent = rootElement?.parentElement

    if (nativeSelection !== null && rootElement !== null) {
      if (rootElement.contains(nativeSelection.anchorNode)) {
        rangeRect.current = getDOMRangeRect(nativeSelection, rootElement)
      }
    }

    if (!rootElement || !rootParent || !linkNodeDOM) {
      return
    }

    const linkNodeRect = linkNodeDOM.getBoundingClientRect()

    setPosition({
      top: linkNodeRect.bottom + rootParent.scrollTop - rootParent.getBoundingClientRect().top + 10,
      left: linkNodeRect.left,
    })
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
      editor.registerCommand(
        KEYBOARD_SHORTCUT_COMMAND,
        ({ shortcut }) => {
          if (shortcut !== 'OPEN_LINK_SHORTCUT') {
            return false
          }

          openLink(linkUrl)
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [editor, linkUrl, openLink, updatePosition])

  const containerElement = editor.getRootElement()?.parentElement

  if (!position || !linkUrl) {
    return null
  }

  return createPortal(
    <div
      className="bg-norm shadow-norm border-weak absolute left-0 top-0 rounded border px-2.5 py-1.5 print:hidden"
      style={{
        top: position.top,
        left: position.left,
      }}
      data-testid="hyperlink-form"
    >
      <div className="flex items-center gap-1.5">
        <a
          className={classNames(
            'mr-1 flex flex-grow items-center gap-2 overflow-hidden whitespace-nowrap text-sm underline',
            isAutoLink && 'py-2.5',
          )}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => {
            event.preventDefault()
            openLink(linkUrl)
          }}
          data-testid="hyperlink-link"
        >
          <ForumIcon icon="OpenInNew" className="ml-1 flex-shrink-0" />
          <div className="max-w-[35ch] overflow-hidden text-ellipsis">{linkUrl}</div>
        </a>
        <LWTooltip title="Copy link">
          <Button
            icon
            size="small"
            shape="ghost"
            onClick={() => {
              navigator.clipboard.writeText(linkUrl).catch(captureException)
            }}
            data-testid="hyperlink-copy-link-button"
          >
            <ForumIcon icon="Link" />
          </Button>
        </LWTooltip>
        {!isAutoLink && isEditorEditable && (
          <>
            <LWTooltip title="Edit link">
              <Button
                icon
                size="small"
                shape="ghost"
                onClick={() => {
                  setIsEditingLink(true)
                }}
                data-testid="hyperlink-edit-button"
              >
                <ForumIcon icon="Edit" />
              </Button>
            </LWTooltip>
            <LWTooltip title="Remove link">
              <Button
                icon
                size="small"
                shape="ghost"
                onClick={() => {
                  editor.dispatchCommand(LINK_CHANGE_COMMAND, {
                    linkNode: null,
                    linkTextNode: null,
                    url: null,
                    text: null,
                  })
                }}
                data-testid="hyperlink-delete-button"
              >
                <ForumIcon icon="Delete" />
              </Button>
            </LWTooltip>
          </>
        )}
      </div>
    </div>,
    containerElement || document.body,
  )
}
