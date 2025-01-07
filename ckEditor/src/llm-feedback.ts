import Command from '@ckeditor/ckeditor5-core/src/command';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import TurndownService from 'turndown';

interface FeedbackResponse {
    edits: { originalText: string, reasoning?: string, suggestedEdit: string }[];
    comments: { originalText: string, comment: string }[];
}

class GetFeedbackCommand extends Command {
    execute({ userPrompt, afterLlmRequestCallback }: { userPrompt: string, afterLlmRequestCallback: () => Promise<void> }) {
        const controller = new AbortController();
        return {
            abort: () => controller.abort(),
            request: this.getFeedback(controller, userPrompt, afterLlmRequestCallback)
        };
    }

    async getFeedback(abortController: AbortController, userPrompt: string, afterLlmRequestCallback: () => Promise<void>) {
        try {
            const content = this.getDocumentContent();
            
            const response = await fetch('/api/getLlmFeedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content, prompt: userPrompt }),
                signal: abortController.signal,
            });

            if (!response.ok) {
                throw new Error('Get LLM feedback request failed');
            }

            const { edits, comments }: FeedbackResponse = await response.json();

            await afterLlmRequestCallback();

            const { model } = this.editor;

            // Add each suggestion
            for (const suggestion of [...edits, ...comments]) {
                const { originalText } = suggestion;
            
                model.change(writer => {
                    writer.setSelection(model.document.getRoot(), 0);
                });

                const found = (window as any).find(originalText);
                if (!found) {
                    console.error('Could not find original text in document', { originalText });
                    continue;
                }

                this.editor.execute('trackChanges');

                // sleep for 100 ms to allow the selection to be set
                await new Promise(resolve => setTimeout(resolve, 100));

                if ('suggestedEdit' in suggestion) {
                    const { suggestedEdit } = suggestion;

                    model.change(writer => {
                        const text = writer.createText(suggestedEdit);
                        model.insertContent(text, model.document.selection.getFirstRange());
                    });
                } else {
                    const { comment } = suggestion;

                    model.change(writer => {
                        const text = writer.createText(`[Claude comment: ${comment}]`);
                        model.insertContent(text, model.document.selection.getLastPosition(), 'end');
                    });
                }

                this.editor.execute('trackChanges');
            }
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

export default class LLMFeedback extends Plugin {
    static get pluginName() {
        return 'LLMFeedback';
    }

    init() {
        const editor = this.editor;

        editor.commands.add('getLLMFeedback', new GetFeedbackCommand(editor));
    }
}
