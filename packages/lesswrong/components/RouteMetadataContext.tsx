import { ClientRouteMetadataSetter, type RouteMetadata } from "./ClientRouteMetadataContext";
import { RouteMetadataSetter as ServerRouteMetadataSetter } from "./ServerRouteMetadataContext";

/**
 * Modifying our `Layout` from a child route creates two distinct challenges:
 *
 * 1.  Initial Server Render: The server must generate the correct HTML on the first request.
 *     If not handled properly, the user sees a default layout that then "flickers" to the
 *     correct state after the client-side JavaScript loads.  As an example, the home page
 *     has a left-hand navigation column, but the default layout does not.  If we don't
 *     handle this properly, the user will see the initial page content render in the center
 *     of the page, which will then reflow to be more left-aligned after the client metadata
 *     setter applies the layout configuration for that page.
 * 
 *     The solution is to use a Server Component to grab the configuration and pass it into a provider,
 *     which causes it to get pushed to the client as part of the RSC rehydration payload, so
 *     that the very first client-side rendering pass already has the correct configuration.
 *
 * 2.  Client-Side Navigation: When navigating between pages on the client, the root layout
 *     persists. Its state must be updated to reflect the new page's configuration and be
 *     reset when navigating away.
 * 
 *     Here we just use a thin wrapper around a `useEffect` call to update the metadata
 *     when the component mounts (and clear it when it unmounts), which should happen
 *     automatically on client-side navigation to another page.
 */
export function RouteMetadataSetter({ metadata }: { metadata: RouteMetadata }): React.ReactNode {
  return <>
    <ServerRouteMetadataSetter metadata={metadata} />
    <ClientRouteMetadataSetter metadata={metadata} />
  </>;
}
