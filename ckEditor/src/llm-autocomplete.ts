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
            // Check for Ctrl+Y (Windows/Linux)
            if ((data.ctrlKey) && !data.shiftKey && data.keyCode === 89) {
                evt.stop();
                this.autocomplete();
                
            }
        });

        editor.editing.view.document.on('keydown', (evt, data) => {            
            // Check for Ctrl+Shift+Y (Windows/Linux)
            if ((data.ctrlKey) && data.shiftKey && data.keyCode === 89) {
                evt.stop();
                this.autocomplete405b();
            }
        });
    }

    getPrefix = () => {
        const editor = this.editor;
        const selection = editor.model.document.selection;

        let selectedContent = this.getSelectedContent();

        // Check the current running document and search for the title of the post using the className .form-component-EditTitle
        const titleElement = document.querySelector('.form-component-EditTitle');
        const userNameElement = document.querySelector('.UsersMenu-userButtonContents');

        let title = '';
        if (titleElement) {
            title = titleElement.textContent;
            selectedContent = `# ${title}
by ${userNameElement?.textContent}
${new Date().toDateString()}
${50 + Math.floor(Math.random() * 100)}
${selectedContent}`;
        }
        return selectedContent
    }

    insertMessage(message: string) {
        const editor = this.editor;
        const selection = editor.model.document.selection;
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
    }

    autocomplete() {
        const selectedContent = this.getPrefix();
        const editor = this.editor;

        editor.model.change(writer => {
            const spaceElement = writer.createText(' ');
            editor.model.insertContent(spaceElement, editor.model.document.selection);
        })

        getAutocompletion(selectedContent, x => this.insertMessage(x));
    }

    autocomplete405b() {
        const selectedContent = this.getPrefix();
        const editor = this.editor;

        editor.model.change(writer => {
            const spaceElement = writer.createText(' ');
            editor.model.insertContent(spaceElement, editor.model.document.selection);
        })

        get405bCompletion(selectedContent, x => this.insertMessage(x));
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
        // Override turndown escape rules to never escape characters
        turnDownService.escape = (string: string) => string;
        return turnDownService.turndown(content);
    }
}

const getReplyingCommentId = (): string | undefined => {
    // Get the text field that is currently selected
    const currentlySelectedTextField = document.activeElement;

    // Then find the closest parent element with the class name 'comment-node'
    const replyingToCommentNode = currentlySelectedTextField.closest('.CommentFrame-node');

    // Get the comment id from the id attribute
    return replyingToCommentNode?.id;
}

const getPostId = (): string | undefined => {
    // The URL for post pages is in the format /posts/:postId/:postSlug
    const postId = window.location.pathname.split('/')[2];
    // Check if the postId is the right shape (HbkNAyAoa4gCnuzwa)
    console.log({postId});
    if (postId && postId.length === 17) {
        return postId;
    }
    return undefined;
}

async function handleStream(stream: ReadableStream, onMessage: (message: any) => void) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // eslint-disable-next-line no-constant-condition
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
                    console.log('Received text:', data);
                    onMessage(data);
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                }
            }
        }
    }
}

async function getAutocompletion(prefix: string, onCompletion: (completion: string) => void) {
    // Get the id of the comment we are replying to from the DOM
    const replyingCommentId = getReplyingCommentId();
    const postId = getPostId();
    const selectedTrainingUserId = JSON.parse(localStorage.getItem("selectedTrainingUserId") || "null");

    const response = await fetch('/api/autocomplete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            prefix,
            commentIds: JSON.parse(localStorage.getItem("selectedTrainingComments") || "[]"),
            postIds: JSON.parse(localStorage.getItem("selectedTrainingPosts") || "[]"),
            replyingCommentId,
            postId,
            userId: selectedTrainingUserId ? selectedTrainingUserId : undefined,
        }),
    });

    handleStream(response.body, (data: any) => onCompletion(data.content));
}

async function get405bCompletion(prefix: string, onCompletion: (completion: string) => void) {
    // Get the id of the comment we are replying to from the DOM
    const replyingCommentId = getReplyingCommentId();
    const postId = getPostId();
    const selectedTrainingUserId = JSON.parse(localStorage.getItem("selectedTrainingUserId") || "null");

    const response = await fetch('/api/autocomplete405b', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            prefix,
            commentIds: JSON.parse(localStorage.getItem("selectedTrainingComments") || "[]"),
            postIds: JSON.parse(localStorage.getItem("selectedTrainingPosts") || "[]"),
            replyingCommentId,
            postId,
            userId: selectedTrainingUserId ? selectedTrainingUserId : undefined,
        }),
    });

    handleStream(response.body, (data: any) => onCompletion(data?.choices[0]?.text));
}
