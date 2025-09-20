import { EditorContents, EditorTypeString, deserializeEditorContents, serializeEditorContents } from './Editor';
import { useLazyQuery } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';

export function useConvertDocument({onCompleted}: {
  onCompleted: (result: EditorContents) => void,
}): {
  convertDocument: (contents: EditorContents, targetFormat: EditorTypeString) => void,
  loading: boolean,
  error?: any,
} {
  const [convertDocument, {loading, error, data}] = useLazyQuery(gql(`
    query ConvertDocument($document: JSON, $targetFormat: String) {
      convertDocument(document: $document, targetFormat: $targetFormat)
    }
  `));
  
  return {
    convertDocument: async (doc: EditorContents, targetFormat: EditorTypeString) => {
      const { data } = await convertDocument({
        variables: {
          document: serializeEditorContents(doc),
          targetFormat: targetFormat,
        }
      });
      const result = data?.convertDocument && deserializeEditorContents(data.convertDocument);
      if (result) {
        onCompleted(result);
      } else {
        // eslint-disable-next-line no-console
        console.error("Error converting document");
      }
    },
    loading, error
  }
};
