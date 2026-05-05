export const printStyles = (_theme: ThemeType) => ({
  "@media print": {
    // ── Post-reading page ──────────────────────────────────────────────────────

    // Hide the left navigation sidebar
    "[class*='NavigationStandalone-sidebar']": {
      display: "none !important",
    },

    // Switch the ToC CSS-grid container to block so the central column fills
    // the full page width without needing to rebuild the grid-template.
    "[class*='MultiToCLayout-tableOfContents']": {
      display: "block !important",
    },
    // Hide left ToC column
    "[class*='MultiToCLayout-toc']": {
      display: "none !important",
    },
    // Hide sticky ToC block-scroller inside the toc column
    "[class*='MultiToCLayout-stickyBlockScroller']": {
      display: "none !important",
    },
    // Hide right-hand sidenotes / welcome-box column
    "[class*='MultiToCLayout-rhs']": {
      display: "none !important",
    },
    // Hide fixed ToC footer (comment count bar)
    "[class*='MultiToCLayout-tocFooter']": {
      display: "none !important",
    },

    // Hide the comments section (keep just the post body)
    "[class*='PostsPage-commentsSection']": {
      display: "none !important",
    },
    "[class*='PostsPage-betweenPostAndComments']": {
      display: "none !important",
    },
    // Hide bottom recommendations
    "[class*='PostsPage-recommendations']": {
      display: "none !important",
    },

    // Hide top-right vote / actions overlay
    "[class*='LWPostsPageHeaderTopRight-root']": {
      display: "none !important",
    },
    // Remove the large screen-only top-padding so the title starts near the
    // top of the first printed page instead of 110 px down.
    "[class*='LWPostsPageHeader-root']": {
      paddingTop: "0 !important",
      marginBottom: "16px !important",
    },
    "[class*='LWPostsPageHeader-topRight']": {
      display: "none !important",
    },
    "[class*='LWPostsPageHeader-mobileHeaderVote']": {
      display: "none !important",
    },

    // Hide LLM chat sidebar column in the top-level layout flex container
    "[class*='Layout-llmChatColumn']": {
      display: "none !important",
    },

    // ── Editor page (/editPost) ─────────────────────────────────────────────

    // Hide the top-of-page Lexical toolbar
    "[class*='ToolbarPlugin-']": {
      display: "none !important",
    },
    // Hide the floating text-format toolbar
    "[class*='FloatingTextFormatToolbarPlugin-']": {
      display: "none !important",
    },
    // Hide the draggable-block / block-insert toolbar
    "[class*='DraggableBlockPlugin-']": {
      display: "none !important",
    },
    // Hide the publish / save buttons
    "[class*='PostSubmit-']": {
      display: "none !important",
    },
    "[class*='PostsEditForm-formSubmit']": {
      display: "none !important",
    },

    // ── Global clean-up ─────────────────────────────────────────────────────

    // Strip box-shadows and text-shadows from all elements so they don't
    // produce grey halos on white paper.
    "*": {
      boxShadow: "none !important",
      textShadow: "none !important",
    },
  },
});
