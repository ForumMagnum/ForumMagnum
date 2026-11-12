import { Plugin, ButtonView, IconAddComment as commentIcon } from 'ckeditor5';

export default class RestyledCommentButton extends Plugin {
  init() {
    const editor = this.editor;

    editor.ui.componentFactory.add('restyledCommentButton', locale => {
      const view = new ButtonView(locale);
      
      view.set({
        label: 'Comment',
        icon: commentIcon,
        tooltip: true,
        withText: true,
        keystroke: 'CTRL+ALT+M',
        withKeystroke: true
      });
      
      // Callback executed once the image is clicked.
      view.on('execute', () => {
        editor.execute('addCommentThread');
      });
      
      return view;
    });
  }
  
  static get pluginName() {
    return 'RestyledCommentButton';
  }
}

