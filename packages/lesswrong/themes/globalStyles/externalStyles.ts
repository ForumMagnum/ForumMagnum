
export const globalExternalStylesheets = [
  "https://use.typekit.net/jvr1gjm.css",
  "https://use.typekit.net/tqv5rhd.css"
];

export const globalFontFaces = [
  // Font fallback to ensure that all greek letters just directly render as Arial
  {
    fontFamily: "GreekFallback",
    src: "local('Arial')",
    unicodeRange: 'U+0370-03FF, U+1F00-1FFF' // Unicode range for greek characters
  },
  {
    fontFamily: "ETBookRoman",
    src: "url('https://res.cloudinary.com/lesswrong-2-0/raw/upload/v1723063815/et-book-roman-line-figures_tvofzs.woff') format('woff')",
  },
];
