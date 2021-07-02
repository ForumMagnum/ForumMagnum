import React from 'react';

import { compassIcon } from '../../icons/compassIcon';
import { questionsGlobeIcon } from '../../icons/questionsGlobeIcon';
import { conceptsIcon } from '../../icons/conceptsIcon';
import { communityGlobeIcon } from '../../icons/communityGlobeIcon';
import { BookIcon } from '../../icons/bookIcon'
import { allPostsIcon } from '../../icons/allPostsIcon';


import Home from '@material-ui/icons/Home'
import LocalOffer from '@material-ui/icons/LocalOffer';
import Sort from '@material-ui/icons/Sort'
import Info from '@material-ui/icons/Info';
import LocalLibrary from '@material-ui/icons/LocalLibrary';
import SupervisedUserCircleIcon from '@material-ui/icons/SupervisedUserCircle';
import type { ForumTypeString } from '../../../lib/instanceSettings';

// The sidebar / bottom bar of the Forum contain 10 or so similar tabs, unique to each Forum. The
// tabs can appear in
//   1. The always-on sidebar of the homepage (allPosts, etc, [see Layout.jsx]) (Standalone Sidbar)
//   2. The always-on bottom bar of the homepage (etc) on mobile (Standalone FooterMenu)
//   3. The swipeable drawer of any other page (hidden by default) (Drawer Menu)
//   4. The same as 3, but collapsed to make room for table of contents on mobile (Drawer Collapsed
//      Menu)
//
// Tab objects support the following properties
//   id: string, required, unique; for React map keys. `divider` is a keyword id
//   title: string; user facing description
//   link: string
//   // One of the following 3
//   icon: already-rendered-Component
//   iconComponent: Component-ready-for-rendering
//   compressedIconComponent: Component-ready-for-rendering; only displayed in compressed mode (4)
//   tooltip: string|Component; passed into Tooltip `title`; optionaly -- without it the Tooltip
//            call is a no-op
//   showOnMobileStandalone: boolean; show in (2) Standalone Footer Menu
//   showOnCompressed: boolean; show in (4) Drawer Collapsed Menu
//   subitem: boolean; display title in smaller text
//   customComponentName: string; instead of a TabNavigationItem, display this component
//
// See TabNavigation[Footer|Compressed]?Item.jsx for how these are used by the code
type MenuTab = any;
export const menuTabs: Record<ForumTypeString,Array<MenuTab>> = {
  LessWrong: [
    {
      id: 'home',
      title: 'Home',
      link: '/',
      icon: compassIcon,
      tooltip: 'Latest posts, comments and curated content.',
      showOnMobileStandalone: true,
      showOnCompressed: true,
    }, {
      id: 'concepts',
      title: 'Concepts',
      mobileTitle: 'Concepts',
      link: '/tags/all',
      icon: conceptsIcon,
      tooltip: <div>
        Get an overview over all the concepts used on LessWrong
      </div>,
      showOnMobileStandalone: true,
      showOnCompressed: true,
    }, {
      id: 'library',
      title: 'Library',
      link: '/library',
      iconComponent: BookIcon,
      tooltip: "Curated collections of LessWrong's best writing.",
      showOnMobileStandalone: true,
      showOnCompressed: true,
    // next 3 are subItems
    }, {
      id: 'r-az',
      title: 'Rationality: A-Z',
      link: '/rationality',
      tooltip: <div>
        <p>
          LessWrong was founded by Eliezer Yudkowsky. For two years he wrote a blogpost a day about topics including rationality, science, ambition and artificial intelligence.
        </p>
        <p>
          Those posts have been edited down into this introductory collection, recommended for new users.
        </p>
      </div>,
      subItem: true,
    }, {
      id: 'codex',
      title: 'The Codex',
      link: '/codex',
      tooltip: 'The Codex is a collection of essays written by Scott Alexander that discuss how good reasoning works, how to learn from the institution of science, and different ways society has been and could be designed.',
      subItem: true,
    }, {
      id: 'hpmor',
      title: 'HPMOR',
      link: '/hpmor',
      tooltip: 'What if Harry Potter was a scientist? What would you do if the universe had magic in it? A story that illustrates many rationality concepts.',
      subItem: true,
    }, {
      id: 'events',
      title: 'Community Events', // Events hide on mobile
      mobileTitle: 'Community',
      link: '/community',
      icon: communityGlobeIcon,
      tooltip: 'Find a meetup near you.',
      showOnMobileStandalone: true,
      showOnCompressed: true,
    }, {
      id: 'eventsList',
      customComponentName: "EventsList",
    }, {
      id: 'allPosts',
      title: 'All Posts',
      link: '/allPosts',
      icon: allPostsIcon,
      tooltip: 'See all posts, filtered and sorted however you like.',
      showOnMobileStandalone: true,
      showOnCompressed: true,
    }, {
      id: 'divider',
      divider: true,
      showOnCompressed: true,
    }, {
      id: 'subscribeWidget',
      customComponentName: "SubscribeWidget",
    }, {
      id: 'questions',
      title: 'Open Questions',
      mobileTitle: 'Questions',
      link: '/questions',
      tooltip: <div>
        <div>• Ask simple newbie questions.</div>
        <div>• Collaborate on open research questions.</div>
        <div>• Pose and resolve confusions.</div>
      </div>,
      subItem: true
    }, {
      id: 'about',
      title: 'About',
      link: '/about',
      subItem: true,
      compressedIconComponent: Info,
      showOnCompressed: true,
    }, {
      id: 'faq',
      title: 'FAQ',
      link: '/faq',
      subItem: true,
    }, {
      id: 'donate',
      title: "Donate",
      link: '/donate',
      subItem: true
    }
  ],
  AlignmentForum: [
    {
      id: 'home',
      title: 'Home',
      link: '/',
      icon: compassIcon,
      tooltip: 'Latest posts, comments and curated content.',
      showOnMobileStandalone: true,
      showOnCompressed: true,
    }, {
      id: 'library',
      title: 'Library',
      link: '/library',
      iconComponent: BookIcon,
      tooltip: "Curated collections of the AI Alignment Forum's best writing.",
      showOnMobileStandalone: true,
      showOnCompressed: true,
    }, {
      id: 'questions',
      title: 'Questions',
      link: '/questions',
      icon: questionsGlobeIcon,
      tooltip: <div>
        <div>• Ask simple newbie questions.</div>
        <div>• Collaborate on open research questions.</div>
        <div>• Pose and resolve confusions.</div>
      </div>,
      showOnMobileStandalone: true,
      showOnCompressed: true,
    }, {
      id: 'allPosts',
      title: 'All Posts',
      link: '/allPosts',
      icon: allPostsIcon,
      tooltip: 'See all posts, filtered and sorted however you like.',
      showOnMobileStandalone: true,
      showOnCompressed: true,
    }, {
      id: 'divider',
      divider: true,
    }, {
      id: 'about',
      title: 'About',
      link: '/about',
      subItem: true,
      compressedIconComponent: Info,
      showOnCompressed: true,
    }
  ],
  EAForum: [
    {
      id: 'home',
      title: 'Home',
      link: '/',
      iconComponent: Home,
      tooltip: 'See recent posts on strategies for doing the most good, plus recent activity from all across the Forum.',
      showOnMobileStandalone: true,
      showOnCompressed: true,
    }, {
      id: 'allPosts',
      title: 'All Posts',
      link: '/allPosts',
      iconComponent: Sort,
      tooltip: 'See all posts, filtered and sorted by date, karma, and more.',
      showOnMobileStandalone: false,
      showOnCompressed: true,
    }, {
      id: 'tags',
      title: 'Tags',
      mobileTitle: 'Tags',
      link: '/tags/all',
      iconComponent: LocalOffer,
      tooltip: 'See posts tagged by their subject matter',
      showOnMobileStandalone: true,
      showOnCompressed: true,
    }, {
      id: 'sequences',
      title: 'Sequences',
      link: '/sequences',
      iconComponent: LocalLibrary,
      tooltip: "Collections of posts building on a common theme",
      showOnMobileStandalone: true,
      showOnCompressed: true,
    // TODO: Once we get two sequences we want to share, add subitems
    // }, {
    //   id: 'fellowship-reading',
    //   title: 'Fellowship Reading',
    //   link: '/TODO:',
    //   tooltip: "TODO: James is cool",
    //   subItem: true,
    // }, {
    //   id: 'motivation',
    //   title: 'Motivation',
    //   link: '/TODO:',
    //   tooltip: "TODO: Aaron's cool",
    //   subItem: true,
    }, {
      id: 'groups',
      title: 'EA Groups and Events',
      mobileTitle: 'EA Groups and Events',
      link: '/community',
      iconComponent: SupervisedUserCircleIcon,
      tooltip: 'See EA groups and events in your area',
      showOnMobileStandalone: true,
      showOnCompressed: true
    }, {
      id: 'divider',
      divider: true,
      showOnCompressed: true,
    }, {
      id: 'shortform',
      title: 'Shortform',
      link: '/shortform',
      subItem: true,
    }, {
      id: 'subscribeWidget',
      customComponentName: "SubscribeWidget",
    }, {
      id: 'intro',
      title: 'About EA',
      link: '/intro',
      subItem: true,
    }, {
      id: 'about',
      title: 'About the Forum',
      link: '/about',
      subItem: true,
      compressedIconComponent: Info,
      showOnCompressed: true,
    }, {
      id: 'contact',
      title: 'Contact Us',
      link: '/contact',
      subItem: true,
    }
  ]
}

export default menuTabs;
