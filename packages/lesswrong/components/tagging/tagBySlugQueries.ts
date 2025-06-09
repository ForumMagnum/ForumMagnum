import { gql } from "@/lib/generated/gql-codegen";

const tagFragmentBySlugQuery = gql(`
  query tagFragmentBySlug($selector: TagSelector, $limit: Int) {
    tags(selector: $selector, limit: $limit) {
      results {
        ...TagFragment
      }
    }
  }
`);

const tagBasicInfoBySlugQuery = gql(`
  query tagBasicInfoBySlug($selector: TagSelector, $limit: Int) {
    tags(selector: $selector, limit: $limit) {
      results {
        ...TagBasicInfo
      }
    }
  }
`);

const allTagsPageFragmentBySlugQuery = gql(`
  query allTagsPageFragmentBySlug($selector: TagSelector, $limit: Int) {
    tags(selector: $selector, limit: $limit) {
      results {
        ...AllTagsPageFragment
      }
    }
  }
`);

const tagPageFragmentBySlugQuery = gql(`
  query tagPageFragmentBySlug($selector: TagSelector, $limit: Int, $contributorsLimit: Int) {
    tags(selector: $selector, limit: $limit) {
      results {
        ...TagPageFragment
      }
    }
  }
`);

const tagPageWithRevisionFragmentBySlugQuery = gql(`
  query tagPageWithRevisionFragmentBySlug($selector: TagSelector, $limit: Int, $version: String, $contributorsLimit: Int) {
    tags(selector: $selector, limit: $limit) {
      results {
        ...TagPageWithRevisionFragment
      }
    }
  }
`);

const tagEditFragmentBySlugQuery = gql(`
  query tagEditFragmentBySlug($selector: TagSelector, $limit: Int) {
    tags(selector: $selector, limit: $limit) {
      results {
        ...TagEditFragment
      }
    }
  }
`);

const tagHistoryFragmentBySlugQuery = gql(`
  query tagHistoryFragmentBySlug($selector: TagSelector, $limit: Int) {
    tags(selector: $selector, limit: $limit) {
      results {
        ...TagHistoryFragment
      }
    }
  }
`);

const tagPageWithArbitalContentFragmentBySlugQuery = gql(`
  query tagPageWithArbitalContentFragmentBySlug($selector: TagSelector, $limit: Int, $contributorsLimit: Int) {
    tags(selector: $selector, limit: $limit) {
      results {
        ...TagPageWithArbitalContentFragment
      }
    }
  }
`);

const tagPageRevisionWithArbitalContentFragmentBySlugQuery = gql(`
  query tagPageRevisionWithArbitalContentFragmentBySlug($selector: TagSelector, $limit: Int, $version: String, $contributorsLimit: Int) {
    tags(selector: $selector, limit: $limit) {
      results {
        ...TagPageRevisionWithArbitalContentFragment
      }
    }
  }
`);

const tagPageWithArbitalContentAndLensRevisionFragmentBySlugQuery = gql(`
  query tagPageWithArbitalContentAndLensRevisionFragmentBySlug($selector: TagSelector, $limit: Int, $version: String, $contributorsLimit: Int, $lensSlug: String) {
    tags(selector: $selector, limit: $limit) {
      results {
        ...TagPageWithArbitalContentAndLensRevisionFragment
      }
    }
  }
`);

export const tagBySlugQueries = {
  TagFragment: tagFragmentBySlugQuery,
  TagBasicInfo: tagBasicInfoBySlugQuery,
  AllTagsPageFragment: allTagsPageFragmentBySlugQuery,
  TagPageFragment: tagPageFragmentBySlugQuery,
  TagPageWithRevisionFragment: tagPageWithRevisionFragmentBySlugQuery,
  TagEditFragment: tagEditFragmentBySlugQuery,
  TagHistoryFragment: tagHistoryFragmentBySlugQuery,
  TagPageWithArbitalContentFragment: tagPageWithArbitalContentFragmentBySlugQuery,
  TagPageRevisionWithArbitalContentFragment: tagPageRevisionWithArbitalContentFragmentBySlugQuery,
  TagPageWithArbitalContentAndLensRevisionFragment: tagPageWithArbitalContentAndLensRevisionFragmentBySlugQuery,
};
