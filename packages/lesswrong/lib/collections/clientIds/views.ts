import { CollectionViewSet } from "@/lib/views/collectionViewSet";

declare global {
  interface ClientIdsViewTerms extends ViewTermsBase {
    view: ClientIdsViewName | undefined
    clientId?: string
  }
}

function getClientId(terms: ClientIdsViewTerms) {
  return {
    selector: {
      clientId: terms.clientId,
    },
  };
}

export const ClientIdsViews = new CollectionViewSet('ClientIds', { getClientId });
