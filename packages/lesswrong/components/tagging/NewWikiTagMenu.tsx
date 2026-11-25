import React from "react";
import { useHover } from "../common/withHover";
import { getTagCreateUrl } from "../../lib/collections/tags/helpers";
import PopperCard from "../common/PopperCard";
import DropdownMenu from "../dropdowns/DropdownMenu";
import DropdownItem from "../dropdowns/DropdownItem";
import DropdownDivider from "../dropdowns/DropdownDivider";

const NewWikiTagMenu = ({ children }: { children: React.ReactNode }) => {
  const subMenuHover = useHover();
  const { eventHandlers: subMenuHandlers, hover: subMenuIsOpen, anchorEl: subMenuAnchor, forceUnHover: closeSubMenu } = subMenuHover;
  return (
    <span {...subMenuHandlers}>
      {children}
      <PopperCard open={subMenuIsOpen} anchorEl={subMenuAnchor} placement="right-start">
        <DropdownMenu>
          <div onClick={() => closeSubMenu()}>
            <DropdownItem
            title="Wiki Only"
            to={`${getTagCreateUrl()}?type=wiki`}
            />
            <DropdownItem
              title="Wiki + Tag"
              to={getTagCreateUrl()}
            />
            <DropdownDivider />
            <DropdownItem
              title={<span><em>What's the difference?</em></span>}
              to="/w/what-s-a-wikitag"
            />
          </div>
        </DropdownMenu>
      </PopperCard>
    </span>
  );
};

export default NewWikiTagMenu;

 

 
