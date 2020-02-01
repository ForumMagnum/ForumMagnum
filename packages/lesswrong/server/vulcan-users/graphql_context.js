import { addToGraphQLContext } from 'meteor/vulcan:lib';
import Users from '../../lib/collections/users/collection';

addToGraphQLContext({ getViewableFields: Users.getViewableFields });
