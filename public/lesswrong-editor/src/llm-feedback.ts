import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import TurndownService from 'turndown';
import CommentsRepository from '@ckeditor/ckeditor5-comments/src/comments/commentsrepository';
import Rect from '@ckeditor/ckeditor5-utils/src/dom/rect';
import { Editor } from '@ckeditor/ckeditor5-core';
import { Position, Range as CKEditorRange, Element } from '@ckeditor/ckeditor5-engine';

/**
 * Maps a character offset to a Position in the model.
 * @param {number} offset - The character offset.
 * @returns {Position} - The corresponding Position in the model.
 */
function getPositionAtOffset(editor: Editor, offset: number): Position {
    const model = editor.model;
    let currentOffset = 0;
    let position = null;

    // Recursive function to traverse the model tree
    function traverse(node: Element) {
        for (const child of node.getChildren()) {
            if (child.is('$text')) {
                const textLength = child.data.length;
                if (currentOffset + textLength >= offset) {
                    position = model.createPositionAt(child, offset - currentOffset);
                    return true; // Position found
                }
                currentOffset += textLength;
            } else {
                // For non-text nodes, traverse their children
                if (child.is('element') && traverse(child)) {
                    return true;
                }
            }
        }
        return false;
    }

    traverse(model.document.getRoot());

    // If offset exceeds the document length, set position to end
    if (!position) {
        position = model.createPositionAt(model.document.getRoot(), 'end');
    }

    return position;
}

function createRangeFromOffsets(editor: Editor, start: number, end: number): CKEditorRange {
    const startPosition = getPositionAtOffset(editor, start);
    const endPosition = getPositionAtOffset(editor, end);
    return new CKEditorRange(startPosition, endPosition);
}


export default class LLMFeedback extends Plugin {
    static get requires() {
        return [CommentsRepository];
    }

    static get pluginName() {
        return 'LLMFeedback';
    }

    init() {
        const editor = this.editor;
        const commentsRepository = editor.plugins.get('CommentsRepository');

        // Add keyboard shortcut (Cmd + Option + L)
        editor.editing.view.document.on('keydown', (evt, data) => {
            if ((data.metaKey || data.ctrlKey) && data.altKey && data.keyCode === 76) {
                evt.stop();
                this.getFeedback(commentsRepository);
            }
        });
    }

    async getFeedback(commentsRepository: CommentsRepository) {
        try {
            const content = this.getDocumentContent();
            
            // const response = await fetch('/api/getLlmFeedback', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({ content }),
            // });

            // if (!response.ok) {
            //     throw new Error('Get LLM feedback request failed');
            // }

            // const suggestions = await response.json();

            const suggestions = [{ comment: "This is a test comment", range: { start: 0, end: 10 } }];

            const { model, editing, conversion } = this.editor;
            
            // Add each suggestion as a comment thread
            suggestions.forEach(async (suggestion: {
                comment: string,
                range: { start: number, end: number },
            }) => {
                const { comment, range: { start, end } } = suggestion;
                // const range = model.createRange(
                //     model.createPositionAt(model.document.getRoot(), start),
                //     model.createPositionAt(model.document.getRoot(), end)
                // );

                const testSearchString = `We've just launched`;

                model.change(writer => {
                    writer.setSelection(model.document.getRoot(), 0);
                    // writer.setSelectionFocus(model.document.getRoot(), 0);
                });

                const found = (window as any).find(testSearchString);
                if (!found) {
                    return;
                }

                // sleep for 100 ms to allow the selection to be set
                await new Promise(resolve => setTimeout(resolve, 100));

                const ranges = Array.from(model.document.selection.getRanges());
                const range = ranges[0];

                console.log({ ranges });
    
                console.log(`Mapped range: Start - [${range.start.path.join('.')}, ${range.start.offset}], End - [${range.end.path.join('.')}, ${range.end.offset}]`);
    
                // Validate range is not collapsed
                if (range.isCollapsed) {
                    console.warn(`Collapsed range detected: start=${start}, end=${end}`);
                    return;
                }
    
                const threadId = `llm-feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                conversion.for('editingDowncast').markerToHighlight({
                    model: threadId,
                    view: {
                        classes: 'comment',

                        // classes: 'llm-feedback-highlight',

                        // priority: 100
                    }
                });

                // Create the comment thread marker in the model
                model.change(writer => {
                    writer.addMarker(threadId, {
                        range,
                        usingOperation: true,
                        affectsData: true
                    });
                });

                // this.editor.execute('addCommentThread', { target: { start: { path: [0, 0], offset: 0 }, end: { path: [0, 0], offset: 10 } } })

                // Get the visual target rect for the comment thread highlight
                const target = () => {
                    const marker = model.markers.get( threadId );

                    if ( !marker ) {
                        return null;
                    }

                    // Map the model range to a view range.
                    const viewRange = editing.mapper.toViewRange( marker.getRange() );

                    if ( !viewRange ) {
                        return null;
                    }

                    // Convert the view range to a DOM range.
                    const domConverter = editing.view.domConverter;
                    const domRange = domConverter.viewRangeToDom( viewRange );

                    if ( !domRange ) {
                        return null;
                    }

                    const rects = Rect.getDomRangeRects(domRange);
                    console.log(`Rects: ${JSON.stringify(rects)}`);
                    return rects;
                };

                // commentsRepository.openNewCommentThread({
                //     threadId,
                //     comments: [{
                //         commentId: `comment-${Date.now()}`,
                //         content: comment,
                //         authorId: 'LLM-Feedback',
                //         createdAt: new Date(),
                //         attributes: {}
                //     }],
                //     channelId: 'llm-feedback',
                //     target,
                // });
            });

        } catch (error) {
            console.error('Error when getting LLM feedback:', error);
        }
    }

    getDocumentContent(): string {
        const content = this.editor.getData();
        
        // Convert the HTML into markdown
        const turnDownService = new TurndownService();
        // Override turndown escape rules to never escape characters
        turnDownService.escape = (string: string) => string;
        return turnDownService.turndown(content);
    }
}
