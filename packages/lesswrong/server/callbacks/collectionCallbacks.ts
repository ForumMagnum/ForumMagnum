import { addEditableCallbacks } from '../editor/make_editable_callbacks.js';
import { Collections, makeEditableOptions } from '../../lib/collections/collections/collection'

addEditableCallbacks({collection: Collections, options: makeEditableOptions})
