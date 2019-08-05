import { addToGraphQLContext } from 'vulcan:lib';
import Users from '../modules/index.js';

addToGraphQLContext({ getViewableFields: Users.getViewableFields });
