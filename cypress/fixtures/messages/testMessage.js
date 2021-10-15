module.exports = {
    _id : "test-seeded-message",
    conversationId : "test-seeded-conversation",
    createdAt: new Date(),
    contents : {
        originalContents : {
            type : "ckEditorMarkup",
            data : "<p>Test seeded message</p>"
        },
        editedAt: new Date(),
        updateType : "initial",
        commitMessage : "",
        html : "<p>Test seeded message</p>",
        version : "1.0.0",
        userId : "test-other-user",
        wordCount : 3
    },
    userId : "test-other-user",
    noEmail : false,
    schemaVersion : 1
}  
