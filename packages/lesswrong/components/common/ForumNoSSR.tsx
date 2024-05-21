import React from "react";
// eslint-disable-next-line no-restricted-imports
import { default as BadlyTypedNoSSR } from "react-no-ssr";
import { componentWithChildren } from "../../lib/utils/componentsWithChildren";

const NoSSRWithChildren = componentWithChildren(BadlyTypedNoSSR);
type NoSSRProps = React.ComponentProps<typeof NoSSRWithChildren>;

interface ForumNoSSRProps extends NoSSRProps {
  if?: boolean;
}

const ForumNoSSR: React.FC<ForumNoSSRProps> = ({ children, if: condition = true, ...noSSRProps }) => {
  return condition ? <NoSSRWithChildren {...noSSRProps}>{children}</NoSSRWithChildren> : <>{children}</>;
};

export default ForumNoSSR;
