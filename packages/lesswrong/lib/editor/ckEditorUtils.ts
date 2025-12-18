export const getCKEditorDocumentId = (documentId: string|undefined, userId: string|undefined, formType: string|undefined) => {
  if (documentId) return `${documentId}-${formType}`
  return `${userId}-${formType}`
}
