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
import { communityPath, getAllTagsPath } from '../../../lib/routes';
import { REVIEW_YEAR } from '../../../lib/reviewUtils';
import { ForumOptions, preferredHeadingCase } from '../../../lib/forumTypeUtils';
import { taggingNamePluralCapitalSetting, taggingNamePluralSetting } from '../../../lib/instanceSettings';

// EA Forum menu icons
import HomeIcon from "@heroicons/react/24/outline/HomeIcon";
import HomeSelectedIcon from "@heroicons/react/20/solid/HomeIcon";
import AllPostsIcon from "@heroicons/react/24/outline/ArchiveBoxIcon";
import AllPostsSelectedIcon from "@heroicons/react/24/solid/ArchiveBoxIcon";
import TopicsIcon from "@heroicons/react/24/outline/TagIcon";
import TopicsSelectedIcon from "@heroicons/react/24/solid/TagIcon";
import LibraryIcon from "@heroicons/react/24/outline/BookOpenIcon";
import LibrarySelectedIcon from "@heroicons/react/24/solid/BookOpenIcon";
import TakeActionIcon from "@heroicons/react/24/outline/HeartIcon";
import TakeActionSelectedIcon from "@heroicons/react/24/solid/HeartIcon";
import EventsIcon from "@heroicons/react/24/outline/CalendarIcon";
import EventsSelectedIcon from "@heroicons/react/24/solid/CalendarIcon";
import GroupsIcon from "@heroicons/react/24/outline/UsersIcon";
import GroupsSelectedIcon from "@heroicons/react/24/solid/UsersIcon";
import { eaSequencesHomeDescription } from '../../ea-forum/EASequencesHome';
import PencilSquareIcon from '@heroicons/react/24/outline/PencilSquareIcon';

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
//   loggedOutOnly: boolean; only visible to logged out users
//   customComponentName: string; instead of a TabNavigationItem, display this component
//
// See TabNavigation[Footer|Compressed]?Item.jsx for how these are used by the code

type MenuTabDivider = {
  id: string
  divider: true
  showOnCompressed?: boolean
}

type MenuTabCustomComponent = {
  id: string
  customComponentName: string
}

type MenuItemIcon = React.ComponentType | React.FC<{className?: string}>;

export type MenuTabRegular = {
  id: string
  title: string
  mobileTitle?: string
  link: string
  icon?: React.ReactNode
  iconComponent?: MenuItemIcon
  selectedIconComponent?: MenuItemIcon
  compressedIconComponent?: MenuItemIcon
  tooltip?: React.ReactNode
  showOnMobileStandalone?: boolean
  showOnCompressed?: boolean
  subItem?: boolean,
  loggedOutOnly?: boolean
}

type MenuTab = MenuTabDivider | MenuTabCustomComponent | MenuTabRegular

export const menuTabs: ForumOptions<Array<MenuTab>> = {
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
      id: 'allPosts',
      title: 'All Posts',
      link: '/allPosts',
      icon: allPostsIcon,
      tooltip: 'See all posts, filtered and sorted however you like.',
      showOnMobileStandalone: true,
      showOnCompressed: true,
    }, {
      id: 'concepts',
      title: 'Concepts',
      mobileTitle: 'Concepts',
      link: getAllTagsPath(),
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
      id: 'highlights',
      title: 'Sequence Highlights',
      link: '/highlights',
      tooltip: "A curated selection of Eliezer's sequences, covering important background material for participating in the LessWrong community (50 posts, approx. 7 hour read)",
      subItem: true,
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
      id: 'bestoflesswrong',
      title: 'Best Of',
      link: '/bestoflesswrong',
      tooltip: "Top posts from the Annual Review (2018 through " + REVIEW_YEAR + ")",
      subItem: true,
    }, {
      id: 'events',
      title: 'Community Events', // Events hide on mobile
      mobileTitle: 'Community',
      link: communityPath,
      icon: communityGlobeIcon,
      tooltip: 'Find a meetup near you.',
      showOnMobileStandalone: true,
      showOnCompressed: true,
    }, {
      id: 'eventsList',
      customComponentName: "EventsList",
    }, {
      id: 'divider',
      divider: true,
      showOnCompressed: true,
    }, {
      id: 'subscribeWidget',
      customComponentName: "SubscribeWidget",
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
      iconComponent: HomeIcon,
      selectedIconComponent: HomeSelectedIcon,
      tooltip: 'See recent posts on strategies for doing the most good, plus recent activity from all across the Forum.',
      showOnMobileStandalone: true,
      showOnCompressed: true,
    }, {
      id: 'allPosts',
      title: 'All posts',
      link: '/allPosts',
      iconComponent: AllPostsIcon,
      selectedIconComponent: AllPostsSelectedIcon,
      tooltip: 'See all posts, filtered and sorted by date, karma, and more.',
      showOnMobileStandalone: false,
      showOnCompressed: true,
    }, {
      id: taggingNamePluralSetting.get(),
      title: taggingNamePluralCapitalSetting.get(),
      mobileTitle: taggingNamePluralCapitalSetting.get(),
      link: getAllTagsPath(),
      iconComponent: TopicsIcon,
      selectedIconComponent: TopicsSelectedIcon,
      tooltip: `A sorted list of pages — “${taggingNamePluralCapitalSetting.get()}” — in the EA Forum Wiki, which explains 
      ${taggingNamePluralSetting.get()} in EA and collects posts tagged with those ${taggingNamePluralSetting.get()}.`,
      showOnMobileStandalone: true,
      showOnCompressed: true,
    }, {
      id: 'library',
      title: 'Library',
      link: '/library',
      iconComponent: LibraryIcon,
      selectedIconComponent: LibrarySelectedIcon,
      tooltip: eaSequencesHomeDescription,
      showOnMobileStandalone: true,
      showOnCompressed: true,
    }, {
      id: 'takeAction',
      title: 'Take action',
      link: `/${taggingNamePluralSetting.get()}/opportunities-to-take-action`,
      iconComponent: TakeActionIcon,
      selectedIconComponent: TakeActionSelectedIcon,
      tooltip: "Opportunities to get involved with impactful work",
      loggedOutOnly: true
    }, {
      id: 'events',
      title: 'Events',
      link: '/events',
      iconComponent: EventsIcon,
      selectedIconComponent: EventsSelectedIcon,
      tooltip: 'Upcoming events near you',
      showOnMobileStandalone: true,
      showOnCompressed: true
    }, {
      id: 'community',
      title: 'Groups & people',
      link: communityPath,
      iconComponent: GroupsIcon,
      selectedIconComponent: GroupsSelectedIcon,
      tooltip: 'Join a group near you or meet others online',
      showOnMobileStandalone: false,
      showOnCompressed: true
    }, {
      id: 'divider',
      divider: true,
      showOnCompressed: true,
    }, {
      id: 'shortform',
      title: 'Quick takes',
      link: '/quicktakes',
      subItem: true,
    }, {
      id: 'about',
      title: 'How to use the Forum',
      link: '/about',
      subItem: true,
      compressedIconComponent: Info,
      showOnCompressed: true,
    }, {
      id: 'contact',
      title: preferredHeadingCase('Contact Us'),
      link: '/contact',
      subItem: true,
    }, {
      id: 'cookies',
      title: preferredHeadingCase('Cookie Policy'),
      link: '/cookiePolicy',
      subItem: true,
    }, {
      id: 'subscribeWidget',
      customComponentName: "SubscribeWidget",
    }
  ],
  default: [
    {
      id: 'home',
      title: 'Home',
      link: '/',
      iconComponent: Home,
      tooltip: 'See recent posts from across the forum.',
      showOnMobileStandalone: true,
      showOnCompressed: true,
    }, {
      id: 'newPostLink',
      title: 'Create Post',
      mobileTitle: 'Create Post',
      link: '/newPost',
      iconComponent: PencilSquareIcon,
      showOnMobileStandalone: true,
      showOnCompressed: true,
    }, {
    /* Tags (topics) are removed for launch, but will be added back later, so I'm leaving this commented out. */
    //   id: 'wiki',
    //   title: 'Wiki',
    //   mobileTitle: 'Wiki',
    //   link: getAllTagsPath(),
    //   iconComponent: LocalOffer,
    //   tooltip: 'Collaboratively edited Tags and Wiki Articles',
    //   showOnMobileStandalone: true,
    //   showOnCompressed: true,
    // }, {
    /* Sequences are removed for launch, but might be added back later, so I'm leaving this commented out. */
    //   id: 'library',
    //   title: 'Library',
    //   link: '/library',
    //   iconComponent: LocalLibrary,
    //   tooltip: eaSequencesHomeDescription,
    //   showOnMobileStandalone: true,
    //   showOnCompressed: true,
    // }, {
    /* Events are removed for launch, but will be added back later, so I'm leaving this commented out. */
    //   id: 'events',
    //   title: 'Community and Events',
    //   mobileTitle: 'Events',
    //   link: communityPath,
    //   iconComponent: SupervisedUserCircleIcon,
    //   tooltip: 'See groups and events in your area',
    //   showOnMobileStandalone: true,
    //   showOnCompressed: true
    // }, {
    //   id: 'eventsList',
    //   customComponentName: "EventsList",
    // }, {
      id: 'divider',
      divider: true,
      showOnCompressed: true,
    }, {
    /* Quick takes are removed for launch, but may be added back later, so I'm leaving this commented out. */
    //   id: 'shortform',
    //   title: 'Shortform',
    //   link: '/shortform',
    //   subItem: true,
    // }, {
    //   id: 'subscribeWidget',
    //   customComponentName: "SubscribeWidget",
    // }, {
      id: 'events',
      title: 'Retreats & Events',
      link: '/posts/mTpNWoYjfNAHBfHqq/retreats',
      subItem: true,
    }, {
      id: 'ideas',
      title: 'App Ideas',
      link: '/posts/bcDq7p4gjBrBCyqSp/app-roadmap-and-requests',
      subItem: true,
    }, {
      id: 'feedback',
      title: 'Forum Feedback',
      link: '/posts/KZDshkgYsm22jifCB/forum-feedback',
      subItem: true,
    }, {
      id: 'faq',
      title: 'Forum FAQ',
      link: '/posts/A3gtJ9Knhxb3AR3SE/forum-faq-1',
      subItem: true,
    }, {
      id: 'support',
      title: 'Support',
      link: '/posts/snn3Y65Aa3eKLyFy6/support',
      subItem: true,
    }
  ]
}

export default menuTabs;
