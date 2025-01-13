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

const DEFAULT_EMOJIS = ['☀️', '🛠️', '💪', '🦟', '🐓', '🤖', '🦠', '💡', '📜']

const styles = defineStyles("ForumEventEmojiBar", (theme: ThemeType) => ({
  root: {
    display: "flex",
    fontSize: "24px",
    flex: 1,
    alignItems: "center",
    gap: "8px"
  },
  selectedEmojiContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    cursor: "pointer",
    userSelect: "none",
    border: '2px solid',
    borderColor: theme.palette.primary.light,
    borderRadius: theme.borderRadius.default,
    width: 40,
    height: 40,
  },
  selectedEmoji: {
    fontSize: "26px",
    padding: 4
  },
  addEmojiIcon: {
    color: theme.palette.grey[600]
  },
  defaultEmojisBar: {
    display: "flex",
    flexDirection: "row" as const,
    gap: "4px",
    marginBottom: 8,
  },
  defaultEmojiItem: {
    cursor: "pointer",
  },
  pickerWrapper: {
    position: "relative" as const,
  },
  pickerContainer: {
    position: "absolute" as const,
    zIndex: 1000,
    top: 8,
    left: 0,
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

/**
 * ForumEventEmojiBar
 * - Shows the currently selected emoji or a placeholder icon.
 * - Clicking toggles an <emoji-picker> overlay.
 * - Renders a row of default emojis for quick selection.
 */
const ForumEventEmojiBar: FC<ForumEventEmojiBarProps> = ({ onSelect, selected, onHover, hovered }) => {
  const classes = useStyles(styles)

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
    onSelect(emoji)
    setOpenPicker(false)
  }

  const handleEmojiPickerSelect = (event: any) => {
    const { emoji } = event.detail
    // The new version of emoji-picker-element uses .unicode
    if (emoji?.unicode) {
      onSelect(emoji.unicode)
      setOpenPicker(false)
    }
  }

  /**
   * Inject custom CSS into the <emoji-picker> shadow root.
   */
  const handlePickerRef = (elem: HTMLElement | null) => {
    if (elem) {
      // Inject custom styles
      const styleId = 'forum-emoji-picker-styles'
      const alreadyHasStyle = elem.shadowRoot?.getElementById(styleId)

      if (!alreadyHasStyle) {
        const styleEl = document.createElement('style')
        styleEl.id = styleId
        styleEl.textContent = pickerStyles
        elem.shadowRoot?.appendChild(styleEl)
      }

      // Add event listener
      elem.addEventListener('emoji-click', handleEmojiPickerSelect as EventListener)
    }
  }

  const { ForumIcon } = Components

  const showSelectedOrPlaceholder = selected ? (
    <span className={classes.selectedEmoji}>{selected}</span>
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

      <div className={classes.defaultEmojisBar}>
        {DEFAULT_EMOJIS.map((emoji) => (
          <span key={emoji} className={classes.defaultEmojiItem} onClick={() => handleEmojiClick(emoji)}>
            {emoji}
          </span>
        ))}
      </div>
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
