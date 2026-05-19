import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface RepoInstallSnapshotsViewTerms extends ViewTermsBase {
    view: RepoInstallSnapshotsViewName
    // Add your view terms here
  }
}

// Define your view functions here

export const RepoInstallSnapshotsViews = new CollectionViewSet('RepoInstallSnapshots', {
  // Add your view functions here
});
