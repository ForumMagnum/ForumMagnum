import { addToGraphQLContext } from '../vulcan-lib';
import Users from '../../lib/collections/users/collection';

addToGraphQLContext({ getViewableFields: Users.getViewableFields });
