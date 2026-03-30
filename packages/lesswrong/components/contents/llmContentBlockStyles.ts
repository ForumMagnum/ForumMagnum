export const llmContentBlockStyles = (theme: ThemeType) => ({
  '& .llm-content-block': {
    margin: '1em 0',
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

    // Add an inline label to the beginning, filled in from the data-model-name
    // attribute, with a ::before selector
    '&::before': {
      content: 'attr(data-model-name)',
      display: 'inline-block',
      lineHeight: 1.3,
      fontSize: '0.85em',
      color: theme.palette.greyAlpha(0.6),
      paddingRight: 6,
      borderRight: `1px solid ${theme.palette.grey[400]}`,
      fontWeight: 600,
      fontVariant: 'small-caps',
      position: 'relative',
      top: 2
    },

    // If the first element is a paragraph, make the label float:left instead of inline,
    // since it's not inside the paragraph and therefore can't be inline.
    // FIXME: If font size differs (eg, when used in comments rather than posts), this
    // float can be two lines tall, when it should only be one.
    '&:has(> .llm-content-block-content > p:first-child)::before': {
      float: 'left',
      marginRight: 8,
      marginBottom: 0,
    },

    // If the first element is _not_ a paragraph, the label is inline.
    '&:not(:has(> .llm-content-block-content > p:first-child))::before': {
      float: 'none',
      display: 'block',
      width: 'fit-content',
      marginRight: 0,
      marginTop: '1em',
      marginBottom: '1em',
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

    // If the last element in llm-block-content is a paragraph, add an end-marker as a ::after
    // inline element at the end of that paragraph
    '&:has(> .llm-content-block-content > p:last-child) > .llm-content-block-content > p:last-child::after': {
      content: '"⊙"',
      color: theme.palette.greyAlpha(0.55),
      fontSize: '0.85em',
      paddingLeft: 3,
      marginLeft: 9,
      borderLeft: `1px solid ${theme.palette.grey[400]}`,
      fontWeight: 300,
      letterSpacing: 2.1,
      opacity: 0.6,
    },

    // If the last element in llm-block-content is a paragraph, and that paragraph is empty,
    // select that empty paragraph
    '& > .llm-content-block-content > p:last-child:has(> br:only-child)': {
      display: 'inline-block',
      margin: 0,
      minWidth: '0.6em',

      '& > br:only-child': {
        display: 'none',
      },
      '&::after': {
        content: '"⊙"',
        display: 'inline-block',
        color: theme.palette.greyAlpha(0.55),
        fontSize: '0.85em',
        lineHeight: 'inherit',
        paddingLeft: 3,
        marginLeft: 0,
        borderLeft: `1px solid ${theme.palette.grey[400]}`,
        fontWeight: 300,
        letterSpacing: 2.1,
        opacity: 0.6,
      },
    },

    // If the last element in llm-block-content is not a paragraph, add an end-marker as a
    // ::after block element
    '&:not(:has(> .llm-content-block-content > p:last-child)) > .llm-content-block-content::after': {
      content: '"⊙"',
      display: 'block',
      width: 'fit-content',
      color: theme.palette.greyAlpha(0.55),
      fontSize: '0.85em',
      lineHeight: 1.3,
      marginTop: '1em',
      marginBottom: '1em',
      paddingLeft: 3,
      borderLeft: `1px solid ${theme.palette.grey[400]}`,
      fontWeight: 300,
      letterSpacing: 2.1,
      opacity: 0.6,
    },
  },
});

export const llmContentBlockEditorStyles = (theme: ThemeType) => ({
  "& .llm-content-block": {
    margin: 0,
  },

  // The llm-content-block-header classname only appears in the editor version (it gets a <div> and an <input>
  //  because it's editable; whereas in the non-editor representation, it's reduced to a data-model-name attribute.
  '& .llm-content-block-header': {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.85em',
    color: theme.palette.grey[600],
    lineHeight: 1.3,
    paddingRight: 6,
    borderRight: `1px solid ${theme.palette.grey[400]}`,
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
    fontVariant: 'small-caps',
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