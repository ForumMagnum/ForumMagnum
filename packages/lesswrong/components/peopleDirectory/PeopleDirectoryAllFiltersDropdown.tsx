import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { usePeopleDirectory } from "./usePeopleDirectory";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  rootMain: {
    padding: 4,
  },
  rootFilter: {
    position: "relative",
    paddingBottom: 8,
  },
  filterName: {
    cursor: "pointer",
    userSelect: "none",
    fontSize: 14,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: 12,
    borderRadius: theme.borderRadius.default,
    "& > *:first-child": {
      flexGrow: 1,
    },
    "&:hover": {
      background: theme.palette.grey[100],
    },
  },
  icon: {
    width: 16,
    height: 16,
    color: theme.palette.grey[600],
  },
  backButton: {
    position: "absolute",
    top: 14,
    left: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    width: 24,
    height: 24,
    userSelect: "none",
    cursor: "pointer",
    color: theme.palette.grey[600],
    borderRadius: theme.borderRadius.default,
    "&:hover": {
      background: theme.palette.grey[100],
    },
  },
  selectedTitle: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: 600,
    padding: 16,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: 500,
    marginRight: 16,
  },
  selectedCount: {
    color: theme.palette.primary.main,
    fontSize: 13,
    fontWeight: 500,
  },
  staticWrapper: {
    padding: 4,
  },
  clearAll: {
    color: theme.palette.primary.main,
    fontSize: 14,
    fontWeight: 600,
    padding: 12,
    "& > *": {
      cursor: "pointer",
    },
  },
});

const PeopleDirectoryAllFiltersDropdownInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {filters} = usePeopleDirectory();
  const [selectedFilterName, setSelectedFilterName] = useState<string | null>(null);
  const selectedFilter = filters.find(
    ({filter}) => filter.title === selectedFilterName,
  );

  const clearSelection = useCallback(() => setSelectedFilterName(null), []);

  const clearAll = useCallback(() => {
    clearSelection();
    for (const {filter} of filters) {
      filter.clear();
    }
  }, [filters, clearSelection]);

  const {
    LWClickAwayListener, ForumIcon, PeopleDirectorySearchableFilter,
    PeopleDirectoryStaticFilter,
  } = Components;

  if (selectedFilter) {
    const {type, filter} = selectedFilter;
    return (
      <LWClickAwayListener onClickAway={clearSelection}>
        <div className={classNames(classes.root, classes.rootFilter)}>
          <div onClick={clearSelection} className={classes.backButton}>
            &lt;-
          </div>
          <div className={classes.selectedTitle}>
            {filter.title}
          </div>
          <div className={type === "static" ? classes.staticWrapper : undefined}>
            {type === "searchable"
              ? <PeopleDirectorySearchableFilter filter={filter} justContent />
              : <PeopleDirectoryStaticFilter filter={filter} justContent />
            }
          </div>
        </div>
      </LWClickAwayListener>
    );
  }

  const hasFilters = filters.some(
    ({filter: {selectedValues}}) => selectedValues.length > 0,
  );

  return (
    <LWClickAwayListener onClickAway={clearSelection}>
      <div className={classNames(classes.root, classes.rootMain)}>
        {filters.map(({filter}) => (
          <div
            key={filter.title}
            className={classes.filterName}
            onClick={setSelectedFilterName.bind(null, filter.title)}
          >
            <div className={classes.filterTitle}>{filter.title}</div>
            {filter.selectedValues.length > 0 &&
              <div className={classes.selectedCount}>
                {filter.selectedValues.length} selected
              </div>
            }
            <ForumIcon icon="ThickChevronRight" className={classes.icon} />
          </div>
        ))}
        {hasFilters &&
          <div className={classes.clearAll}>
            <span onClick={clearAll}>Clear all</span>
          </div>
        }
      </div>
    </LWClickAwayListener>
  );
}

export const PeopleDirectoryAllFiltersDropdown = registerComponent(
  "PeopleDirectoryAllFiltersDropdown",
  PeopleDirectoryAllFiltersDropdownInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryAllFiltersDropdown: typeof PeopleDirectoryAllFiltersDropdown
  }
}
