// @ts-check

import { Command } from '@ckeditor/ckeditor5-core'
import { ELEMENTS } from './constants'

export default class InsertBinaryQuestionCommand extends Command {
    constructor(editor) {
        super(editor)
    }

    refresh() {
        this.isEnabled = true
    }

    createNewQuestion(title, resolvesBy) {
        return "1234"
    }

    execute( title, resolvesBy ) {
        this.editor.model.change(writer => {
            const root = this.editor.model.document.getRoot();
            if (!root) return
            const questionId = this.createNewQuestion(title, resolvesBy)
            const attributes = {
                'data-elicit-id': questionId,
                style: "position:relative;height:50px;background-color: rgba(0,0,0,0.05);display: flex;justify-content: center;align-items: center;",
                "class": "elicit-binary-prediction",
            }
            const binaryQuestion = writer.createElement(ELEMENTS.binaryQuestion, attributes)

            console.log(binaryQuestion, root)
            writer.append(binaryQuestion, root)

            // binaryQuestion._appendChild(title)
            // this.editor.model.insertContent(binaryQuestion)
            // writer.setSelection(binaryQuestion, 'on')
            alert(`hi Robert. I hope you like my question ${title}. I can't wait until ${resolvesBy} when we find out what the answer is!`)
        })
    }
}
