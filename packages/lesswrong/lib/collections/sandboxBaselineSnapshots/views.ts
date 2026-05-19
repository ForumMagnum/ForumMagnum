import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface SandboxBaselineSnapshotsViewTerms extends ViewTermsBase {
    view: SandboxBaselineSnapshotsViewName
    // Add your view terms here
  }
}

// Define your view functions here

export const SandboxBaselineSnapshotsViews = new CollectionViewSet('SandboxBaselineSnapshots', {
  // Add your view functions here
});
