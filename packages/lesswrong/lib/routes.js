import { addRoute, getSetting, getDynamicComponent } from 'meteor/vulcan:core';

// Top-level routes, ie, URL patterns.
//
// Some routes are dynamic; they have a component attribute of the from
//   dynamicRoute(() => import('../components/...'))
// This somewhat unfortunate idiom can't be fully extracted into a function
// because import(...) is more like a macro than a function; meteor scans our
// source code at compile time looking for import("string-literal") and uses
// that to decide what to include in the bundle, so if we used import(...) on
// something other than a string literal, the target would be missing from the
// bundle.

function dynamicRoute(module) {
  return (props) => getDynamicComponent(module, props);
}

addRoute([
  ////////////////////////////////////////////////////////////////////////////
  // example-forum routes
  ////////////////////////////////////////////////////////////////////////////
  {
    name:'posts.daily',
    path:'daily',
    component: (props) => dynamicRoute(() => import('../components/posts/PostsDaily')),
  },
  {
    name:'users.single',
    path:'users/:slug',
    componentName: 'UsersSingle'
  },
  {
    name:'users.account',
    path:'account',
    componentName: 'UsersAccount'
  },
  {
    name:'users.edit',
    path:'users/:slug/edit',
    componentName: 'UsersAccount'},
  {
    name:'admin.categories',
    path:'admin/categories',
    componentName: 'CategoriesDashboard'
  },

  ////////////////////////////////////////////////////////////////////////////
  // Miscellaneous routes
  ////////////////////////////////////////////////////////////////////////////
  {
    name: 'login',
    path: '/login',
    title: "Login",
    componentName: 'LoginPage',
  },
  {
    name: 'inbox',
    path: '/inbox',
    title: "Inbox",
    component: (props) => dynamicRoute(() => import('../components/messaging/InboxWrapper')),
  },
  {
    name: 'newPost',
    path: '/newPost',
    title: "New Post",
    componentName: 'PostsNewForm',
  },
  {
    name: 'editPost',
    path: '/editPost',
    componentName: 'PostsEditForm'
  },
  {
    name: 'recentComments',
    path: '/recentComments',
    title: "Recent Comments",
    component: (props) => dynamicRoute(() => import('../components/comments/RecentCommentsPage')),
  },

  ////////////////////////////////////////////////////////////////////////////
  // Sequences
  ////////////////////////////////////////////////////////////////////////////
  {
    name: 'sequencesHome',
    path: '/library',
    title: "The Library",
    component: dynamicRoute(() => import('../components/sequences/SequencesHome')),
  },
  {
    name: 'sequences.single.old',
    path: '/sequences/:_id',
    component: dynamicRoute(() => import('../components/sequences/SequencesSingle')),
  },
  {
    name: 'sequences.single',
    path: '/s/:_id',
    component: dynamicRoute(() => import('../components/sequences/SequencesSingle')),
  },
  {
    name: 'sequencesEdit',
    path: '/sequencesEdit/:_id',
    component: dynamicRoute(() => import('../components/sequences/SequencesEditForm')),
  },
  {
    name: 'sequencesNew',
    path: '/sequencesNew',
    title: "New Sequence",
    component: dynamicRoute(() => import('../components/sequences/SequencesNewForm')),
  },
  {
    name: 'sequencesPost',
    path: '/s/:sequenceId/p/:postId',
    componentName: 'SequencesPost'
  },

  {
    name: 'chaptersEdit',
    path: '/chaptersEdit/:_id',
    title: "Edit Chapter",
    component: dynamicRoute(() => import('../components/sequences/ChaptersEditForm')),
  },

  ////////////////////////////////////////////////////////////////////////////
  // Collections
  ////////////////////////////////////////////////////////////////////////////
  {
    name: 'collections',
    path: '/collections/:_id',
    componentName: 'CollectionsSingle',
  },
  {
    name: 'Sequences',
    path: '/sequences',
    title: "Rationality: A-Z",
    component: dynamicRoute(() => import('../components/sequences/CoreSequences')),
  },
  {
    name: 'Rationality',
    path: '/rationality',
    title: "Rationality: A-Z",
    component: dynamicRoute(() => import('../components/sequences/CoreSequences')),
  },
  {
    name: 'Rationality.posts.single',
    path: '/rationality/:slug',
    componentName: 'PostsSingleSlugWrapper'
  },

  {
    name: 'HPMOR',
    path: '/hpmor',
    title: "Harry Potter and the Methods of Rationality",
    componentName: 'HPMOR',
    component: dynamicRoute(() => import('../components/sequences/HPMOR')),
  },
  {
    name: 'HPMOR.posts.single',
    path: '/hpmor/:slug',
    componentName: 'PostsSingleSlugWrapper'
  },

  {
    name: 'Codex',
    path: '/codex',
    title: "The Codex",
    component: dynamicRoute(() => import('../components/sequences/Codex')),
  },
  {
    name: 'Codex.posts.single',
    path: '/codex/:slug',
    componentName: 'PostsSingleSlugWrapper'
  },


  ////////////////////////////////////////////////////////////////////////////
  // Sections and Views
  ////////////////////////////////////////////////////////////////////////////
  {
    name: 'Meta',
    path: '/meta',
    title: "Meta",
    componentName: 'Meta',
  },
  {
    name: 'EventsDaily',
    path: '/pastEvents',
    title: "Past Events by Day",
    component: dynamicRoute(() => import('../components/posts/EventsDaily')),
  },
  {
    name: 'FeaturedPosts',
    path: '/featured',
    componentName: 'FeaturedPostsPage'
  },
  {
    name: 'AllComments',
    path: '/allComments',
    componentName: 'AllComments',
    title: "All Comments"
  },
  {
    name: 'CommunityHome',
    path: '/community',
    title: "Community",
    component: dynamicRoute(() => import('../components/localGroups/CommunityHome')),
  },
  {
    name: 'MeetupsHome',
    path: '/meetups',
    title: "Community",
    component: dynamicRoute(() => import('../components/localGroups/CommunityHome')),
  },


  {
    name:'posts.single',
    path:'posts/:_id(/:slug)',
    componentName: 'PostsSingle'
  },
  {
    name: 'Localgroups.single',
    path: 'groups/:groupId',
    component: dynamicRoute(() => import('../components/localGroups/LocalGroupSingle')),
  },
  {
    name:'events.single',
    path:'events/:_id(/:slug)',
    componentName: 'PostsSingle'
  },
  {
    name: 'groups.post',
    path: '/g/:groupId/p/:_id',
    componentName: 'PostsSingle'
  },

  {
    name: 'admin',
    path: '/admin',
    title: "Admin",
    componentName: 'AdminHome',
  },
  {
    name: 'moderation',
    path: '/moderation',
    title: "Moderation Log",
    component: dynamicRoute(() => import('../components/sunshineDashboard/ModerationLog')),
  },

  {
    name:'about',
    path:'/about',
    _id:"ANDbEKqbdDuBCQAnM",
    componentName: 'PostsSingleRoute',
  },

  ////////////////////////////////////////////////////////////////////////////
  // Test routes
  ////////////////////////////////////////////////////////////////////////////
  {
    name:'benchmark',
    path:'/benchmark',
    title: "Benchmark",
    componentName: 'BenchmarkComponent',
  },

  //Route for testing the editor. Useful for debugging
  {
    name: 'searchTest',
    path: '/searchTest',
    componentName: 'SearchBar'
  },
  {
    name: 'postsListEditorTest',
    path:'/postsListEditorTest',
    componentName: 'PostsListEditor'
  },
  {
    name: 'imageUploadTest',
    path: '/imageUpload',
    componentName: 'ImageUpload'
  },
]);

////////////////////////////////////////////////////////////////////////////
// Front page
////////////////////////////////////////////////////////////////////////////
if(getSetting('AlignmentForum', false)) {
  addRoute({
    name:'alignment.home',
    path:'/',
    componentName: 'AlignmentForumHome'
  });
} else {
  addRoute({
    name: 'home',
    path: '/',
    componentName: 'Home'
  });
}