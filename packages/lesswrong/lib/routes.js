import { addRoute, getSetting, getDynamicComponent } from 'meteor/vulcan:core';

// Top-level routes, ie, URL patterns.
//
// Some routes are dynamic; they have a component attribute of the from
//   (props) => getDynamicComponent(import('../components/...'), props)
// This someone unfortunate idiom can't be extracted into a function because
// import(...) is more like a macro than a function; meteor scans our source
// code at compile time looking for import("string-literal") and uses that to
// decide what to include in the bundle, so if we used import(...) on something
// other than a string literal, the target would be missing from the bundle.

addRoute([
  ////////////////////////////////////////////////////////////////////////////
  // example-forum routes
  ////////////////////////////////////////////////////////////////////////////
  {
    name:'posts.daily',
    path:'daily',
    componentName: 'PostsDaily'
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
    componentName: 'InboxWrapper',
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
    componentName: 'RecentCommentsPage',
  },

  ////////////////////////////////////////////////////////////////////////////
  // Sequences
  ////////////////////////////////////////////////////////////////////////////
  {
    name: 'sequencesHome',
    path: '/library',
    title: "The Library",
    component: (props) => getDynamicComponent(import('../components/sequences/SequencesHome'), props),
  },
  {
    name: 'sequences.single.old',
    path: '/sequences/:_id',
    component: (props) => getDynamicComponent(import('../components/sequences/SequencesSingle'), props),
  },
  {
    name: 'sequences.single',
    path: '/s/:_id',
    component: (props) => getDynamicComponent(import('../components/sequences/SequencesSingle'), props),
  },
  {
    name: 'sequencesEdit',
    path: '/sequencesEdit/:_id',
    componentName: 'SequencesEditForm'
  },
  {
    name: 'sequencesNew',
    path: '/sequencesNew',
    title: "New Sequence",
    componentName: 'SequencesNewForm',
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
    componentName: 'ChaptersEditForm',
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
    componentName: 'CoreSequences',
  },
  {
    name: 'Rationality',
    path: '/rationality',
    title: "Rationality: A-Z",
    componentName: 'CoreSequences',
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
    componentName: 'Codex',
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
    componentName: 'EventsDaily',
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
    component: (props) => getDynamicComponent(import('../components/localGroups/CommunityHome'), props),
  },
  {
    name: 'MeetupsHome',
    path: '/meetups',
    title: "Community",
    component: (props) => getDynamicComponent(import('../components/localGroups/CommunityHome'), props),
  },


  {
    name:'posts.single',
    path:'posts/:_id(/:slug)',
    componentName: 'PostsSingle'
  },
  {
    name: 'Localgroups.single',
    path: 'groups/:groupId',
    component: (props) => getDynamicComponent(import('../components/localGroups/LocalGroupSingle'), props),
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
    component: (props) => getDynamicComponent(import('../components/sunshineDashboard/ModerationLog'), props),
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