import Telescope from 'meteor/nova:lib';
import MoviesWrapper from './components/MoviesWrapper.jsx';

Telescope.routes.indexRoute = { name: 'movies', component: MoviesWrapper };
