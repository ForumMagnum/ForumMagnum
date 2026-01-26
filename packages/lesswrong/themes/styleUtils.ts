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
  'scrollbar-color': `${theme.palette.greyAlpha(0.5)} transparent`,
  'scrollbar-gutter': 'auto',
  '&::-webkit-scrollbar': {
    background: 'transparent',
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: `${theme.palette.greyAlpha(0.5)}`,
    border: '1px solid transparent',
    backgroundClip: 'padding-box',
    borderRadius: '5px',
  },
})
