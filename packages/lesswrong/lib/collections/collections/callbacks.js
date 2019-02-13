import { addEditableCallbacks } from '../../../server/editor/make_editable_callbacks.js';
import { Collections, makeEditableOptions } from './collection.js'

addEditableCallbacks({collection: Collections, options: makeEditableOptions})