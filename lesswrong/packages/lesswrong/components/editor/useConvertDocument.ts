import { EditorContents, EditorTypeString, deserializeEditorContents, serializeEditorContents } from './Editor';
import { useLazyQuery, gql } from '@apollo/client';

export function useConvertDocument({onCompleted}: {
  onCompleted: (result: EditorContents) => void,
}): {
  convertDocument: (contents: EditorContents, targetFormat: EditorTypeString) => void,
  loading: boolean,
  error?: any,
} {
  const [convertDocument, {loading, error, data}] = useLazyQuery(gql`
    query ConvertDocument($document: JSON, $targetFormat: String) {
      convertDocument(document: $document, targetFormat: $targetFormat)
    }
  `, {
    onCompleted: (data) => {
      const result = deserializeEditorContents(data.convertDocument);
      if (result) {
        onCompleted(result);
      } else {
        // eslint-disable-next-line no-console
        console.error("Error converting document");
      }
    }
  });
  
  return {
    convertDocument: (doc: EditorContents, targetFormat: EditorTypeString) => {
      convertDocument({
        variables: {
          document: serializeEditorContents(doc),
          targetFormat: targetFormat,
        }
      });
    },
    loading, error
  }
};
