import { addEditableCallbacks } from '../../../server/editor/make_editable_callbacks.js'
import Messages, { makeEditableOptions } from './collection.js'

addEditableCallbacks({collection: Messages, options: makeEditableOptions})
