export default (): string => `
/*
 * TODO: These classes are used by 248 posts in the database that were authored
 * while LW2 was using ory-editor, which we have since migrated away from.
 * Getting rid of these styles safely requires updating the formatting of those
 * posts (or at least figuring out what this style actually does).
 */

/* legacyBreakpoints.maxSmall */
@media screen and (max-width: 715px) {
  .ory-cell-inner.ory-cell-leaf > div > div > div > div {
    padding-left:0 !important;
    padding-top:0 !important;
    padding-bottom:0 !important;
  }

  .ory-cell-inner.ory-cell-leaf button {
    width:20px !important;
    height:20px !important;
    margin:0 3px !important;
  }
  .ory-cell-inner.ory-cell-leaf > div > div > div > div {
    display:none !important;
  }
}

/* ************************************************************************ */

.editor {
  min-height: 220px;
  border-radius: 2px;
  margin-bottom: 2em;
}

/*
 * FIXME TODO: This CSS is unused/not being applied, but actually it should
 * be--it would fix the click-target of the comment and post editors being
 * really short.
 */
.editor :global(.public-DraftEditor-content) {
  min-height: 140px;
}
.public-DraftStyleDefault-unorderedListItem div,
.public-DraftStyleDefault-orderedListItem div {
  margin:0;
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

.image-form-invalid {
  color: #e65757;
}

.image-form {
  height: 34px;
  width: 220px;
  padding: 0 12px;
  font-size: 15px;
  font-family: inherit;
  background-color: transparent;
  border: none;
  color: #444;
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


select.form-control{
  height: 38px;
}

/* Styles for vulcan-forms */
.control-label strong {
  font-weight: normal;
}

.form-input {
  margin:16px 0;
  position: relative;
}

.form-group {
  margin-bottom: 0;
}

.form-component-EditTitle {
  margin:0;
  flex-grow:1;
}

.form-group.row {
  display:flex;
  justify-content: flex-start;
  align-items: center;
}
.form-control-limit{
  position: absolute;
  background: white;
  padding: 5px;
  bottom: 5px;
  right: 5px;
  color: #ddd;
  font-size: 80%;
}
.form-control-limit.danger{
  color: #EF1642;
}

/* //////////////////////////////////////////////////////////////////////// */

/* TODO: Possibly used by a library, or possibly unused */
.modal-dialog {
  margin-top: 100px !important;
}

.form-cancel {
  margin-left:25px;
}

.form-component-MuiInput {
  margin-bottom: 0px;
}

.multi-select-buttons-button {
  border-radius: 0px !important;
  text-transform: none !important;
  min-width: 63px !important;
}

.multi-select-buttons-label {
  margin-right: 10px;
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


/* Deactivate intercom on smaller devices */

/* theme.breakpoints.down('sm') */
@media screen and (max-width: 959px) {
  #intercom-container, .intercom-lightweight-app {
    display: none;
  }
}


div#mocha {
  background:white;
  border-right: 2px solid black;
  height: 100%;
  left: 0;
  margin: 0;
  overflow: auto;
  padding: 1rem;
  position: fixed;
  resize: horizontal;
  top: 0;
  width: 20px;
  z-index: 10000000;
}

/*
 * Blow below is from https://cdn.jsdelivr.net/npm/instantsearch.css@7.0.0/themes/reset-min.css (react-instantsearch)
 * Copyright (c) 2015-present Algolia, Inc.
 * https://github.com/algolia/instantsearch/blob/master/LICENSE
 */
.ais-Breadcrumb-list,.ais-CurrentRefinements-list,.ais-HierarchicalMenu-list,.ais-Hits-list,.ais-InfiniteHits-list,.ais-InfiniteResults-list,.ais-Menu-list,.ais-NumericMenu-list,.ais-Pagination-list,.ais-RatingMenu-list,.ais-RefinementList-list,.ais-Results-list,.ais-ToggleRefinement-list{margin:0;padding:0;list-style:none}.ais-ClearRefinements-button,.ais-CurrentRefinements-delete,.ais-CurrentRefinements-reset,.ais-HierarchicalMenu-showMore,.ais-InfiniteHits-loadMore,.ais-InfiniteResults-loadMore,.ais-Menu-showMore,.ais-RangeInput-submit,.ais-RefinementList-showMore,.ais-SearchBox-reset,.ais-SearchBox-submit{padding:0;overflow:visible;font:inherit;line-height:normal;color:inherit;background:none;border:0;cursor:pointer;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.ais-ClearRefinements-button::-moz-focus-inner,.ais-CurrentRefinements-delete::-moz-focus-inner,.ais-CurrentRefinements-reset::-moz-focus-inner,.ais-HierarchicalMenu-showMore::-moz-focus-inner,.ais-InfiniteHits-loadMore::-moz-focus-inner,.ais-InfiniteResults-loadMore::-moz-focus-inner,.ais-Menu-showMore::-moz-focus-inner,.ais-RangeInput-submit::-moz-focus-inner,.ais-RefinementList-showMore::-moz-focus-inner,.ais-SearchBox-reset::-moz-focus-inner,.ais-SearchBox-submit::-moz-focus-inner{padding:0;border:0}.ais-ClearRefinements-button[disabled],.ais-CurrentRefinements-delete[disabled],.ais-CurrentRefinements-reset[disabled],.ais-HierarchicalMenu-showMore[disabled],.ais-InfiniteHits-loadMore[disabled],.ais-InfiniteResults-loadMore[disabled],.ais-Menu-showMore[disabled],.ais-RangeInput-submit[disabled],.ais-RefinementList-showMore[disabled],.ais-SearchBox-reset[disabled],.ais-SearchBox-submit[disabled]{cursor:default}.ais-Breadcrumb-item,.ais-Breadcrumb-list,.ais-Pagination-list,.ais-PoweredBy,.ais-RangeInput-form,.ais-RatingMenu-link{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center}.ais-HierarchicalMenu-list .ais-HierarchicalMenu-list{margin-left:1em}.ais-PoweredBy-logo{display:block;width:70px;height:auto}.ais-RatingMenu-starIcon{display:block;width:20px;height:20px}.ais-SearchBox-input::-ms-clear,.ais-SearchBox-input::-ms-reveal{display:none;width:0;height:0}.ais-SearchBox-input::-webkit-search-cancel-button,.ais-SearchBox-input::-webkit-search-decoration,.ais-SearchBox-input::-webkit-search-results-button,.ais-SearchBox-input::-webkit-search-results-decoration{display:none}.ais-RangeSlider .rheostat{overflow:visible;margin-top:40px;margin-bottom:40px}.ais-RangeSlider .rheostat-background{height:6px;top:0;width:100%}.ais-RangeSlider .rheostat-handle{margin-left:-12px;top:-7px}.ais-RangeSlider .rheostat-background{position:relative;background-color:#fff;border:1px solid #aaa}.ais-RangeSlider .rheostat-progress{position:absolute;top:1px;height:4px;background-color:#333}.rheostat-handle{position:relative;z-index:1;width:20px;height:20px;background-color:#fff;border:1px solid #333;border-radius:50%;cursor:-webkit-grab;cursor:grab}.rheostat-marker{margin-left:-1px;position:absolute;width:1px;height:5px;background-color:#aaa}.rheostat-marker--large{height:9px}.rheostat-value{padding-top:15px}.rheostat-tooltip,.rheostat-value{margin-left:50%;position:absolute;text-align:center;-webkit-transform:translateX(-50%);transform:translateX(-50%)}.rheostat-tooltip{top:-22px}

`
