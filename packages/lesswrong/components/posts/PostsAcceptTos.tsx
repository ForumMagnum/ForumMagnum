import React, { FC, PropsWithChildren } from "react";
import { Link } from "../../lib/reactRouterWrapper";

export const TosLink: FC<PropsWithChildren<{}>> = ({children}) =>
  <Link to="/termsOfUse" target="_blank" rel="noreferrer">{children ?? "terms of use"}</Link>

export const LicenseLink: FC<PropsWithChildren<{}>> = ({children}) =>
  <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
    {children ?? "Creative Commons Attribution 4.0"}
  </a>
