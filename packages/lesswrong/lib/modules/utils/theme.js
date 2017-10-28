import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Users from 'meteor/vulcan:users';
import { Posts } from 'meteor/example-forum';

const getHeaderColor_Post = (postId, store) => {
  const post = Posts.findOneInStore(store, postId)
  if (post && (post.frontpage || post.meta)) {
    if (post.meta) {
      return "#e8cece"//this.renderHeaderSection_Meta()
    }
    return "#eee"
  } else if (post && post.userId) {
    const user = Users.findOneInStore(store, post.userId)
    if (user) {
      return "#D5DFE5" //<Link className="header-site-section user" to={ Users.getProfileUrl(user) }>{ user.displayName }</Link>
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
    "header":"#eee"
  }
  const routeName = router.name
  if (routeName == "users.single") {
    palette.header = "#D5DFE5"
    palette.accent1Color = "rgba(144,164,174,.5)"
    palette.accent2Color = "rgba(144,164,174,1)"
  } else if (routeName == "posts.single") {
    palette.header = getHeaderColor_Post(params._id, store)
  } else if (routeName == "Rationality.posts.single" || routeName == "Rationality") {
    palette.header = "#D5E5D8"
  } else if (routeName == "HPMOR.posts.single" || routeName == "HPMOR") {
    palette.header = "#d5d5e8"
    palette.accent1Color = "rgba(117,123,165,.5)"
    palette.accent2Color = "rgb(117,123,165)"

  } else if (routeName == "Codex.posts.single" || routeName == "Codex") {
    palette.header = "#ccdbe0"
    palette.accent1Color = "rgba(136, 172, 184,.5)"
    palette.accent2Color = "rgb(136, 172, 184)"

  } else if (routeName == "Meta") {
    palette.header = "#DBD3D3"
    palette.accent1Color = "rgba(163,152,152,.5)"
    palette.accent2Color = "rgba(163,152,152,1)"
  }
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
