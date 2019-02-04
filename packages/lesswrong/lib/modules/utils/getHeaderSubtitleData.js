import { getSetting } from 'meteor/vulcan:core';
import { Posts } from '../../collections/posts';
import Sequences from '../../collections/sequences/collection';
import Users from 'meteor/vulcan:users';

export default function getHeaderSubtitleData(routeName, query, params, client) {
  if (routeName == "users.single") {
    return profileSubtitle(params.slug, client)
  } else if (routeName == "posts.single") {
    return userPostSubtitle(params._id)
  } else if (routeName == "sequences.single") {
    return sequenceSubtitle(params._id)
  } else if (routeName == "Rationality.posts.single" || routeName == "Rationality") {
    return rationalitySubtitle()
  } else if (routeName == "HPMOR.posts.single" || routeName == "HPMOR") {
    return hpmorSubtitle()
  } else if (routeName == "Codex.posts.single" || routeName == "Codex") {
    return codexSubtitle()
  } else if (routeName == "Meta") {
    return metaSubtitle()
  } else if (routeName == "CommunityHome") {
    return communitySubtitle()
  } else if (routeName == "Localgroups.single") {
    return communitySubtitle()
  } else if (routeName == "events.single") {
    return communitySubtitle()
  } else if (routeName == "groups.post") {
    return communitySubtitle()
  } else if ((!getSetting('AlignmentForum', false) && routeName == "alignment.forum") || (query && query.af)) {
    return alignmentSubtitle()
  }
}

const profileSubtitle = (userSlug, client) => {
  const user = client && Users.findInStore(client.store, {slug:userSlug}).fetch()[0]
  if (user && (user.displayName || user.slug)) {
    return {
      subtitleLink: Users.getProfileUrl(user),
      subtitleText: user.displayName || user.slug
    }
  }
}

const userPostSubtitle = (postId, client) => {
  const post = client && Posts.findOneInStore(client.store, postId)
  if (!getSetting('AlignmentForum', false) && post && post.af) {
    return alignmentSubtitle()
  } else if (post && post.frontpageDate) {
    return null
  } else if (post && post.meta) {
    return metaSubtitle()
  } else if (post && post.userId) {
    const user = Users.findOneInStore(client.store, post.userId)
    if (user) {
      return {
        subtitleLink: Users.getProfileUrl(user),
        subtitleText: user.displayName || user.slug
      }
    } else {
      return null
    }
  }
}

const rationalitySubtitle = () => {
  return {
    subtitleLink: "/rationality",
    subtitleText: "Rationality: A-Z"
  }
}

const hpmorSubtitle = () => {
  return {
    subtitleLink: "/hpmor",
    subtitleText: "HPMoR"
  }
}

const codexSubtitle = () => {
  return {
    subtitleLink: "/codex",
    subtitleText: "SlateStarCodex"
  }
}

const metaSubtitle = () => {
  return {
    subtitleLink: "/meta",
    subtitleText: "Meta"
  }
}

const sequenceSubtitle = (sequenceId, client) => {
  if (client && client.store && sequenceId) {
    const sequence = Sequences.findOneInStore(client.store, sequenceId)
    if (sequence && sequence.canonicalCollectionSlug == "rationality") {
      return rationalitySubtitle()
    } else if (sequence && sequence.canonicalCollectionSlug == "hpmor") {
      return hpmorSubtitle()
    } else if (sequence && sequence.canonicalCollectionSlug == "codex") {
      return codexSubtitle()
    }
  }
}

const communitySubtitle = () => {
  return {
    subtitleLink: "/community",
    subtitleText: "Community"
  }
}

const alignmentSubtitle = () => {
  return {
    subtitleLink: "/alignment",
    subtitleText: "AGI Alignment"
  }
}
