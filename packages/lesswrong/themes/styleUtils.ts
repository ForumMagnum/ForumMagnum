export const hideScrollBars = {
  '-ms-overflow-style': 'none',  /* Internet Explorer 10+ */
  'scrollbar-width': 'none',  /* Firefox */
  '&::-webkit-scrollbar': {
    display: 'none',  /* Safari and Chrome */
  },
}

export const beautifyScrollBars = {
  overflow: 'auto',
  '-ms-overflow-style': 'auto',  /* Internet Explorer 10+ */
  'scrollbar-width': 'thin',  /* Firefox */
  'scrollbar-color': 'light-dark(rgba(0, 0, 0, 0.5), rgba(255, 255, 255, 0.5)) transparent',
  'scrollbar-gutter': 'auto',
  '&::-webkit-scrollbar': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'light-dark(rgba(0, 0, 0, 0.5), rgba(255, 255, 255, 0.5))',
    borderRadius: '2px',
  },
}
