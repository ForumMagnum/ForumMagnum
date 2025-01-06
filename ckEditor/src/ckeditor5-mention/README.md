CKEditor 5 mention feature
===========================
This is a fork of the [ckEditor mention plugin](https://github.com/ckeditor/ckeditor5/blob/master/packages/ckeditor5-mention/README.md)

We forked it to allow custom behavior, specifically inserting a mention does not create a mention object, but instead
snserts an ordinary link. This makes it possible to edit the link text without removing the link.
