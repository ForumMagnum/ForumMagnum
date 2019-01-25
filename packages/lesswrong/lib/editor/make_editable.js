import Users from 'meteor/vulcan:users'
import { Utils, GraphQLSchema } from 'meteor/vulcan:core'
import { ContentType } from '../collections/revisions/schema'
import SimpleSchema from 'simpl-schema'

const RevisionStorageType = new SimpleSchema({
  revisionId: {type: String, optional: true},
  canonicalContent: {type: ContentType, optional: true},
  userId: {type: String, optional: true},
  html: {type: String, optional: true},
  updateType: {type: String, optional: true, allowedValues: ['initial', 'patch', 'minor', 'major']},
  version: {type: String, optional: true},
  editedAt: {type: Date, optional: true}
})

SimpleSchema.extendOptions([ 'inputType' ]);

const defaultOptions = {
  // Determines whether to use the comment editor configuration (e.g. Toolbars)
  commentEditor: false,
  // Determines whether to use the comment editor styles (e.g. Fonts)
  commentStyles: false,
  // Determines whether to use the comment local storage restoration system
  commentLocalStorage: false,
  permissions: {
    viewableBy: ['guests'],
    editableBy: [Users.owns, 'sunshineRegiment', 'admins'],
    insertableBy: ['members']
  },
  fieldName: "",
  order: 0,
  enableMarkDownEditor: true
}


export const makeEditable = ({collection, options = {}}) => {
  options = {...defaultOptions, ...options}
  const {
    commentEditor,
    commentStyles,
    getLocalStorageId,
    formGroup,
    adminFormGroup,
    permissions,
    fieldName = "",
    order,
    enableMarkDownEditor
  } = options

  collection.addField([
    { 
      fieldName: fieldName || "content",
      fieldSchema: {
        type: RevisionStorageType,
        inputType: 'UpdateRevisionDataInput',
        optional: true,
        viewableBy: ['guests'],
        editableBy: ['members'],
        insertableBy: ['members'],
        group: formGroup,
        ...permissions,
        order,
        control: 'EditorFormComponent',
        resolveAs: {
          type: 'Revision',
          arguments: 'version: String',
          resolver: async (doc, { version }, { Revisions }) => {
            const field = fieldName || "content"
            if (version) {
              return await Revisions.findOne({documentId: doc._id, version, fieldName: field})
            }
            return {
              editedAt: doc[field] && doc[field].editedAt || new Date(),
              userId: doc[field] && doc[field].userId || 'asdf',
              canonicalContentType: doc[field] && doc[field].canonicalContentType || 'html',
              canonicalContent: doc[field] && doc[field].canonicalContent || {},
              html: doc[field] && doc[field].html || "html",
              updateType: doc[field] && doc[field].updateType,
              version: doc[field] && doc[field].version
            }
          }
        },
        form: {
          hintText:"Plain Markdown Editor",
          multiLine:true,
          fullWidth:true,
          disableUnderline:true,
          fieldName: fieldName || "content",
          commentEditor,
          commentStyles,
          getLocalStorageId,
          enableMarkDownEditor,
        },
      },
    },
    {
      fieldName: Utils.camelCaseify(`${fieldName}Revisions`),
      fieldSchema: {
        type: Object,
        viewableBy: ['guests'],
        optional: true,
        resolveAs: {
          type: '[Revision]',
          arguments: 'limit: Int = 5',
          resolver: async (post, { limit }, { currentUser, Revisions }) => {
            const { checkAccess } = Revisions
            const field = fieldName || "content"
            const resolvedDocs = await Revisions.find({documentId: post._id, fieldName: field}, {sort: {editedAt: -1}, limit}).fetch()
            const filteredDocs = checkAccess ? _.filter(resolvedDocs, d => checkAccess(currentUser, d)) : resolvedDocs
            const restrictedDocs = Users.restrictViewableFields(currentUser, Revisions, filteredDocs)
            return restrictedDocs
          }
        }
      }
    },
    // /**
    //   Draft-js content
    // */
    // {
    //   fieldName: Utils.camelCaseify(`${fieldName}Content`),
    //   fieldSchema: {
    //     type: Object,
    //     optional: true,
    //     ...permissions,
    //     control: 'EditorFormComponent',
    //     blackbox: true,
    //     group: formGroup,
    //     hidden: true,
    //     order,
    //     form: {
          // hintText:"Plain Markdown Editor",
          // multiLine:true,
          // fullWidth:true,
          // disableUnderline:true,
          // fieldName: fieldName,
          // commentEditor,
          // commentStyles,
          // getLocalStorageId,
          // enableMarkDownEditor,
    //     },
    //   }
    // },

    /**
      Html Body field, made editable to allow access in edit form
    */
    {
      fieldName: Utils.camelCaseify(`${fieldName}HtmlBody`),
      fieldSchema: {
        type: String,
        optional: true,
        viewableBy: ['guests'],
        editableBy: ['admins'],
        insertableBy: ['admins'],
        control: "textarea",
        group: adminFormGroup,
        hidden: !adminFormGroup, // Only display htmlBody if admin form group is given
      }
    },

    /*
      body: Stores a markdown version of the post
    */

    {
      fieldName: Utils.camelCaseify(`${fieldName}Body`),
      fieldSchema: {
        type: String,
        viewableBy: ['guests'],
        insertableBy: ['members'],
        editableBy: ['members'],
        control: "textarea",
        optional: true,
        hidden: true,
        max: 1000000, //overwriting Vulcan's character limit
      }
    },

    /*
      htmlHighlight: stores an HTML highlight of an HTML body
    */

    {
      fieldName: Utils.camelCaseify(`${fieldName}HtmlHighlight`),
      fieldSchema: {
        type: String,
        optional: true,
        hidden:true,
        viewableBy: ['guests'],
      }
    },

    /*
      wordCount: count of words
    */

    {
      fieldName: Utils.camelCaseify(`${fieldName}WordCount`),
      fieldSchema: {
        type: Number,
        viewableBy: ['guests'],
        optional: true,
        hidden:true
      }
    },

    /*
      plaintextExcerpt: Version of the excerpt that is plaintext, used for the description head tags which are
      used by Facebook and Google to extract previews of content.
    */

    {
      fieldName: Utils.camelCaseify(`${fieldName}PlaintextExcerpt`),
      fieldSchema: {
        type: String,
        viewableBy: ['guests'],
        hidden: true,
        optional: true
      }
    },

    /*
      lastEditedAs: Records whether the post was last edited in HTML, Markdown or Draft-JS, and displays the
      appropriate editor when being edited, overwriting user-preferences
    */

    {
      fieldName: Utils.camelCaseify(`${fieldName}LastEditedAs`),
      fieldSchema: {
        type: String,
        viewableBy: ['guests'],
        insertableBy: ['members'],
        editableBy: ['members'],
        optional: true,
        hidden: true,
        group: adminFormGroup,
      }
    },
  ])
}
