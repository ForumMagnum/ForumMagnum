export default (): string => `
.editor {
  min-height: 220px;
  border-radius: 2px;
  margin-bottom: 2em;
}

.editor blockquote div, .editor blockquote span {
  margin:0;
}

/* Editor clearfix */
/* TODO: This is a hideous hack *
figure:after {
  content: "Foo";
  visibility: hidden;
  display: block;
  height: 0px;
  clear: both;
}

.draft-image {
  display: block;
}

.draft-image.center {
  margin-left: auto;
  margin-right: auto;
}
.draft-image.right {
  float: right;
}


/*Hotfix for inline-Toolbar alignment TODO: Fix this in a more systematic way*/

.form-component-CommentEditor {
  position: static !important;
}

.form-component-EditorFormComponent {
  position: static !important;
}

/* Divider plugin styles */

.dividerBlock {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  margin: 32px 0;
  /* strip default hr styling */
  border: none;
  text-align: center;
}

.dividerBlock::after {
  margin-left: 12px;
  color: rgba(0, 0, 0, 0.26);
  font-size: 1rem;
  /* increase space between dots */
  letter-spacing: 12px;
  content: '•••';
}


html {
  /*
   * This is the only place I could find that successfully overrode the ckEditor zIndex
   * necessary to ensure it works on modal dialogs
   * (also tried adding it to Layout.jsx's JSS, and to the styles file in the ckeditor folder)
   */
  --ck-z-panel: 10000000002 !important;
  /**
   * --ck-z-modal was renamed to --ck-z-panel in https://github.com/ckeditor/ckeditor5/pull/15285
   * it's here for backwards compatibility only
   */
  --ck-z-modal: 10000000002 !important;
}

/* ************************************************************************ */

/* Styles for vulcan-forms */
.form-input {
  margin:16px 0;
  position: relative;
}

.form-component-EditTitle {
  margin:0;
  flex-grow:1;
}

/* //////////////////////////////////////////////////////////////////////// */

.form-cancel {
  margin-left:25px;
}

.form-component-MuiInput {
  margin-bottom: 0px;
}

.form-component-AlignmentCheckbox {
  position:relative;
}


/*legacyBreakpoints.maxSmall*/
@media screen and (max-width: 715px) {
  .primary-form-submit-button {
    float: left;
  }
}

/* //////////////////////////////////////////////////////////////////////// */

h3 {
  margin-top: 0px;
}

/*
 * Blow below is from https://cdn.jsdelivr.net/npm/instantsearch.css@7.0.0/themes/reset-min.css (react-instantsearch)
 * Copyright (c) 2015-present Algolia, Inc.
 * https://github.com/algolia/instantsearch/blob/master/LICENSE
 */
.ais-Breadcrumb-list,.ais-CurrentRefinements-list,.ais-HierarchicalMenu-list,.ais-Hits-list,.ais-InfiniteHits-list,.ais-InfiniteResults-list,.ais-Menu-list,.ais-NumericMenu-list,.ais-Pagination-list,.ais-RatingMenu-list,.ais-RefinementList-list,.ais-Results-list,.ais-ToggleRefinement-list{margin:0;padding:0;list-style:none}.ais-ClearRefinements-button,.ais-CurrentRefinements-delete,.ais-CurrentRefinements-reset,.ais-HierarchicalMenu-showMore,.ais-InfiniteHits-loadMore,.ais-InfiniteResults-loadMore,.ais-Menu-showMore,.ais-RangeInput-submit,.ais-RefinementList-showMore,.ais-SearchBox-reset,.ais-SearchBox-submit{padding:0;overflow:visible;font:inherit;line-height:normal;color:inherit;background:none;border:0;cursor:pointer;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.ais-ClearRefinements-button::-moz-focus-inner,.ais-CurrentRefinements-delete::-moz-focus-inner,.ais-CurrentRefinements-reset::-moz-focus-inner,.ais-HierarchicalMenu-showMore::-moz-focus-inner,.ais-InfiniteHits-loadMore::-moz-focus-inner,.ais-InfiniteResults-loadMore::-moz-focus-inner,.ais-Menu-showMore::-moz-focus-inner,.ais-RangeInput-submit::-moz-focus-inner,.ais-RefinementList-showMore::-moz-focus-inner,.ais-SearchBox-reset::-moz-focus-inner,.ais-SearchBox-submit::-moz-focus-inner{padding:0;border:0}.ais-ClearRefinements-button[disabled],.ais-CurrentRefinements-delete[disabled],.ais-CurrentRefinements-reset[disabled],.ais-HierarchicalMenu-showMore[disabled],.ais-InfiniteHits-loadMore[disabled],.ais-InfiniteResults-loadMore[disabled],.ais-Menu-showMore[disabled],.ais-RangeInput-submit[disabled],.ais-RefinementList-showMore[disabled],.ais-SearchBox-reset[disabled],.ais-SearchBox-submit[disabled]{cursor:default}.ais-Breadcrumb-item,.ais-Breadcrumb-list,.ais-Pagination-list,.ais-PoweredBy,.ais-RangeInput-form,.ais-RatingMenu-link{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center}.ais-HierarchicalMenu-list .ais-HierarchicalMenu-list{margin-left:1em}.ais-PoweredBy-logo{display:block;width:70px;height:auto}.ais-RatingMenu-starIcon{display:block;width:20px;height:20px}.ais-SearchBox-input::-ms-clear,.ais-SearchBox-input::-ms-reveal{display:none;width:0;height:0}.ais-SearchBox-input::-webkit-search-cancel-button,.ais-SearchBox-input::-webkit-search-decoration,.ais-SearchBox-input::-webkit-search-results-button,.ais-SearchBox-input::-webkit-search-results-decoration{display:none}.ais-RangeSlider .rheostat{overflow:visible;margin-top:40px;margin-bottom:40px}.ais-RangeSlider .rheostat-background{height:6px;top:0;width:100%}.ais-RangeSlider .rheostat-handle{margin-left:-12px;top:-7px}.ais-RangeSlider .rheostat-background{position:relative;background-color:#fff;border:1px solid #aaa}.ais-RangeSlider .rheostat-progress{position:absolute;top:1px;height:4px;background-color:#333}.rheostat-handle{position:relative;z-index:1;width:20px;height:20px;background-color:#fff;border:1px solid #333;border-radius:50%;cursor:-webkit-grab;cursor:grab}.rheostat-marker{margin-left:-1px;position:absolute;width:1px;height:5px;background-color:#aaa}.rheostat-marker--large{height:9px}.rheostat-value{padding-top:15px}.rheostat-tooltip,.rheostat-value{margin-left:50%;position:absolute;text-align:center;-webkit-transform:translateX(-50%);transform:translateX(-50%)}.rheostat-tooltip{top:-22px}

`
