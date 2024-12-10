import React, { useState } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { CTAButtonSettings } from './ctaButton';
import Input from '@material-ui/core/Input';
import { getUrlClass } from '@/server/utils/getUrlClass';
import { makeSortableListComponent } from '@/components/form-components/sortableList';
import { useSingle } from '@/lib/crud/withSingle';
import { useTagBySlug } from '@/components/tagging/useTag';
import classNames from 'classnames';

const styles = defineStyles("EditCTAButtonSettings", (theme: ThemeType) => ({
  root: {
    padding: 12,
    background: theme.palette.panelBackground.default,
  },
  modeSelector: {
    display: "flex",
    marginBottom: 12,
  },
  mode: {
    marginRight: 12,
    cursor: "pointer",
  },
  modeSelected: {
    textDecoration: "underline",
  },
  input: {
    marginLeft: 8,
  },
}));

const EditCTAButtonSettings = ({initialState, setDocumentState}: {
  initialState: CTAButtonSettings
  setDocumentState: (newState: CTAButtonSettings) => void
}) => {
  const classes = useStyles(styles);
  const [state,setState] = useState(initialState);
  const changeValue = (newState: CTAButtonSettings) => {
    setDocumentState(newState);
    setState(newState);
  }
  const isPathUrl = urlHasArbitalPath(state.linkTo);
  const [selectedTabState, setSelectedTab] = useState<"url"|"path"|null>(null);
  const selectedTab = selectedTabState ?? (isPathUrl ? "path" : "url");

  return <div className="ck-reset_all-excluded">
  <div className={classes.root}>
    <div className={classNames(classes.modeSelector)}>
      <div
        className={classNames(classes.mode, selectedTab==="url" && classes.modeSelected)}
        onClick={ev => setSelectedTab("url")}
      >
        Link to URL
      </div>
      <div
        className={classNames(classes.mode, selectedTab==="path" && classes.modeSelected)}
        onClick={ev => setSelectedTab("path")}
      >
        Reading List
      </div>
    </div>
    
    <div>Button Text</div>
    <Input className={classes.input} value={state.buttonText} onChange={ev =>
      setState(st => ({...state, buttonText: ev.target.value}))
    } />
    
    {(selectedTab === "url") && <>
      <div>Link</div>
      <Input className={classes.input} value={state.buttonText} onChange={ev => {
        if (selectedTabState === null) setSelectedTab("url");
        setState({...state, linkTo: ev.target.value})
      }}/>
    </>}

    {(selectedTab === "path") && <>
      <EditReadingList state={state} changeValue={changeValue} />
    </>}
  </div>
  </div>
}

const EditReadingList = ({state, changeValue}: {
  state: CTAButtonSettings
  changeValue: (newState: CTAButtonSettings) => void
}) => {
  const classes = useStyles(styles);
  const [pages, setPages] = useState<string[]>(urlWithArbitalPathToPageSlugs(state.linkTo));
  
  const changePages = (newPages: string[]) => {
    setPages(newPages);
    
    if (newPages.length > 0) {
      const firstPageLink = `/p/${newPages[0]}`;
      const link = addArbitalPathToLink(firstPageLink, newPages);
      changeValue({...state, linkTo: link});
    } else {
      changeValue({...state, linkTo: ""});
    }
  }

  return <div>
    <div>Reading List</div>
    
    <SortableReadingList
      value={pages}
      setValue={(newValue: string[]) => changePages(newValue)}
      classes={classes}
    />
    <Components.AddTagOrWikiPage
      onlyTags={false}
      onTagSelected={({tagSlug}) => changePages([...pages, tagSlug])}
    />
  </div>
}

const ReadingListItem = ({contents, removeItem}: {
  contents: string
  removeItem: (item: string) => void
}) => {
  const classes = useStyles(styles);
  const {tag} = useTagBySlug(contents, "TagBasicInfo");
  if (!tag) {
    return <Components.Loading />
  }
  return <div>
    <div>{tag.name}</div>
    <div onClick={() => removeItem(contents)}>X</div>
  </div>
}
const SortableReadingList = makeSortableListComponent({
  renderItem: ReadingListItem
});

function urlHasArbitalPath(url: string): boolean {
  const parsedLinkTarget = tryParseUrl(url);
  const pathId = parsedLinkTarget?.searchParams.get("pathId");
  const pathPages = parsedLinkTarget?.searchParams.get("pathPages");
  return !!(pathId || pathPages);
}

function urlWithArbitalPathToPageSlugs(url: string): string[] {
  const parsedLinkTarget = tryParseUrl(url);
  const pathPages = parsedLinkTarget?.searchParams.get("pathPages");
  if (!pathPages) return [];
  return pathPages.split(',');
}

function addArbitalPathToLink(link: string, pages: string[]) {
  return `${link}?pathPages=${pages.join(",")}`;
}

function tryParseUrl(url: string): URL|null {
  try {
    const URL = getUrlClass();
    return new URL(url);
  } catch {
    return null;
  }
}

const EditCTAButtonSettingsComponent = registerComponent('EditCTAButtonSettings', EditCTAButtonSettings);
export default EditCTAButtonSettingsComponent;

declare global {
  interface ComponentTypes {
    EditCTAButtonSettings: typeof EditCTAButtonSettingsComponent
  }
}

