
export const getCKEditorDocumentId = (documentId, userId, formType) => {
  if (documentId) return `${documentId}-${userId}-${formType}`
  return `${userId}-${formType}`
}