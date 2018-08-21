import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Users from 'meteor/vulcan:users';
import { Posts } from 'meteor/example-forum';
import Sequences from '../../collections/sequences/collection'
import { getSetting } from 'meteor/vulcan:core';

const getHeaderColorPost = (postId, store) => {
  const post = Posts.findOneInStore(store, postId)
  if (post && (post.frontpageDate || post.meta)) {
    if (post.meta) {
      return "#E6F2F1"//this.renderHeaderSection_Meta()
    }
    return "#fcfcfc"
  } else if (post && post.userId) {
    const user = Users.findOneInStore(store, post.userId)
    if (user) {
      return "#F4F4F4" //<Link className="header-site-section user" to={ Users.getProfileUrl(user) }>{ user.displayName }</Link>
    }
  }
}

const getHeaderColorSequence = (sequenceId, store) => {
  if (store && sequenceId) {
    const sequence = Sequences.findOneInStore(store, sequenceId)
    if (sequence && sequence.canonicalCollectionSlug == "rationality") {
      return "#F0F7F1"
    } else if (sequence && sequence.canonicalCollectionSlug == "hpmor") {
      return "#E8E8FA"
    } else if (sequence && sequence.canonicalCollectionSlug == "codex") {
      return "#EBF0F2"
    }
  }
}


export const customizeTheme = (router, userAgent, params, store) => {
  let routeName = router.name;
  let muiThemeDefault = {}
  if (getSetting('AlignmentForum', false)) {
    muiThemeDefault = {
      "palette": {
        "primary1Color": "#f5f5f5",
        "primary2Color": "#eeeeee",
        // TODO this is a bit hacky still
        "accent1Color": "#0C869B",
        "accent2Color": "#1B5266",
        "accent3Color": "#0C869B",
        "pickerHeaderColor": "#00B2BE",
      },
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
      "checkbox": {
        "checkedColor": "#0C869B",
        "labelColor": "rgba(0,0,0,0.6)",
        "boxColor": "rgba(0,0,0,0.6)"
      },
      userAgent: userAgent,
    }
  } else {
    muiThemeDefault = {
      "palette": {
        "primary1Color": "#f5f5f5",
        "primary2Color": "#eeeeee",
        "accent1Color": "#0C869B",
        "accent2Color": "#1B5266",
        "accent3Color": "#0C869B",
        "pickerHeaderColor": "#00B2BE",
      },
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
      "checkbox": {
        "checkedColor": "#0C869B",
        "labelColor": "rgba(0,0,0,0.6)",
        "boxColor": "rgba(0,0,0,0.6)"
      },
      userAgent: userAgent,
    }
  }
  let muiTheme = getMuiTheme(muiThemeDefault);
  muiTheme.palette.header = "#FCFCFC"

  if (routeName == "users.single") {
    muiTheme.palette.header = "#F4F4F4"
    muiTheme.palette.accent1Color = "rgba(130,195,246,.5)"
    muiTheme.palette.accent2Color = "rgba(130,195,246,1)"
  } else if (routeName == "posts.single") {
    muiTheme.palette.header = getHeaderColorPost(params._id, store)
  } else if (routeName == "sequences.single") {
    muiTheme.palette.header = getHeaderColorSequence(params._id, store)
  } else if (routeName == "Rationality.posts.single" || routeName == "Rationality") {
    muiTheme.palette.header = "#F0F7F1"
  } else if (routeName == "HPMOR.posts.single" || routeName == "HPMOR") {
    muiTheme.palette.header = "#E8E8FA"
    muiTheme.palette.accent1Color = "rgba(117,123,165,.5)"
    muiTheme.palette.accent2Color = "rgb(117,123,165)"

  } else if (routeName == "Codex.posts.single" || routeName == "Codex") {
    muiTheme.palette.header = "#EBF0F2"
    muiTheme.palette.accent1Color = "rgba(136, 172, 184,.5)"
    muiTheme.palette.accent2Color = "rgb(136, 172, 184)"

  } else if (routeName == "Meta") {
    muiTheme.palette.header = "#E6F0F0"
    muiTheme.palette.accent1Color = "rgba(105,201,192,.5)"
    muiTheme.palette.accent2Color = "rgba(105,201,192,1)"
  }
  return muiTheme
}
