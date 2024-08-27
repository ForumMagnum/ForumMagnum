import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
// import { ButtonView } from '@ckeditor/ckeditor5-ui';
import TurndownService from 'turndown';


export default class AIAutocomplete extends Plugin {
    static get pluginName() {
        return 'AIAutocomplete';
    }

    init() {
        const editor = this.editor;

        // editor.ui.componentFactory.add('autocompleteButton', () => {
        //     const button = new ButtonView();

        //     button.set({
        //         label: 'AI Autocomplete',
        //         tooltip: true,
        //         withText: true
        //     });

        //     button.on('execute', () => {
        //         this.autocomplete();
        //     });

        //     return button;
        // });

        // Add keyboard shortcut
        editor.editing.view.document.on('keydown', (evt, data) => {            
            // Check for Cmd+E (Mac) or Ctrl+E (Windows/Linux)
            if ((data.ctrlKey || data.metaKey) && data.keyCode === 69) {
                evt.stop();
                this.autocomplete();
            }
        });
    }

    autocomplete() {
        const editor = this.editor;
        const selection = editor.model.document.selection;

        let selectedContent = this.getSelectedContent();

        // Check the current running document and search for the title of the post using the className .form-component-EditTitle
        const titleElement = document.querySelector('.form-component-EditTitle');
        let title = '';
        if (titleElement) {
            title = titleElement.textContent;
            selectedContent = `# ${title}
by habryka
2nd of January 2022
180
${selectedContent}`;
        }

        editor.model.change(writer => {
            const spaceElement = writer.createText(' ');
            editor.model.insertContent(spaceElement, editor.model.document.selection);
        })

        getAutocompletion(selectedContent, (message) => {
            const paragraphs = message.split('\n\n');
            paragraphs.forEach((paragraph, index) => {
                if (index > 0) {
                    editor.commands.execute('enter');
                }
                if (paragraph.trim() === '') {
                    return;
                }
                const lines = paragraph.split('\n');
                lines.forEach((line, index) => {
                    editor.model.change(writer => {
                        if ((lines[index - 1]?.trim() !== '' && index > 0) || line.trim() === '') {
                            writer.insertElement('softBreak', selection.getLastPosition());
                        }
                        writer.insertText(line, selection.getLastPosition());
                    })
                });  
            })
              
        });
    }

    getSelectedContent(): string {
        const selection = this.editor.model.document.selection;
        let content = '';

        if (selection.isCollapsed) {
            // If no text is selected, get the entire document content up
            content = this.editor.getData();
        } else {
            // Get the selected content
            const selectedContent = this.editor.model.getSelectedContent(selection);
            const viewFragment = this.editor.data.toView(selectedContent);
            content = this.editor.data.processor.toData(viewFragment);
        }

        // Convert the HTML into markdown
        const turnDownService = new TurndownService();
        return turnDownService.turndown(content);
    }
}

const getReplyingCommentId = () => {
    // Get the text field that is currently selected
    const currentlySelectedTextField = document.activeElement;

    // Then find the closest parent element with the class name 'comment-node'
    const replyingToCommentNode = currentlySelectedTextField.closest('.comments-node');

    // Get the comment id from the id attribute
    return replyingToCommentNode?.id;
}

async function getAutocompletion(prefix: string, onCompletion: (completion: string) => void) {
    // Get the id of the comment we are replying to from the DOM
    const replyingCommentId = getReplyingCommentId();

    const response = await fetch('/api/autocomplete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            prefix,
            commentIds: JSON.parse(localStorage.getItem("selectedTrainingComments") || "[]"),
            postIds: JSON.parse(localStorage.getItem("selectedTrainingPosts") || "[]"),
            replyingCommentId
        }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        let boundary;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
            const line = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);

            if (line.startsWith('data: ')) {
                try {
                    const data = JSON.parse(line.slice(6));
                    switch (data.type) {
                        case 'text':
                            console.log('Received text:', data.content);
                            onCompletion(data.content);
                            break;
                        case 'end':
                            console.log('Stream ended');
                            // Handle stream end in your UI
                            return;
                        case 'error':
                            console.error('Stream error:', data.message);
                            // Handle error in your UI
                            return;
                    }
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                }
            }
        }
    }
    // Handle any remaining data in the buffer
    if (buffer.startsWith('data: ')) {
        try {
            const data = JSON.parse(buffer.slice(6));
            if (data.type === 'text') {
                console.log('Received text:', data.content);
                onCompletion(data.content);
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    }
}