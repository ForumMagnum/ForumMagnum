import { addRoute } from 'meteor/vulcan:core';

addRoute({ name: 'inbox', path: '/inbox', componentName: 'InboxWrapper' });
addRoute({ name: 'newPost', path: '/newPost', componentName: 'PostsNewForm' });
addRoute({ name: 'editPost', path: '/editPost', componentName: 'PostsEditForm' });
addRoute({ name: 'recentComments', path: '/recentComments', componentName: 'RecentCommentsPage' });

// Sunshine Dashboard
addRoute({ name: 'SunshineDashboard', path: '/sunshine', componentName: 'SunshineDashboard' });

// Sequences
addRoute({ name: 'sequencesHome', path: '/library', componentName: 'SequencesHome' });
addRoute({ name: 'sequences.single', path: '/sequences/:_id', componentName: 'SequencesSingle' });
addRoute({ name: 'sequencesEdit', path: '/sequencesEdit/:_id', componentName: 'SequencesEditForm'});
addRoute({ name: 'sequencesNew', path: '/sequencesNew', componentName: 'SequencesNewForm'});
addRoute({ name: 'sequencesPost', path: '/s/:sequenceId/p/:postId', componentName: 'SequencesPost'});

addRoute({ name: 'chaptersEdit', path: '/chaptersEdit/:_id', componentName: 'ChaptersEditForm'});

// Collections
addRoute({ name: 'collections', path: '/collections/:_id', componentName: 'CollectionsSingle' });
addRoute({ name: 'Sequences', path: '/sequences', componentName: 'CoreSequences'})
addRoute({ name: 'Rationality', path: '/rationality', componentName: 'CoreSequences'})
addRoute({ name: 'Rationality.posts.single', path: '/rationality/:slug', componentName: 'PostsSingleSlugWrapper'})

addRoute({ name: 'HPMOR', path: '/hpmor', componentName: 'HPMOR'})
addRoute({ name: 'HPMOR.posts.single', path: '/hpmor/:slug', componentName: 'PostsSingleSlugWrapper'})

addRoute({ name: 'Codex', path: '/codex', componentName: 'Codex'})
addRoute({ name: 'Codex.posts.single', path: '/codex/:slug', componentName: 'PostsSingleSlugWrapper'})


addRoute({ name: 'Meta', path: '/meta', componentName: 'Meta'})
addRoute({ name: 'AllPosts', path: '/allPosts', componentName: 'AllPosts'})
addRoute({ name: 'FeaturedPosts', path: '/featured', componentName: 'FeaturedPostsPage'})
addRoute({ name: 'AllComments', path: '/allComments', componentName: 'AllComments'})


//Route for testing the editor. Useful for debugging
addRoute({ name: 'searchTest', path: '/searchTest', componentName: 'SearchBar'});
addRoute({ name: 'postsListEditorTest', path:'/postsListEditorTest', componentName: 'PostsListEditor'})
addRoute({ name: 'imageUploadTest', path: '/imageUpload', componentName: 'ImageUpload'});

addRoute({ name: 'categories.new', path: '/newCategory', componentName: 'CategoriesNewForm'});
addRoute({ name: 'categories.edit', path: '/editCategory', componentName: 'CategoriesEditForm'});
addRoute({ name: 'categories.all', path: '/allCategories', componentName: 'CategoriesList'});


addRoute({name:'posts.single',   path:'posts/:_id(/:slug)(/:commentId)', componentName: 'PostsSingle'});

addRoute({name: 'home', path: '/', componentName: 'Home'});
