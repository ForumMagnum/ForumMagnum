import React from "react";
import DropdownItem from "../DropdownItem";

interface SeeLessDropdownItemProps {
  onSeeLess: () => void;
  isSeeLessMode?: boolean;
}

const SeeLessDropdownItem = ({
  onSeeLess,
  isSeeLessMode = false,
}: SeeLessDropdownItemProps) => {
  return (
    <DropdownItem
      title={isSeeLessMode ? "Undo see less" : "Show me less like this"}
      onClick={onSeeLess}
      icon="Close"
    />
  );
};

export default SeeLessDropdownItem; 
