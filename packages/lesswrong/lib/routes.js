import { addRoute, getSetting} from 'meteor/vulcan:core';

// example-forum routes
addRoute([
  {name:'posts.daily',      path:'daily',                 componentName: 'PostsDaily', title: "Posts by Day" },
  {name:'users.single',     path:'users/:slug',           componentName: 'UsersSingle'},
  {name:'users.account',    path:'account',               componentName: 'UsersAccount'},
  {name:'users.edit',       path:'users/:slug/edit',      componentName: 'UsersAccount'}
]);

// Miscellaneous LW2 routes
addRoute({ name: 'login', path: '/login', componentName: 'LoginPage', title: "Login" });
addRoute({ name: 'inbox', path: '/inbox', componentName: 'InboxWrapper', title: "Inbox" });
addRoute({ name: 'newPost', path: '/newPost', componentName: 'PostsNewForm', title: "New Post" });
addRoute({ name: 'editPost', path: '/editPost', componentName: 'PostsEditPage' });
addRoute({ name: 'recentComments', path: '/recentComments', componentName: 'RecentCommentsPage', title: "Recent Comments" });

// Sequences
addRoute({ name: 'sequencesHome', path: '/library', componentName: 'SequencesHome', title: "The Library" });
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

addRoute({ name: 'EventsPast', path: '/pastEvents', componentName: 'EventsPast', title: "Past Events by Day"})
addRoute({ name: 'EventsUpcoming', path: '/upcomingEvents', componentName: 'EventsUpcoming', title: "Upcoming Events by Day"})

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

if(getSetting('AlignmentForum', false)) {
    addRoute({name:'alignment.home',   path:'/', componentName: 'AlignmentForumHome'});
    addRoute({name:'about',   path:'/about', componentName: 'PostsSingleRoute', _id:"FoiiRDC3EhjHx7ayY"});
} else {
    addRoute({name: 'home', path: '/', componentName: 'Home'});
    addRoute({name:'about',   path:'/about', componentName: 'PostsSingleRoute', _id:"ANDbEKqbdDuBCQAnM"});
}
