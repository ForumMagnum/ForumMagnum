import type { Editor } from 'ckeditor5';
import React from 'react';


export const EditorContext = React.createContext<[Editor | null, (e: Editor) => void]>([null, _ => { }]);
