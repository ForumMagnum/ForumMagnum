export const miscStyles = (theme: ThemeType) => ({
  "@global": {
    ".editor": {
      minHeight: 220,
      borderRadius: 2,
      marginBottom: "2em",
    },
    
    ".editor blockquote div, .editor blockquote span": {
      margin: 0,
    },
    
    // Editor clearfix
    // TODO: This is a hideous hac
    "figure:after": {
      content: "Foo",
      visibility: "hidden",
      display: "block",
      height: 0,
      clear: "both",
    },
    
    ".draft-image": {
      display: "block",
    },
    
    ".draft-image.center": {
      marginLeft: "auto",
      marginRight: "auto",
    },
    ".draft-image.right": {
      float: "right",
    },
    
    
    //Hotfix for inline-Toolbar alignment TODO: Fix this in a more systematic way
    ".form-component-CommentEditor": {
      position: "static !important",
    },
    
    ".form-component-EditorFormComponent": {
      position: "static !important",
    },
    
    // Divider plugin styles
    ".dividerBlock": {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%",
      margin: "32px 0",
      // strip default hr styling
      border: "none",
      textAlign: "center",
    },
    
    ".dividerBlock::after": {
      marginLeft: 12,
      color: "rgba(0, 0, 0, 0.26)",
      fontSize: "1rem",
      // increase space between dots
      letterSpacing: 12,
      content: '•••',
    },
    
    
    html: {
      /*
       * This is the only place I could find that successfully overrode the ckEditor zIndex
       * necessary to ensure it works on modal dialogs
       * (also tried adding it to Layout.jsx's JSS, and to the styles file in the ckeditor folder)
       */
      "--ck-z-panel": "10000000002 !important",
      /**
       * --ck-z-modal was renamed to --ck-z-panel in https://github.com/ckeditor/ckeditor5/pull/15285
       * it's here for backwards compatibility only
       */
      "--ck-z-modal": "10000000002 !important",
    },
    
    /* ************************************************************************ */
    
    // Styles for vulcan-forms
    ".form-input": {
      margin: "16px 0",
      position: "relative",
    },
    
    ".form-component-EditTitle": {
      margin:0,
      flexGrow:1,
    },
    
    /* //////////////////////////////////////////////////////////////////////// */
    
    ".form-cancel": {
      marginLeft:25,
    },
    
    ".form-component-MuiInput": {
      marginBottom: 0,
    },
    
    ".form-component-AlignmentCheckbox": {
      position:"relative",
    },
    
    
    /*legacyBreakpoints.maxSmall*/
    "@media screen and (max-width: 715px)": {
      ".primary-form-submit-button": {
        float: "left",
      }
    },
    
    /* //////////////////////////////////////////////////////////////////////// */
    
    h3: {
      marginTop: 0,
    },
    
    /*
     * Blow below is from https://cdn.jsdelivr.net/npm/instantsearch.css@7.0.0/themes/reset-min.css (react-instantsearch)
     * Copyright (c) 2015-present Algolia, Inc.
     * https://github.com/algolia/instantsearch/blob/master/LICENSE
     */
    ".ais-Breadcrumb-list,.ais-CurrentRefinements-list,.ais-HierarchicalMenu-list,.ais-Hits-list,.ais-InfiniteHits-list,.ais-InfiniteResults-list,.ais-Menu-list,.ais-NumericMenu-list,.ais-Pagination-list,.ais-RatingMenu-list,.ais-RefinementList-list,.ais-Results-list,.ais-ToggleRefinement-list": {
      margin:0,
      padding:0,
      listStyle:"none",
    },
    ".ais-ClearRefinements-button,.ais-CurrentRefinements-delete,.ais-CurrentRefinements-reset,.ais-HierarchicalMenu-showMore,.ais-InfiniteHits-loadMore,.ais-InfiniteResults-loadMore,.ais-Menu-showMore,.ais-RangeInput-submit,.ais-RefinementList-showMore,.ais-SearchBox-reset,.ais-SearchBox-submit": {
      padding:0,
      overflow:"visible",
      font:"inherit",
      lineHeight:"normal",
      color:"inherit",
      background:"none",
      border:0,
      cursor:"pointer",
      "-webkit-user-select":"none",
      "-moz-user-select":"none",
      "-ms-user-select":"none",
      userSelect:"none",
    },
    ".ais-ClearRefinements-button::-moz-focus-inner,.ais-CurrentRefinements-delete::-moz-focus-inner,.ais-CurrentRefinements-reset::-moz-focus-inner,.ais-HierarchicalMenu-showMore::-moz-focus-inner,.ais-InfiniteHits-loadMore::-moz-focus-inner,.ais-InfiniteResults-loadMore::-moz-focus-inner,.ais-Menu-showMore::-moz-focus-inner,.ais-RangeInput-submit::-moz-focus-inner,.ais-RefinementList-showMore::-moz-focus-inner,.ais-SearchBox-reset::-moz-focus-inner,.ais-SearchBox-submit::-moz-focus-inner": {
      padding:0,
      border:0,
    },
    ".ais-ClearRefinements-button[disabled],.ais-CurrentRefinements-delete[disabled],.ais-CurrentRefinements-reset[disabled],.ais-HierarchicalMenu-showMore[disabled],.ais-InfiniteHits-loadMore[disabled],.ais-InfiniteResults-loadMore[disabled],.ais-Menu-showMore[disabled],.ais-RangeInput-submit[disabled],.ais-RefinementList-showMore[disabled],.ais-SearchBox-reset[disabled],.ais-SearchBox-submit[disabled]": {
      cursor:"default"
    },
    ".ais-Breadcrumb-item,.ais-Breadcrumb-list,.ais-Pagination-list,.ais-PoweredBy,.ais-RangeInput-form,.ais-RatingMenu-link": {
      display:"flex",
      "-webkit-box-align":"center",
      "-ms-flex-align":"center",
      alignItems:"center",
    },
    ".ais-HierarchicalMenu-list .ais-HierarchicalMenu-list": {
      marginLeft:"1em"
    },
    ".ais-PoweredBy-logo": {
      display:"block",
      width:70,
      height:"auto"
    },
    ".ais-RatingMenu-starIcon": {
      display:"block",
      width:20,
      height:20,
    },
    ".ais-SearchBox-input::-ms-clear,.ais-SearchBox-input::-ms-reveal": {
      display:"none",
      width:0,
      height:0
    },
    ".ais-SearchBox-input::-webkit-search-cancel-button,.ais-SearchBox-input::-webkit-search-decoration,.ais-SearchBox-input::-webkit-search-results-button,.ais-SearchBox-input::-webkit-search-results-decoration": {
      display:"none"
    },
    ".ais-RangeSlider .rheostat": {
      overflow:"visible",
      marginTop:40,
      marginBottom:40
    },
    ".ais-RangeSlider .rheostat-background": {
      height: 6,
      top: 0,
      width: "100%",
      position: "relative",
      backgroundColor: "#fff",
      border: "1px solid #aaa",
    },
    ".ais-RangeSlider .rheostat-handle": {
      marginLeft:-12,
      top:-7,
    },
    ".ais-RangeSlider .rheostat-progress": {
      position: "absolute",
      top:1,
      height:4,
      backgroundColor: "#333",
    },
    ".rheostat-handle": {
      position: "relative",
      zIndex:1,
      width:20,
      height:20,
      backgroundColor: "#fff",
      border: "1px solid #333",
      borderRadius: "50%",
      cursor: "grab",
    },
    ".rheostat-marker": {
      marginLeft:-1,
      position: "absolute",
      width:1,
      height:5,
      backgroundColor: "#aaa",
    },
    ".rheostat-marker--large": {
      height:9,
    },
    ".rheostat-value": {
      paddingTop:15,
    },
    ".rheostat-tooltip,.rheostat-value": {
      marginLeft: "50%",
      position: "absolute",
      textAlign: "center",
      "-webkit-transform": "translateX(-50%)",
      transform: "translateX(-50%)",
    },
    ".rheostat-tooltip": {
      top:-22,
    },
  }
});
