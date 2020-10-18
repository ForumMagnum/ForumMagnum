import { addEditableCallbacks } from '../editor/make_editable_callbacks';
import { Collections, makeEditableOptions } from '../../lib/collections/collections/collection'

addEditableCallbacks({collection: Collections, options: makeEditableOptions})
