# CKEditor 5 Footnotes
This plugin allows for inserting footnotes in CKEditor 5. This README is aimed at developers, to explain the structure and functionality of this plugin, giving an overview of the code and how it's organized, while also explaining some of the associated subtleties of CKEditor.

## Background, CKEditor ecosystem
### Information Structure
Documents in CKEditor are stored as a tree structure, where each tree node has abstract class `Node`. All `Node`s are either `Element`s or `Text` nodes. All `Text` nodes are leaves in the tree, containing only characters. `Element`s can have child nodes, but don't have to. Both node types can be assigned attributes.

### Positioning
There are two integer measures of location for a given `Node` within its parent: index and offset. A `Node`'s index is the number of sibling nodes (`Element` or `Text`) that occur before it; a `Node`'s offset is the number of `Element` nodes and characters that occur before it. In other words, the only difference is that a `Text` node's `offsetSize` is its character count, while its "index size" is always 1. An `Element` node's `offsetSize` is always 1. This is also to say that a node's children don't contribute to either the offset or index of the node's siblings.

Each `Node` exists at a `Position` in the tree, which specifies its location relative to the root `Element` via a list of offsets.

### Conversion
CKEditor converts data between 3 representations:

1. a model representation, which exists apart from any view layer
2. an editing view representation, which handles the display of content in the editor
3. a data view representation, which is the final HTML output that gets displayed and saved to file

Converting from the model representation to either view representation is called "downcasting", and the reverse is called "upcasting". Augmenting CKEditor functionality is largely a matter of defining custom `Element` types, specifying for each type how it gets converted between the three representations, and using event listeners to add extra functionality to those `Element`s.

In this plugin, the model and view representations connect to one another entirely using a) element types in the downcast direction, and b) element attributes in the upcast direction. I've given each element type a unique attribute of the form `data-name-of-element`, which is solely used for casting.

Note 1: separate converters can be specified for downcasting to each of the two view representations, called `"editingDowncast"` and `"dataDowncast"` converters. For the reverse direction, only one converter exists: upcasting only happens from the data view to the model, i.e. when loading HTML from the database or local storage into CKEditor. All document state during editing is maintained within the model representation directly.

Note 2: Many built-in types in CKEditor have a view version and a model version, including `Element`, `Text`, and `Writer`. I've tried to explicitly alias those types in the code to make clear which version is being used.

Note 3: if an attribute/class isn't showing up on an element, two places to look are the `allowAttributes` property within `schema.js`, and the `sanitizeHtml` method in `packages/lesswrong/server/vulcan-lib/utils.js`. The second one merely affects which attributes/classes/elements can be displayed in posts--it doesn't constrain what gets stored in the database, or what gets upcasted when the editor is reopened.

---
## Footnotes
### Functionality
1. users can create an inline footnote reference via a toolbar button, which automatically inserts a footnote at the bottom of the page with a matching index and id (if one doesn't already exist).
	- references are links to the matching footnote. Footnotes contain backlinks to their reference.
	- users can create multiple references to the same footnote.
2. deleting a footnote deletes its references.
	- deleting a footnote also decrements the index of all subsequent footnotes, filling in the gap. (This also re-indexes its references.)
	- deleting text within a footnote doesn't delete the footnote itself, allowing a 'blank slate' state. Only backspacing within an empty footnote or deleting the entire section of footnote will result in removal.
	- deleting the last footnote automatically deletes the footnote section.
3. users can use markdown syntax (`/\[\^\d+\]/`) to create a footnote reference. This has the same effect as the toolbar button.
	- For simplicity, this only has an effect if the footnote index is valid (i.e. an existing footnote, or the next unused index).
4. footnote references occur in order by index. The first unique reference has index 1, the next 2, etc. Creating a footnote reference out of order triggers a re-indexing.
5. the above operations are atomic w.r.t. undo--a single undo will also revert all auxiliary effects.
	- The markdown case is an exception: here reverting the conversion to a footnote reference without deleting the matched text is valuable for allowing users to enter the literal syntax.

## Elements
The plugin defines the following `Element` types (definitions in `schema.js`, conversion behavior in `converters.js`):

1. `footnoteSection` -a drag-and-droppable widget container that lives at the bottom of the page, housing all footnotes.
2. `footnoteItem` - a footnote itself, displayed as an `li` element that wraps its editable contents. Footnote items have an unchanging alphanumeric id, as well as an index. The index is the only one that's public facing, but the id is necessary for things like reordering and undoing certain batched operations. It also prevents link collisions among multiple documents on the same page, as in the case of posts and comments.
3. `footnoteContent` - an editable section within `footnoteItem`; included because editable `li` tags cause problems, so an extra layer was needed below `footnoteItem`. This element houses 1 or more paragraphs which house the footnote text.
4. `footnoteReference` - an inline citation in the form of a superscript link that navigates to the footnote itself. Has an unchanging alphanumeric id to match its `footnoteItem`, as well as an index that can change from e.g. reorderings.
5. `footnoteBackLink` - a superscript link that lives within each footnote, and takes you back to the first matching `footnoteReference` in the text.

## Implementation
### 1. Footnote creation
- handled by `insertFootnoteCommand.js`. Linked to the toolbar UI via `footnoteUI.js`.
### 2. Multiple references allowed for a given footnote
- within `insertFootnoteCommand.js`, if an existing footnote index is provided, the id and index of that footnote are used for the added reference.
### 3. Deleting a footnote deletes its references
- covered in `footnoteEditing.js`, via the `_handleDelete` method. Updating reference indices is handled via an event listener on the `change:data` event, which is a broad event that includes all updates that affect the model's contents. 
### 4. Allow Markdown syntax
- handled via `autoformatting.js`. Autoformatting is an autocorrect-like plugin that's built-in to CKEditor.
### 5. Reference remain in order
- handled within `footnoteEditing.js`  `_updateReferenceIndices` handles the specific case.
### 6. Operations are atomic
- handled by sharing `Batch` and `Writer` objects, primarily in `footnoteEditing.js`. Basically all changes to the model or the view happen either through converters (mentioned above) or via a `writer.change`/`writer.enqueueChange` method. All changes made by the same `Writer` instance can be undone together, for both `change` and `enqueueChange`. Changes made by different writer instances can be grouped by sharing a `Batch` instance between them, which is merely a collection of operations to be performed on the document.

# Known gaps
### Forbidden Ancestor Descendant Relationships
One thing I tried but gave up on was preventing certain ancestor-descendant relationships (i.e. preventing footnote references within the footer footnote section). `addChildCheck` offers an apparent way to do this, but it's heavily complicated by the way CKEditor inserts nodes. In brief, CKEditor tries very hard to avoid doing nothing when an insertion step should happen, including attempting to insert the node into each ancestor of the original parent, and attempting to insert a new paragraph node at each location to house the new nodes (called autoParagraphing). If you'd like to dive more into this, the `handleNodes` function in `/node_modules/@ckeditor/ckeditor5-engine/src/model/utils/insertcontent.js` is the place to start. (Note that parent-child relationships are much simpler, and can be handled in schema definitions using `allowIn` and `allowChildren`.)
