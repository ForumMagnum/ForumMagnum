
export function isMissingDocumentError(error: any): boolean {
  return (error && error.message==='app.missing_document');
}
