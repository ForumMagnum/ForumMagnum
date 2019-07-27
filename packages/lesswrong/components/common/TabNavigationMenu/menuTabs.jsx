import React from 'react';
import { Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';

import { compassIcon } from '../../icons/compassIcon';
import { questionsGlobeIcon } from '../../icons/questionsGlobeIcon';
import { communityGlobeIcon } from '../../icons/communityGlobeIcon';
import { BookIcon } from '../../icons/bookIcon'
import { allPostsIcon } from '../../icons/allPostsIcon';

const EventsList = ({currentUser}) => {
  const { TabNavigationEventsList } = Components

  const lat = currentUser &&
    currentUser.mongoLocation &&
    currentUser.mongoLocation.coordinates[1]
  const lng = currentUser &&
    currentUser.mongoLocation &&
    currentUser.mongoLocation.coordinates[0]
  let eventsListTerms = {
    view: 'events',
    limit: 3,
  }
  if (lat && lng) {
    eventsListTerms = {
      view: 'nearbyEvents',
      lat: lat,
      lng: lng,
      limit: 3,
    }
  }
  return <span>
    <TabNavigationEventsList terms={eventsListTerms} />
  </span>
}

// TODO; document tab
// See TabNavigationItem for how these are used
export default forumTabs = {
  LessWrong: [
    {
      id: 'home',
      title: 'Home',
      link: '/',
      class: 'homeIcon',
      icon: compassIcon,
      tooltip: 'Latest posts, comments and curated content.',
      showOnMobileStandalone: true,
    }, {
      id: 'questions',
      title: 'Questions',
      link: '/questions',
      icon: questionsGlobeIcon,
      tooltip: <div>
        <div>• Ask simple newbie questions.</div>
        <div>• Collaborate on open research questions.</div>
        <div>• Pose and resolve confusions.</div>
      </div>,
      showOnMobileStandalone: true,
    }, {
      id: 'library',
      title: 'Library',
      link: '/library',
      icon: BookIcon,
      tooltip: "Curated collections of LessWrong's best writing.",
      showOnMobileStandalone: true,
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
      tooltip: 'What if Harry was a scientist? What would you do if the universe had magic in it? A story that illustrates many rationality concepts.',
      subItem: true,
    }, {
      id: 'events',
      title: 'Community', // Events hide on mobile
      link: '/community',
      icon: communityGlobeIcon,
      tooltip: 'Find a meetup near you.',
      showOnMobileStandalone: true,
    }, {
      id: 'eventsList',
      customComponent: EventsList,
    }, {
      id: 'allPosts',
      title: 'All Posts',
      link: '/allPosts',
      icon: allPostsIcon,
      tooltip: 'See all posts, filtered and sorted however you like.',
      showOnMobileStandalone: true,
    }, {
      id: 'divider',
      divider: true,
    }, {
      id: 'shortform',
      title: 'Shortform [Beta]',
      link: '/shortform',
      subItem: true,
    // TODO; confirm removal of meta
    }, {
      id: 'about',
      title: 'About',
      link: '/about',
      subItem: true,
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
      class: 'homeIcon',
      icon: compassIcon,
      tooltip: 'Latest posts, comments and curated content.',
      showOnMobileStandalone: true,
    }, {
      id: 'questions',
      title: 'Questions',
      link: '/questions',
      icon: questionsGlobeIcon,
      tooltip: <div>
        <div>• Ask simple newbie questions.</div>
        <div>• Collaborate on open research questions.</div>
        <div>• Pose and resolve confusions.</div>
      </div>,
      showOnMobileStandalone: true,
    }, {
      id: 'allPosts',
      title: 'All Posts',
      link: '/allPosts',
      icon: allPostsIcon,
      tooltip: 'See all posts, filtered and sorted however you like.',
      showOnMobileStandalone: true,
    }, {
      id: 'divider',
      divider: true,
    }, {
      id: 'shortform',
      title: 'Shortform [Beta]',
      link: '/shortform',
      subItem: true,
    }, {
      id: 'about',
      title: 'About',
      link: '/about',
      subItem: true,
    }, {
      id: 'faq',
      title: 'FAQ',
      link: '/faq',
      subItem: true,
    }
  ],
  EAForum: [
    // TODO; copy, icons
    {
      id: 'home',
      title: 'Home',
      link: '/',
      class: 'homeIcon',
      icon: compassIcon,
      tooltip: 'Latest posts. TODO;',
      showOnMobileStandalone: true,
    }, {
      id: 'community',
      title: 'Community',
      link: '/meta',
      icon: communityGlobeIcon,
      tooltip: 'Community posts TODO;.',
      showOnMobileStandalone: true,
    }, {
      id: 'questions',
      title: 'Questions',
      link: '/questions',
      icon: questionsGlobeIcon,
      tooltip: <div>
        <div>• Ask simple newbie questions.</div>
        <div>• Collaborate on open research questions.</div>
        <div>• Pose and resolve confusions.</div>
        <div>• TODO; Aaron plz review.</div>
      </div>,
      showOnMobileStandalone: true,
    }, {
      id: 'allPosts',
      title: 'All Posts',
      link: '/allPosts',
      icon: allPostsIcon,
      tooltip: 'See all posts, filtered and sorted however you like.',
      showOnMobileStandalone: true,
    }, {
      id: 'divider',
      divider: true,
    }, {
      id: 'shortform',
      title: 'Shortform [Beta]',
      link: '/shortform',
      subItem: true,
    }, {
      id: 'about',
      title: 'About',
      link: '/about',
      subItem: true,
    }
  ]
}
