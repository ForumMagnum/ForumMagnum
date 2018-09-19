const defaultOptions = {
  // Determines whether to use the comment editor configuration (e.g. Toolbars)
  commentEditor: false,
  // Determines whether to use the comment editor styles (e.g. Fonts)
  commentStyles: false,
  // Determines whether to use the comment local storage restoration system
  commentLocalStorage: false,
  permissions: {
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members']
  },
  fieldName: "",
  order: 0,
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
    fieldName,
    order,
  } = options

  collection.addField([
    /**
      Draft-js content
    */
    {
      fieldName: `${fieldName}content`,
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
          commentEditor,
          commentStyles,
          getLocalStorageId
        },
      }
    },

    /**
      Html Body field, made editable to allow access in edit form
    */
    {
      fieldName: `${fieldName}htmlBody`,
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
      fieldName: `${fieldName}body`,
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
      fieldName: `${fieldName}htmlHighlight`,
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
      fieldName: `${fieldName}wordCount`,
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
      fieldName: `${fieldName}plaintextExcerpt`,
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
      fieldName: `${fieldName}lastEditedAs`,
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
  if (Meteor.isServer) {
    import('../../server/editor/make_editable_callbacks.js').then(({addEditableCallbacks}) => {
      addEditableCallbacks({collection, options})
    })
  }
}
