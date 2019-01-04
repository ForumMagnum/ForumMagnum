import Users from 'meteor/vulcan:users'
import { Utils, GraphQLSchema } from 'meteor/vulcan:core'
import SimpleSchema from 'simpl-schema'

let ContentType = new SimpleSchema({
    canonicalContentType: {
      type: String,
    },
    canonicalContent: {
      type: Object,
      blackbox: true, 
    },
    html: {
      type: String,
    },
    markdown: {
      type: String,
    },
    draftJs: {
      type: String,
      resolveAs: {
        type: 'String',
        resolver: () => {
          return "draftJS"
        }
      }
    },
})


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

const customSchema = `
  type ContentType {
    canonicalContentType: String
    canonicalContent: JSON
    html: String
    markdown: String
    draftJs: String
  }
`;
GraphQLSchema.addSchema(customSchema);

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
    // LESSWRONG: TEST STUFF, DO NOT COMMIT
    {
      fieldName: 'testField',
      fieldSchema: {
        type: ContentType,
        optional: true,
        resolveAs: {
          type: 'ContentType',
          resolver: (document, args, context) => {
            return {
              canonicalContentType: 'String',
              canonicalContent: 'Object',
              html: 'String',
              markdown: 'String',
            }
          }
        }
      }
    },

    /**
      Draft-js content
    */
    {
      fieldName: Utils.camelCaseify(`${fieldName}Content`),
      fieldSchema: {
        type: Object,
        optional: true,
        ...permissions,
        control: 'EditorFormComponent',
        blackbox: true,
        group: formGroup,
        order,
        form: {
          hintText:"Plain Markdown Editor",
          multiLine:true,
          fullWidth:true,
          disableUnderline:true,
          fieldName: fieldName,
          commentEditor,
          commentStyles,
          getLocalStorageId,
          enableMarkDownEditor,
        },
      }
    },

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
