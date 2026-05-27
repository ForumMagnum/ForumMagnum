
const endMarkerStyles = (theme: ThemeType) => ({
  content: '"⊙"',
  color: theme.palette.greyAlpha(0.55),
  fontSize: '0.85em',
  paddingLeft: 3,
  borderLeft: `1px solid ${theme.palette.grey[400]}`,
  fontWeight: 300,
  letterSpacing: 2.1,
  opacity: 0.6,
})

export const llmContentBlockStyles = (theme: ThemeType) => ({
  '& .llm-content-block': {
    //margin: '1em 0',
    position: 'relative',
    fontFamily: '"cronos-pro", serif',
    fontSize: 19.1,
    fontWeight: 400,
    opacity: 0.94,
    '& h1, & h2, & h3, & h4, & h5, & h6': {
      fontFamily: 'inherit',
    },
    // Prevent baseBodyStyles selectors (which spread postStyle/body1/commentStyle)
    // from overriding the LLM block's font on these elements. Without this,
    // list items and blockquotes get the post/comment font instead of cronos-pro.
    '& li, & blockquote': {
      fontFamily: 'inherit',
    },

    '& > .llm-content-block-content': {
      outline: 'none',
      '& > :first-child': {
        marginTop: 0,
      },
      '& > :last-child': {
        marginBottom: 0,
      },
    },

    // If the last element in llm-block-content is a paragraph,
    "& > .llm-content-block-content > p:last-child": {
      // Add an end-marker as a ::after inline element at the end of that paragraph
      "&::after": {
        ...endMarkerStyles(theme),
        marginLeft: 9,
      },

      // If that paragraph is empty (contains only a <br>), hide the <br> and override some end-marker styles
      '&:has(> br:only-child)': {
        display: 'inline-block',
        margin: 0,
        minWidth: '0.6em',

        '& > br:only-child': {
          display: 'none',
        },
        '&::after': {
          display: 'inline-block',
          lineHeight: 'inherit',
          marginLeft: 0,
        },
      },
    },

    // If the last element in llm-block-content is not a paragraph, add an end-marker as a
    // ::after block element
    '&:not(:has(> .llm-content-block-content > p:last-child)) > .llm-content-block-content::after': {
      ...endMarkerStyles(theme),
      display: 'block',
      width: 'fit-content',
      lineHeight: 1.3,
      marginTop: '1em',
      marginBottom: '1em',
    },
  },

  // The llm-content-block-header classname only appears in the editor version (it gets a <div> and an <input>
  //  because it's editable; whereas in the non-editor representation, it's reduced to a data-model-name attribute.
  '& .llm-content-block-header': {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.85em',
    lineHeight: 1.3,
    paddingRight: 6,
    borderRight: `1px solid ${theme.palette.grey[400]}`,

    color: theme.palette.greyAlpha(0.6),
    fontWeight: 600,
    fontVariant: 'small-caps',
    position: 'relative',

    top: 2,
  },

  // If the first element is a paragraph, make it float
  '& .llm-content-block:has(> .llm-content-block-content > p:first-child) .llm-content-block-header': {
    float: 'left',
    marginRight: 8,
    marginBottom: 0,
  },
  '& .llm-content-block:not(:has(> .llm-content-block-content > p:first-child)) .llm-content-block-header': {
    float: 'none',
    marginRight: 0,
    display: 'block',
    width: 'fit-content',
    marginTop: '1em',
    marginBottom: '1em',
  },
  '& .llm-content-block-model-input': {
    backgroundColor: 'transparent',
    color: 'inherit',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    fontWeight: 600,
    fontVariant: 'inherit',
    lineHeight: 'inherit',
    padding: 0,
    border: 'none',
    borderRadius: 0,
    appearance: 'none',
    WebkitAppearance: 'none',
    minWidth: 40,
    '&::-webkit-calendar-picker-indicator': {
      display: 'none !important',
    },
    '&::placeholder': {
      color: theme.palette.grey[600],
      opacity: 1,
    },
    '&:hover': {
      color: theme.palette.grey[800],
    },
    '&:focus': {
      color: theme.palette.grey[800],
      outline: 'none',
    },
  },
});

export const llmContentBlockEditorStyles = (theme: ThemeType) => ({
  "& .llm-content-block-header": {
    paddingRight: "0px !important",
  },
});

// Disable LLM content-block font-size override in comments
// Imported and used in stylePiping. The enlarged font size is too mismatched
// with comment-font size, and also interacted with styling of the float:left
// indicator to make it two lines tall.)
export const noLlmContentBlockFontSizeOverride = (theme: ThemeType) => ({
  "& .llm-content-block": {
    fontSize: 'inherit',
  },
});
