import React from 'react';
import { communityPath, getAllTagsPath } from '../../../lib/routes';
import { REVIEW_YEAR } from '../../../lib/reviewUtils';
import { preferredHeadingCase } from '../../../themes/forumTheme';
import { ForumOptions } from '../../../lib/forumTypeUtils';
import { taggingNamePluralCapitalSetting, taggingNamePluralSetting } from '../../../lib/instanceSettings';

import { compassIcon } from '../../icons/compassIcon';
import { questionsGlobeIcon } from '../../icons/questionsGlobeIcon';
import { ConceptsIcon } from '../../icons/conceptsIcon';
import { communityGlobeIcon } from '../../icons/communityGlobeIcon';
import { BookIcon } from '../../icons/bookIcon'
import { allPostsIcon } from '../../icons/allPostsIcon';

import Home from '@/lib/vendor/@material-ui/icons/src/Home'
import LocalOffer from '@/lib/vendor/@material-ui/icons/src/LocalOffer';
import Sort from '@/lib/vendor/@material-ui/icons/src/Sort'
import Info from '@/lib/vendor/@material-ui/icons/src/Info';
import SupervisedUserCircleIcon from '@/lib/vendor/@material-ui/icons/src/SupervisedUserCircle';

// EA Forum menu icons
import HomeIcon from "@heroicons/react/24/outline/HomeIcon";
import HomeSelectedIcon from "@heroicons/react/20/solid/HomeIcon";
import BestOfIcon from "@heroicons/react/24/outline/StarIcon";
import BestOfSelectedIcon from "@heroicons/react/24/solid/StarIcon";
import AllPostsIcon from "@heroicons/react/24/outline/ArchiveBoxIcon";
import AllPostsSelectedIcon from "@heroicons/react/24/solid/ArchiveBoxIcon";
import TopicsIcon from "@heroicons/react/24/outline/TagIcon";
import TopicsSelectedIcon from "@heroicons/react/24/solid/TagIcon";
import TakeActionIcon from "@heroicons/react/24/outline/HeartIcon";
import TakeActionSelectedIcon from "@heroicons/react/24/solid/HeartIcon";
import EventsIcon from "@heroicons/react/24/outline/CalendarIcon";
import EventsSelectedIcon from "@heroicons/react/24/solid/CalendarIcon";
import GroupsIcon from "@heroicons/react/24/outline/UserGroupIcon";
import GroupsSelectedIcon from "@heroicons/react/24/solid/UserGroupIcon";
import {
  PeopleDirectoryIcon,
  PeopleDirectorySelectedIcon,
} from '../../icons/peopleDirectoryIcon';
import { podcastPost } from '@/lib/eaPodcasts';
import { useTheme } from '@/components/themes/useTheme';
import { GhibliIconPath } from '@/components/themes/ghibli/GhibliIcon';

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
  loggedOutOnly?: boolean,
  flag?: string,
  desktopOnly?: boolean,
  betaOnly?: boolean,
}

type MenuTab = MenuTabDivider | MenuTabCustomComponent | MenuTabRegular

const GlobeIcon = () => {
  const theme = useTheme();
  if (theme.themeOptions.name === 'ghiblify') {
    return <GhibliIconPath path="/ghibli/globe.png"/>
  } else {
    return communityGlobeIcon;
  }
}

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
      icon: <ConceptsIcon/>,
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
      id: 'bestoflesswrong',
      title: 'Best of LessWrong',
      link: '/bestoflesswrong',
      tooltip: "Top posts from the Annual Review (2018 through " + REVIEW_YEAR + ")",
      subItem: true,
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
      id: 'events',
      title: 'Community Events', // Events hide on mobile
      mobileTitle: 'Community',
      link: communityPath,
      icon: <GlobeIcon/>,
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
      id: 'lwAlbum',
      title: 'LW the Album',
      link: '/posts/YMo5PuXnZDwRjhHhE/the-story-of-i-have-been-a-good-bing',
      subItem: true
    }, {
      id: 'about',
      title: 'About',
      link: '/about',
      subItem: true,
      compressedIconComponent: Info,
      showOnCompressed: true,
    },  {
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
      id: 'bestOf',
      title: 'Best of the Forum',
      link: '/best-of',
      iconComponent: BestOfIcon,
      selectedIconComponent: BestOfSelectedIcon,
      tooltip: 'Curated by the Forum team',
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
      id: 'peopleDirectory',
      title: 'People directory',
      link: '/people-directory',
      iconComponent: PeopleDirectoryIcon,
      selectedIconComponent: PeopleDirectorySelectedIcon,
      tooltip: 'Search and filter Forum users',
      showOnMobileStandalone: true,
      showOnCompressed: true
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
      title: 'Groups directory',
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
      id: 'about',
      title: 'How to use the Forum',
      link: '/about',
      subItem: true,
      compressedIconComponent: Info,
      showOnCompressed: true,
    }, {
      id: 'handbook',
      title: 'EA Handbook',
      link: '/handbook',
      subItem: true,
      showOnCompressed: true,
    }, {
      id: 'podcasts',
      title: 'EA Forum Podcast',
      link: podcastPost,
      subItem: true,
      showOnCompressed: true,
    }, {
      id: 'shortform',
      title: 'Quick takes',
      link: '/quicktakes',
      subItem: true,
    }, {
      id: 'subscribeWidget',
      customComponentName: "SubscribeWidget",
    }, {
      id: 'cookies',
      title: preferredHeadingCase('Cookie Policy'),
      link: '/cookiePolicy',
      subItem: true,
    }, {
      id: 'copyright',
      title: preferredHeadingCase('Copyright'),
      link: '/posts/KK6AE8HzPkR2KnqSg/new-forum-license-creative-commons',
      subItem: true,
    }, {
      id: 'divider2',
      divider: true,
    }, {
      id: 'contact',
      title: preferredHeadingCase('Contact Us'),
      link: '/contact',
      subItem: true,
    }
  ],
  default: [
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
      id: 'wiki',
      title: 'Wiki',
      mobileTitle: 'Wiki',
      link: getAllTagsPath(),
      iconComponent: LocalOffer,
      tooltip: 'Collaboratively edited Tags and Wiki Articles',
      showOnMobileStandalone: true,
      showOnCompressed: true,
    }, {
      id: 'events',
      title: 'Community and Events',
      mobileTitle: 'Events',
      link: communityPath,
      iconComponent: SupervisedUserCircleIcon,
      tooltip: 'See groups and events in your area',
      showOnMobileStandalone: true,
      showOnCompressed: true
    }, {
      id: 'eventsList',
      customComponentName: "EventsList",
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
      id: 'subscribeWidget',
      customComponentName: "SubscribeWidget",
    }, {
      id: 'about',
      title: 'About the Forum',
      link: '/about',
      subItem: true,
      compressedIconComponent: Info,
      showOnCompressed: true,
    }, {
      id: 'contact',
      title: preferredHeadingCase('Contact Us'),
      link: '/contact',
      subItem: true,
    }
  ]
}

export default menuTabs;
