import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Users from 'meteor/vulcan:users';
import { Posts } from 'meteor/example-forum';

const getHeaderColor_Post = (postId, store) => {
  const post = Posts.findOneInStore(store, postId)
  if (post && (post.frontpage || post.meta)) {
    if (post.meta) {
      return "#E6F2F1"//this.renderHeaderSection_Meta()
    }
    return "#fcfcfc"
  } else if (post && post.userId) {
    const user = Users.findOneInStore(store, post.userId)
    if (user) {
      return "#F0F4F7" //<Link className="header-site-section user" to={ Users.getProfileUrl(user) }>{ user.displayName }</Link>
    }
  }
}

export const customizeTheme = (router, userAgent, params, store) => {
  const palette = {
    "primary1Color": "#f5f5f5",
    "primary2Color": "#eeeeee",
    "accent1Color": "rgba(100, 169, 105, 0.5)",
    "accent2Color": "rgba(100, 169, 105, 1)",
    "accent3Color": "#c8e6c9",
    "pickerHeaderColor": "#4caf50",
    "header":"#fcfcfc"
  }
  const routeName = router.name
  if (routeName == "users.single") {
    palette.header = "#F0F4F7"
    palette.accent1Color = "rgba(130,195,246,.5)"
    palette.accent2Color = "rgba(130,195,246,1)"
  } else if (routeName == "posts.single") {
    palette.header = getHeaderColor_Post(params._id, store)
  } else if (routeName == "Rationality.posts.single" || routeName == "Rationality") {
    palette.header = "#F0F7F1"
  } else if (routeName == "HPMOR.posts.single" || routeName == "HPMOR") {
    palette.header = "#d5d5e8"
    palette.accent1Color = "rgba(117,123,165,.5)"
    palette.accent2Color = "rgb(117,123,165)"

  } else if (routeName == "Codex.posts.single" || routeName == "Codex") {
    palette.header = "#EBF0F2"
    palette.accent1Color = "rgba(136, 172, 184,.5)"
    palette.accent2Color = "rgb(136, 172, 184)"

  } else if (routeName == "Meta") {
    palette.header = "#E6F2F1"
    palette.accent1Color = "rgba(105,201,192,.5)"
    palette.accent2Color = "rgba(105,201,192,1)"
  }
  const muiTheme = getMuiTheme({
    "fontFamily": "warnock-pro",
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
