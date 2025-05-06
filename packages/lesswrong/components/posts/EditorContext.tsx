import type { Editor } from '@ckeditor/ckeditor5-core';
import React from 'react';


export const EditorContext = React.createContext<[Editor | null, (e: Editor) => void]>([null, _ => { }]);
