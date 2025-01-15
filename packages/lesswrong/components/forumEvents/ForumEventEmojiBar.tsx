import React, { FC, useEffect, useRef, useState } from 'react'
import { Components, registerComponent } from '@/lib/vulcan-lib'
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

/** Hack: Inlined styling for the emoji-picker shadow DOM */
const pickerStyles = `
  input.search {
    font-family: "Inter", sans-serif;
    border-radius: 4px;
    padding: 3px 5px;
    border-color: #ddd;
  }
  @media (prefers-color-scheme: dark) {
    input.search {
      border-color: #444;
    }
  }
`

const styles = defineStyles("ForumEventEmojiBar", (theme: ThemeType) => ({
  root: {
    display: "flex",
    fontSize: "24px",
    alignItems: "center",
  },
  selectedEmojiContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    userSelect: "none",
    border: `1px solid ${theme.palette.grey[400]}`,
    borderRadius: theme.borderRadius.default,
    width: 40,
    height: 40,
  },
  selectedEmoji: {
    fontSize: "26px",
    marginTop: 3
  },
  addEmojiIcon: {
    color: theme.palette.grey[500],
    marginLeft: 2
  },
  defaultEmojisBar: {
    display: "flex",
    flexDirection: "row",
    gap: "4px",
    marginBottom: 8,
  },
  defaultEmojiItem: {
    cursor: "pointer",
  },
  pickerWrapper: {
    position: "relative",
  },
  pickerContainer: {
    position: "absolute",
    zIndex: 1000,
    left: 4,
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: theme.borderRadius.default,
    overflow: "hidden",
  },
}));

interface ForumEventEmojiBarProps {
  selected?: string
  onSelect: (value: string) => void
  hovered?: string
  onHover?: (value: string) => void
}

// TODO rewrite desc
/**
 * ForumEventEmojiBar
 * - Shows the currently selected emoji or a placeholder icon.
 * - Clicking toggles an <emoji-picker> overlay.
 * - Renders a row of default emojis for quick selection.
 */
const ForumEventEmojiBar: FC<ForumEventEmojiBarProps> = ({ onSelect }) => {
  const classes = useStyles(styles)

  const [emoji, setEmoji] = useState<string | null>(null)
  const [openPicker, setOpenPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Lazy-load the Web Component (it causes an error if imported on the server)
    import('emoji-picker-element').catch(err => {
      // eslint-disable-next-line no-console
      console.error('Failed to load emoji-picker-element:', err)
    })

    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setOpenPicker(false)
      }
    }
    window.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleEmojiClick = (emoji: string) => {
    setEmoji(emoji)
    onSelect(emoji)
    setOpenPicker(false)
  }

  const handleEmojiPickerSelect = (event: any) => {
    const { emoji } = event.detail
    if (emoji?.unicode) {
      handleEmojiClick(emoji.unicode)
    }
  }

  /**
   * Inject custom CSS into the <emoji-picker> shadow root.
   */
  const handlePickerRef = (elem: HTMLElement | null) => {
    if (elem) {
      const styleId = 'forum-emoji-picker-styles'
      const alreadyHasStyle = elem.shadowRoot?.getElementById(styleId)

      if (!alreadyHasStyle) {
        const styleEl = document.createElement('style')
        styleEl.id = styleId
        styleEl.textContent = pickerStyles
        elem.shadowRoot?.appendChild(styleEl)
      }

      elem.addEventListener('emoji-click', handleEmojiPickerSelect as EventListener)
    }
  }

  const { ForumIcon } = Components

  const showSelectedOrPlaceholder = emoji ? (
    <span className={classes.selectedEmoji}>{emoji}</span>
  ) : (
    <ForumIcon icon="AddEmoji" className={classes.addEmojiIcon} />
  )

  return (
    <div className={classes.root}>
      <div className={classes.selectedEmojiContainer} onClick={() => setOpenPicker((prev) => !prev)}>
        {showSelectedOrPlaceholder}
      </div>
      {openPicker && (
        <div ref={pickerRef} className={classes.pickerWrapper}>
          <div className={classes.pickerContainer}>
            {/* @ts-ignore */}
            <emoji-picker ref={handlePickerRef} />
          </div>
        </div>
      )}
    </div>
  );
}

const ForumEventEmojiBarComponent = registerComponent('ForumEventEmojiBar', ForumEventEmojiBar)

declare global {
  interface ComponentTypes {
    ForumEventEmojiBar: typeof ForumEventEmojiBarComponent
  }
}

export default ForumEventEmojiBarComponent
