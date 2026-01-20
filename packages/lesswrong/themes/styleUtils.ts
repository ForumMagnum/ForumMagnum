export const hideScrollBars = {
  '-ms-overflow-style': 'none',  /* Internet Explorer 10+ */
  'scrollbar-width': 'none',  /* Firefox */
  '&::-webkit-scrollbar': {
    display: 'none',  /* Safari and Chrome */
  },
}

export const prettyScrollbars = (theme: ThemeType) => ({
  overflow: 'auto',
  '-ms-overflow-style': 'auto',  /* Internet Explorer 10+ */
  'scrollbar-width': 'thin',  /* Firefox */
  'scrollbar-color': theme.palette.greyAlpha(0.5),
  'scrollbar-gutter': 'auto',
  '&::-webkit-scrollbar': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.greyAlpha(0.5),
    borderRadius: '2px',
  },
})
