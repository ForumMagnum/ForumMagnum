# Suggested Edits Feature Design

## Overview

The Suggested Edits feature allows collaborators to propose changes to a document without directly modifying its content. This enables a review workflow where document owners can evaluate proposed changes before accepting or rejecting them—similar to "Track Changes" in Microsoft Word or "Suggesting" mode in Google Docs.

## User Roles and Permissions

### Editor
- Can edit the document directly
- Can switch between Editing and Suggesting modes
- Can accept or reject any suggestion
- Can make suggestions when in Suggesting mode

### Suggester (Collaborator without edit access)
- Cannot edit the document directly
- Is always in Suggesting mode
- Can only make suggestions
- Can reject their own suggestions
- Cannot accept suggestions or reject others' suggestions

### Viewer
- Can read the document and see suggestions
- Cannot make, accept, or reject suggestions

## Editing Modes

### Editing Mode
When in Editing mode, changes are applied directly to the document. This is the default mode for users with edit permissions.

### Suggesting Mode
When in Suggesting mode, all changes become suggestions rather than direct edits:
- Typed text becomes an **insertion suggestion**
- Deleted content becomes a **deletion suggestion**
- Selected content that is replaced becomes a **replacement suggestion** (combination of deletion + insertion)

Users toggle between modes using a button in the editor toolbar.

## Types of Suggestions

### Insertion
Proposed new content to be added to the document. Visually distinguished (e.g., colored text with underline) to indicate it's not yet part of the accepted content.

### Deletion
Proposed removal of existing content. The content remains visible but is styled to indicate proposed deletion (e.g., strikethrough with different color).

### Replacement
A combination of deletion and insertion at the same location. Shows both:
- The original content marked for deletion
- The proposed new content marked as an insertion

## Supported Content Types

Suggestions support the full range of content that the editor supports, not just plain text:

### Text and Formatting
- Plain text insertions and deletions
- Bold, italic, underline, strikethrough, and other inline formatting
- Links and mentions
- Code spans and syntax highlighting
- Etc.

### Block-Level Content
- Paragraphs and headings
- Bulleted, numbered, and checkbox lists
- Block quotes
- Code blocks
- Horizontal rules
- Etc.

### Rich Media and Custom Elements
- Images (with captions)
- Embedded content
- Tables (including structural changes like adding/removing rows and columns)
- Collapsible sections
- Footnotes
- Math equations
- Polls
- Any custom node types registered with the editor

### Structural Changes
- Converting between block types (e.g., paragraph to heading)
- Indentation changes
- List nesting modifications
- Table structure modifications
- Etc.

## Visual Presentation

Suggestions are displayed inline within the document:
- **Insertions**: Highlighted with a distinct background color and/or underline
- **Deletions**: Shown with strikethrough styling and muted color
- **Replacements**: Show the deletion immediately followed by the insertion
- **Block-level suggestions**: May include a colored border or background to clearly delineate the suggested block

Each suggestion is associated with metadata including:
- Author name
- Timestamp
- Unique identifier for tracking

## Suggestion Resolution

### Accepting a Suggestion
- **Insertion**: The proposed content becomes permanent document content
- **Deletion**: The marked content is removed from the document
- **Replacement**: The original content is removed and replaced with the new content

### Rejecting a Suggestion
- **Insertion**: The proposed content is removed
- **Deletion**: The content remains in the document unchanged
- **Replacement**: The original content is restored; the proposed replacement is discarded

## Comments Integration

Each suggestion automatically generates a comment thread that appears in the comments panel. This allows:
- Discussion about the proposed change
- Context for why the suggestion was made
- Accept/Reject buttons within the comment thread UI
- Thread is archived when the suggestion is resolved

The comment thread includes an auto-generated description of the suggestion (e.g., "Suggested replacement: 'old text' → 'new text'").

## Collaborative Editing

When multiple users are editing simultaneously:
- Suggestions sync in real-time across all connected clients
- Each user sees all pending suggestions from all authors
- Suggestion resolution (accept/reject) syncs immediately
- Users can undo/redo their own suggestion-related actions

## Undo/Redo Behavior

The undo/redo system treats suggestions as regular document operations:
- Creating a suggestion can be undone
- Accepting or rejecting a suggestion can be undone
- Undo restores the previous suggestion state

## Edge Cases

### Editing Within Own Insertion
When a user is in Suggesting mode and their cursor is inside their own pending insertion suggestion, typing or deleting modifies that insertion directly rather than creating nested suggestions.

### Overlapping Suggestions
The system prevents creating suggestions that would overlap or nest within existing suggestions from other users.

### Empty Suggestions
If a suggestion is edited to have no content (e.g., all inserted content is deleted), the suggestion wrapper is automatically removed.

### Complex Content Suggestions
When suggesting changes to complex content like tables or embedded media:
- The entire element is wrapped in the suggestion
- Accept/reject applies to the whole element
- Partial acceptance of complex structures is not supported

