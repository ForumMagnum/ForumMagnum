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

// example-forum routes
addRoute([
  {name:'posts.daily',      path:'daily',                 componentName: 'PostsDaily'},
  {name:'users.single',     path:'users/:slug',           componentName: 'UsersSingle'},
  {name:'users.account',    path:'account',               componentName: 'UsersAccount'},
  {name:'users.edit',       path:'users/:slug/edit',      componentName: 'UsersAccount'},
  {name:'admin.categories', path:'admin/categories',      componentName: 'CategoriesDashboard'},
]);

// Miscellaneous LW2 routes
addRoute({ name: 'login', path: '/login', componentName: 'LoginPage', title: "Login" });
addRoute({ name: 'inbox', path: '/inbox', componentName: 'InboxWrapper', title: "Inbox" });
addRoute({ name: 'newPost', path: '/newPost', componentName: 'PostsNewForm', title: "New Post" });
addRoute({ name: 'editPost', path: '/editPost', componentName: 'PostsEditForm' });
addRoute({ name: 'recentComments', path: '/recentComments', componentName: 'RecentCommentsPage', title: "Recent Comments" });

// Sequences
addRoute({
  name: 'sequencesHome',
  path: '/library',
  title: "The Library",
  component: (props) => getDynamicComponent(import('../components/sequences/SequencesHome'), props),
});
addRoute({ name: 'sequences.single.old', path: '/sequences/:_id', componentName: 'SequencesSingle' });
addRoute({ name: 'sequences.single', path: '/s/:_id', componentName: 'SequencesSingle' });
addRoute({ name: 'sequencesEdit', path: '/sequencesEdit/:_id', componentName: 'SequencesEditForm'});
addRoute({ name: 'sequencesNew', path: '/sequencesNew', componentName: 'SequencesNewForm', title: "New Sequence" });
addRoute({ name: 'sequencesPost', path: '/s/:sequenceId/p/:postId', componentName: 'SequencesPost'});

addRoute({ name: 'chaptersEdit', path: '/chaptersEdit/:_id', componentName: 'ChaptersEditForm', title: "Edit Chapter"});

// Collections
addRoute({ name: 'collections', path: '/collections/:_id', componentName: 'CollectionsSingle' });
addRoute({ name: 'Sequences', path: '/sequences', componentName: 'CoreSequences', title: "Rationality: A-Z" })
addRoute({ name: 'Rationality', path: '/rationality', componentName: 'CoreSequences', title: "Rationality: A-Z" })
addRoute({ name: 'Rationality.posts.single', path: '/rationality/:slug', componentName: 'PostsSingleSlugWrapper'})

addRoute({ name: 'HPMOR', path: '/hpmor', componentName: 'HPMOR', title: "Harry Potter and the Methods of Rationality" })
addRoute({ name: 'HPMOR.posts.single', path: '/hpmor/:slug', componentName: 'PostsSingleSlugWrapper'})

addRoute({ name: 'Codex', path: '/codex', componentName: 'Codex', title: "The Codex"})
addRoute({ name: 'Codex.posts.single', path: '/codex/:slug', componentName: 'PostsSingleSlugWrapper'})


addRoute({ name: 'Meta', path: '/meta', componentName: 'Meta', title: "Meta"})
addRoute({ name: 'EventsDaily', path: '/pastEvents', componentName: 'EventsDaily', title: "Past Events by Day"})
addRoute({ name: 'FeaturedPosts', path: '/featured', componentName: 'FeaturedPostsPage'})
addRoute({ name: 'AllComments', path: '/allComments', componentName: 'AllComments', title: "All Comments"})
addRoute({ name: 'CommunityHome', path: '/community', componentName: 'CommunityHome', title: "Community"})
addRoute({ name: 'MeetupsHome', path: '/meetups', componentName: 'CommunityHome', title: "Community"})

//Route for testing the editor. Useful for debugging
addRoute({ name: 'searchTest', path: '/searchTest', componentName: 'SearchBar'});
addRoute({ name: 'postsListEditorTest', path:'/postsListEditorTest', componentName: 'PostsListEditor'})
addRoute({ name: 'imageUploadTest', path: '/imageUpload', componentName: 'ImageUpload'});

addRoute({name:'posts.single',   path:'posts/:_id(/:slug)', componentName: 'PostsSingle'});
addRoute({name:'Localgroups.single',   path:'groups/:groupId', componentName: 'LocalGroupSingle'});
addRoute({name:'events.single',   path:'events/:_id(/:slug)', componentName: 'PostsSingle'});
addRoute({ name: 'groups.post', path: '/g/:groupId/p/:_id', componentName: 'PostsSingle'});

addRoute({ name: 'admin', path: '/admin', componentName: 'AdminHome', title: "Admin" });
addRoute({ name: 'moderation', path: '/moderation', componentName: 'ModerationLog', title: "Moderation Log" });

addRoute({name:'about',   path:'/about', componentName: 'PostsSingleRoute', _id:"ANDbEKqbdDuBCQAnM"});

if(getSetting('AlignmentForum', false)) {
    addRoute({name:'alignment.home',   path:'/', componentName: 'AlignmentForumHome'});
} else {
    addRoute({name: 'home', path: '/', componentName: 'Home'});
}

addRoute({name:'benchmark',   path:'/benchmark', componentName: 'BenchmarkComponent', title: "Benchmark" });
