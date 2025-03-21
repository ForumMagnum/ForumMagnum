import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useHover } from "../common/withHover";
import { tagCreateUrl } from "../../lib/collections/tags/helpers";
import Paper from "@/lib/vendor/@material-ui/core/src/Paper";

const NewWikiTagMenu = ({ children }: { children: React.ReactNode }) => {
  const subMenuHover = useHover();
  const { eventHandlers: subMenuHandlers, hover: subMenuIsOpen, anchorEl: subMenuAnchor, forceUnHover: closeSubMenu } = subMenuHover;
  const { LWPopper, DropdownMenu, DropdownItem, DropdownDivider } = Components;

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

const NewWikiTagMenuComponent = registerComponent("NewWikiTagMenu", NewWikiTagMenu);

export default NewWikiTagMenuComponent; 

declare global {
  interface ComponentTypes {
    NewWikiTagMenu: typeof NewWikiTagMenuComponent;
  }
} 
