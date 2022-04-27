module.exports = {
    _id : "test-seeded-message",
    conversationId : "test-seeded-conversation",
    createdAt: new Date(),
    contents : {
        originalContents : {
            type : "ckEditorMarkup",
            data : "Test seeded message"
        },
        editedAt: new Date(),
        updateType : "initial",
        commitMessage : "",
        html : "Test seeded message",
        version : "1.0.0",
        userId : "test-other-user",
        wordCount : 3
    },
    userId : "test-other-user",
    noEmail : false,
    schemaVersion : 1
}
