import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useHover } from "../common/withHover";
import { tagCreateUrl } from "../../lib/collections/tags/helpers";
import { Paper }from '@/components/widgets/Paper';
import { LWPopper } from "../common/LWPopper";
import { DropdownMenu } from "../dropdowns/DropdownMenu";
import { DropdownItem } from "../dropdowns/DropdownItem";
import { DropdownDivider } from "../dropdowns/DropdownDivider";

const NewWikiTagMenuInner = ({ children }: { children: React.ReactNode }) => {
  const subMenuHover = useHover();
  const { eventHandlers: subMenuHandlers, hover: subMenuIsOpen, anchorEl: subMenuAnchor, forceUnHover: closeSubMenu } = subMenuHover;
  return (
    <span {...subMenuHandlers}>
      {children}
      <LWPopper open={subMenuIsOpen} anchorEl={subMenuAnchor} placement="right-start">
        <Paper>
          <DropdownMenu>
            <div onClick={() => closeSubMenu()}>
              <DropdownItem
              title="Wiki Only"
              to={`${tagCreateUrl}?type=wiki`}
              />
              <DropdownItem
                title="Wiki + Tag"
                to={tagCreateUrl}
              />
              <DropdownDivider />
              <DropdownItem
                title={<span><em>What's the difference?</em></span>}
                to="/w/what-s-a-wikitag"
              />
            </div>
          </DropdownMenu>
        </Paper>
      </LWPopper>
    </span>
  );
};

export const NewWikiTagMenu = registerComponent("NewWikiTagMenu", NewWikiTagMenuInner);

 

declare global {
  interface ComponentTypes {
    NewWikiTagMenu: typeof NewWikiTagMenu;
  }
} 
