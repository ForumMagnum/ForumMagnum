import getMuiTheme from 'material-ui/styles/getMuiTheme';

export const customizeTheme = (routeName, userAgent) => {
  const palette = {
    "primary1Color": "#f5f5f5",
    "accent1Color": "#43a047",
    "primary2Color": "#eeeeee",
    "accent2Color": "#81c784",
    "accent3Color": "#c8e6c9",
    "pickerHeaderColor": "#4caf50"
  }
  // }
  // if (routeName == "users.single") {
  //   palette.accent1Color =
  //   palette.accent2Color =
  //   palette.accent3Color =
  //   palette.pickerHeaderColor =
  // } else if (routeName == "posts.single") {
  //   palette.accent1Color =
  //   palette.accent2Color =
  //   palette.accent3Color =
  //   palette.pickerHeaderColor =
  // } else if (routeName == "Rationality.posts.single" || routeName == "Rationality") {
  //   palette.accent1Color =
  //   palette.accent2Color =
  //   palette.accent3Color =
  //   palette.pickerHeaderColor =
  // } else if (routeName == "HPMOR.posts.single" || routeName == "HPMOR") {
  //   palette.accent1Color =
  //   palette.accent2Color =
  //   palette.accent3Color =
  //   palette.pickerHeaderColor =
  // } else if (routeName == "Codex.posts.single" || routeName == "Codex") {
  //   palette.accent1Color =
  //   palette.accent2Color =
  //   palette.accent3Color =
  //   palette.pickerHeaderColor =
  // } else if (routeName == "Meta") {
  //   palette.accent1Color =
  //   palette.accent2Color =
  //   palette.accent3Color =
  //   palette.pickerHeaderColor =
  // }
  const muiTheme = getMuiTheme({
    "fontFamily": "et-book",
    "palette": palette,
    "appBar": {
      "textColor": "rgba(0, 0, 0, 0.54)"
    },
    "datePicker": {
      "color": "rgba(0,0,0,0.54)",
      "selectTextColor": "rgba(0,0,0,0.54)",
    },
    "flatButton": {
      "primaryTextColor": "rgba(0,0,0,0.54)"
    },
    userAgent: userAgent,
  });
  return muiTheme
}
