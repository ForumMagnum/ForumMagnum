/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {LexicalEditor} from 'lexical';
import React, { type JSX } from 'react';

import {
  AutoEmbedOption,
  EmbedConfig,
  EmbedMatchResult,
  LexicalAutoEmbedPlugin,
  URL_MATCHER,
} from '@lexical/react/LexicalAutoEmbedPlugin';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {useMemo, useState} from 'react';

import * as ReactDOM from 'react-dom';

import useModal from '../../hooks/useModal';
import Button from '../../ui/Button';
import {DialogActions} from '../../ui/Dialog';
import {INSERT_FIGMA_COMMAND} from '../FigmaPlugin';
// import {INSERT_TWEET_COMMAND} from '../../embeds/TwitterEmbed/TwitterPlugin';
import {INSERT_YOUTUBE_COMMAND} from '../../embeds/YouTubeEmbed/YouTubePlugin';
import {INSERT_METACULUS_COMMAND} from '../../embeds/MetaculusEmbed/MetaculusPlugin';
import {INSERT_THOUGHTSAVER_COMMAND} from '../../embeds/ThoughtsaverEmbed/ThoughtsaverPlugin';
import {INSERT_MANIFOLD_COMMAND} from '../../embeds/ManifoldEmbed/ManifoldPlugin';
import {INSERT_NEURONPEDIA_COMMAND} from '../../embeds/NeuronpediaEmbed/NeuronpediaPlugin';
import {INSERT_STRAWPOLL_COMMAND} from '../../embeds/StrawpollEmbed/StrawpollPlugin';
import {INSERT_METAFORECAST_COMMAND} from '../../embeds/MetaforecastEmbed/MetaforecastPlugin';
import {INSERT_OWID_COMMAND} from '../../embeds/OWIDEmbed/OWIDPlugin';
import {INSERT_ESTIMAKER_COMMAND} from '../../embeds/EstimakerEmbed/EstimakerPlugin';
import {INSERT_VIEWPOINTS_COMMAND} from '../../embeds/ViewpointsEmbed/ViewpointsPlugin';
import {INSERT_CALENDLY_COMMAND} from '../../embeds/CalendlyEmbed/CalendlyPlugin';
import {INSERT_LWARTIFACTS_COMMAND} from '../../embeds/LWArtifactsEmbed/LWArtifactsPlugin';
import { YoutubeIcon } from '../../icons/YoutubeIcon';
// import { XIcon } from '../../icons/XIcon';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import {
  typeaheadPopover,
  typeaheadList,
  typeaheadListItem,
  typeaheadItem,
  typeaheadItemText,
} from '../../styles/typeaheadStyles';

const styles = defineStyles('LexicalAutoEmbed', (theme: ThemeType) => ({
  popover: typeaheadPopover(theme),
  list: typeaheadList(theme),
  listItem: typeaheadListItem(theme),
  item: typeaheadItem(theme),
  text: typeaheadItemText(),
}));

interface PlaygroundEmbedConfig extends EmbedConfig {
  // Human readable name of the embedded content e.g. Tweet or Google Map.
  contentName: string;

  // Icon for display.
  icon?: JSX.Element;

  // An example of a matching url https://twitter.com/jack/status/20
  exampleUrl: string;

  // For extra searching.
  keywords: Array<string>;

  // Embed a Figma Project.
  description?: string;
}

const embedIconStyle = { display: 'flex', width: 20, height: 20, marginRight: 8, opacity: 0.6 };

export const YoutubeEmbedConfig: PlaygroundEmbedConfig = {
  contentName: 'Youtube Video',

  exampleUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',

  // Icon for display.
  icon: <YoutubeIcon style={embedIconStyle} />,

  insertNode: (editor: LexicalEditor, result: EmbedMatchResult) => {
    editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, result.id);
  },

  keywords: ['youtube', 'video'],

  // Determine if a given URL is a match and return url data.
  parseUrl: async (url: string) => {
    const match =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/.exec(url);

    const id = match ? (match?.[2].length === 11 ? match[2] : null) : null;

    if (id != null) {
      return {
        id,
        url,
      };
    }

    return null;
  },

  type: 'youtube-video',
};

/*
/*
export const TwitterEmbedConfig: PlaygroundEmbedConfig = {
  // e.g. Tweet or Google Map.
  contentName: 'X(Tweet)',

  exampleUrl: 'https://x.com/jack/status/20',

  // Icon for display.
  icon: <XIcon style={embedIconStyle} />,

  // Create the Lexical embed node from the url data.
  insertNode: (editor: LexicalEditor, result: EmbedMatchResult) => {
    editor.dispatchCommand(INSERT_TWEET_COMMAND, result.id);
  },

  // For extra searching.
  keywords: ['tweet', 'twitter', 'x'],

  // Determine if a given URL is a match and return url data.
  parseUrl: (text: string) => {
    const match =
      /^https:\/\/(twitter|x)\.com\/(#!\/)?(\w+)\/status(es)*\/(\d+)/.exec(
        text,
      );

    if (match != null) {
      return {
        id: match[5],
        url: match[1],
      };
    }

    return null;
  },

  type: 'tweet',
};
*/

export const MetaculusEmbedConfig: PlaygroundEmbedConfig = {
  contentName: 'Metaculus',

  exampleUrl: 'https://www.metaculus.com/questions/12345',

  insertNode: (editor: LexicalEditor, result: EmbedMatchResult) => {
    editor.dispatchCommand(INSERT_METACULUS_COMMAND, result.id);
  },

  keywords: ['metaculus', 'forecast', 'prediction'],

  parseUrl: (text: string) => {
    const match =
      /^https?:\/\/(www\.)?metaculus\.com\/questions\/(\d+)/.exec(text);

    if (match != null) {
      return {
        id: match[2],
        url: match[0],
      };
    }

    return null;
  },

  type: 'metaculus',
};

export const ThoughtsaverEmbedConfig: PlaygroundEmbedConfig = {
  contentName: 'Thoughtsaver',

  exampleUrl: 'https://app.thoughtsaver.com/embed/...',

  insertNode: (editor: LexicalEditor, result: EmbedMatchResult) => {
    editor.dispatchCommand(INSERT_THOUGHTSAVER_COMMAND, result.id);
  },

  keywords: ['thoughtsaver', 'flashcards'],

  parseUrl: (text: string) => {
    const match =
      /^https?:\/\/app\.thoughtsaver\.com\/embed\/([a-zA-Z0-9?&_=-]*)/.exec(
        text,
      );

    if (match != null) {
      return {
        id: match[1],
        url: match[0],
      };
    }

    return null;
  },

  type: 'thoughtsaver',
};

export const ManifoldEmbedConfig: PlaygroundEmbedConfig = {
  contentName: 'Manifold',

  exampleUrl: 'https://manifold.markets/user/market-slug',

  insertNode: (editor: LexicalEditor, result: EmbedMatchResult) => {
    editor.dispatchCommand(INSERT_MANIFOLD_COMMAND, result.id);
  },

  keywords: ['manifold', 'market', 'prediction'],

  parseUrl: (text: string) => {
    const match =
      /^(?:https?:\/\/)?(?:www\.)?manifold\.markets\/(?:embed\/)?([^?#]+)/.exec(
        text,
      );

    if (match != null) {
      return {
        id: match[1],
        url: text.startsWith('http') ? text : `https://${match[0]}`,
      };
    }

    return null;
  },

  type: 'manifold',
};

export const NeuronpediaEmbedConfig: PlaygroundEmbedConfig = {
  contentName: 'Neuronpedia',

  exampleUrl: 'https://neuronpedia.org/...&embed=true',

  insertNode: (editor: LexicalEditor, result: EmbedMatchResult) => {
    editor.dispatchCommand(INSERT_NEURONPEDIA_COMMAND, result.id);
  },

  keywords: ['neuronpedia', 'embed'],

  parseUrl: (text: string) => {
    if (!/neuronpedia\.org/.test(text)) {
      return null;
    }
    if (!/embed=true/.test(text)) {
      return null;
    }
    return {
      id: text,
      url: text,
    };
  },

  type: 'neuronpedia',
};

export const StrawpollEmbedConfig: PlaygroundEmbedConfig = {
  contentName: 'StrawPoll',

  exampleUrl: 'https://strawpoll.com/polls/...',

  insertNode: (editor: LexicalEditor, result: EmbedMatchResult) => {
    editor.dispatchCommand(INSERT_STRAWPOLL_COMMAND, result.id);
  },

  keywords: ['strawpoll', 'poll'],

  parseUrl: (text: string) => {
    const match =
      /^https?:\/\/strawpoll\.com\/(polls\/)?([\w-]+)\/?$/.exec(text);

    if (match != null) {
      return {
        id: match[2],
        url: match[0],
      };
    }

    return null;
  },

  type: 'strawpoll',
};

export const MetaforecastEmbedConfig: PlaygroundEmbedConfig = {
  contentName: 'Metaforecast',

  exampleUrl: 'https://metaforecast.org/questions/...',

  insertNode: (editor: LexicalEditor, result: EmbedMatchResult) => {
    editor.dispatchCommand(INSERT_METAFORECAST_COMMAND, result.id);
  },

  keywords: ['metaforecast', 'forecast'],

  parseUrl: (text: string) => {
    const match =
      /^https?:\/\/metaforecast\.org\/questions\/([\w-]+)\/?$/.exec(text);

    if (match != null) {
      return {
        id: match[1],
        url: match[0],
      };
    }

    return null;
  },

  type: 'metaforecast',
};

export const OWIDEmbedConfig: PlaygroundEmbedConfig = {
  contentName: 'Our World In Data',

  exampleUrl: 'https://ourworldindata.org/grapher/...',

  insertNode: (editor: LexicalEditor, result: EmbedMatchResult) => {
    editor.dispatchCommand(INSERT_OWID_COMMAND, result.id);
  },

  keywords: ['our world in data', 'owid', 'grapher'],

  parseUrl: (text: string) => {
    const match =
      /^https?:\/\/ourworldindata\.org\/grapher\/([\w-]+)/.exec(text);

    if (match != null) {
      return {
        id: match[1],
        url: match[0],
      };
    }

    return null;
  },

  type: 'owid',
};

export const EstimakerEmbedConfig: PlaygroundEmbedConfig = {
  contentName: 'Estimaker',

  exampleUrl: 'https://estimaker.app/_/...',

  insertNode: (editor: LexicalEditor, result: EmbedMatchResult) => {
    editor.dispatchCommand(INSERT_ESTIMAKER_COMMAND, result.id);
  },

  keywords: ['estimaker'],

  parseUrl: (text: string) => {
    const match = /^https?:\/\/estimaker\.app\/_\/[\w-]+/.exec(text);

    if (match != null) {
      return {
        id: match[0],
        url: match[0],
      };
    }

    return null;
  },

  type: 'estimaker',
};

export const ViewpointsEmbedConfig: PlaygroundEmbedConfig = {
  contentName: 'Viewpoints',

  exampleUrl: 'https://viewpoints.xyz/polls/...',

  insertNode: (editor: LexicalEditor, result: EmbedMatchResult) => {
    editor.dispatchCommand(INSERT_VIEWPOINTS_COMMAND, result.id);
  },

  keywords: ['viewpoints', 'poll'],

  parseUrl: (text: string) => {
    const match =
      /^https?:\/\/viewpoints\.xyz\/polls\/([\w-]+)\/?$/.exec(text);

    if (match != null) {
      return {
        id: match[1],
        url: match[0],
      };
    }

    return null;
  },

  type: 'viewpoints',
};

export const CalendlyEmbedConfig: PlaygroundEmbedConfig = {
  contentName: 'Calendly',

  exampleUrl: 'https://calendly.com/your-org/meeting',

  insertNode: (editor: LexicalEditor, result: EmbedMatchResult) => {
    editor.dispatchCommand(INSERT_CALENDLY_COMMAND, result.id);
  },

  keywords: ['calendly', 'schedule'],

  parseUrl: (text: string) => {
    const match =
      /^https?:\/\/calendly\.com\/[\w-]+(\/[\w-]+)?\/?$/.exec(text);

    if (match != null) {
      return {
        id: match[0],
        url: match[0],
      };
    }

    return null;
  },

  type: 'calendly',
};

export const LWArtifactsEmbedConfig: PlaygroundEmbedConfig = {
  contentName: 'LW Artifacts',

  exampleUrl: 'https://lwartifacts.vercel.app/artifacts/...',

  insertNode: (editor: LexicalEditor, result: EmbedMatchResult) => {
    editor.dispatchCommand(INSERT_LWARTIFACTS_COMMAND, result.id);
  },

  keywords: ['lwartifacts', 'lw artifacts'],

  parseUrl: (text: string) => {
    const match =
      /^https?:\/\/lwartifacts\.vercel\.app\/artifacts\/([\w-]+)/.exec(text);

    if (match != null) {
      return {
        id: `lwartifacts.vercel.app/artifacts/${match[1]}`,
        url: match[0],
      };
    }

    return null;
  },

  type: 'lwartifacts',
};

// export const FigmaEmbedConfig: PlaygroundEmbedConfig = {
//   contentName: 'Figma Document',

//   exampleUrl: 'https://www.figma.com/file/LKQ4FJ4bTnCSjedbRpk931/Sample-File',

//   icon: <FigmaIcon style={embedIconStyle} />,

//   insertNode: (editor: LexicalEditor, result: EmbedMatchResult) => {
//     editor.dispatchCommand(INSERT_FIGMA_COMMAND, result.id);
//   },

//   keywords: ['figma', 'figma.com', 'mock-up'],

//   // Determine if a given URL is a match and return url data.
//   parseUrl: (text: string) => {
//     const match =
//       /https:\/\/([\w.-]+\.)?figma.com\/(file|proto)\/([0-9a-zA-Z]{22,128})(?:\/.*)?$/.exec(
//         text,
//       );

//     if (match != null) {
//       return {
//         id: match[3],
//         url: match[0],
//       };
//     }

//     return null;
//   },

//   type: 'figma',
// };

export const EmbedConfigs = [
  // TwitterEmbedConfig,
  YoutubeEmbedConfig,
  MetaculusEmbedConfig,
  ThoughtsaverEmbedConfig,
  ManifoldEmbedConfig,
  NeuronpediaEmbedConfig,
  StrawpollEmbedConfig,
  MetaforecastEmbedConfig,
  OWIDEmbedConfig,
  EstimakerEmbedConfig,
  ViewpointsEmbedConfig,
  CalendlyEmbedConfig,
  LWArtifactsEmbedConfig,
  // FigmaEmbedConfig,
];

function AutoEmbedMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
  classes,
}: {
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: AutoEmbedOption;
  classes: Record<string, string>;
}) {
  return (
    <li
      key={option.key}
      tabIndex={-1}
      className={classNames(classes.item, classes.listItem, { selected: isSelected })}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={'typeahead-item-' + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}>
      <span className={classes.text}>{option.title}</span>
    </li>
  );
}

function AutoEmbedMenu({
  options,
  selectedItemIndex,
  onOptionClick,
  onOptionMouseEnter,
  classes,
}: {
  selectedItemIndex: number | null;
  onOptionClick: (option: AutoEmbedOption, index: number) => void;
  onOptionMouseEnter: (index: number) => void;
  options: Array<AutoEmbedOption>;
  classes: Record<string, string>;
}) {
  return (
    <div className={classes.popover}>
      <ul className={classes.list}>
        {options.map((option: AutoEmbedOption, i: number) => (
          <AutoEmbedMenuItem
            index={i}
            isSelected={selectedItemIndex === i}
            onClick={() => onOptionClick(option, i)}
            onMouseEnter={() => onOptionMouseEnter(i)}
            key={option.key}
            option={option}
            classes={classes}
          />
        ))}
      </ul>
    </div>
  );
}

const debounce = (callback: (text: string) => void, delay: number) => {
  let timeoutId: number;
  return (text: string) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback(text);
    }, delay);
  };
};

export function AutoEmbedDialog({
  embedConfig,
  onClose,
}: {
  embedConfig: PlaygroundEmbedConfig;
  onClose: () => void;
}): JSX.Element {
  const [text, setText] = useState('');
  const [editor] = useLexicalComposerContext();
  const [embedResult, setEmbedResult] = useState<EmbedMatchResult | null>(null);

  const validateText = useMemo(
    () =>
      debounce((inputText: string) => {
        const urlMatch = URL_MATCHER.exec(inputText);
        if (embedConfig != null && inputText != null && urlMatch != null) {
          void Promise.resolve(embedConfig.parseUrl(inputText)).then(
            (parseResult) => {
              setEmbedResult(parseResult);
            },
          );
        } else if (embedResult != null) {
          setEmbedResult(null);
        }
      }, 200),
    [embedConfig, embedResult],
  );

  const onClick = () => {
    if (embedResult != null) {
      embedConfig.insertNode(editor, embedResult);
      onClose();
    }
  };

  return (
    <div style={{width: '600px'}}>
      <div className="Input__wrapper">
        <input
          type="text"
          className="Input__input"
          placeholder={embedConfig.exampleUrl}
          value={text}
          data-test-id={`${embedConfig.type}-embed-modal-url`}
          onChange={(e) => {
            const {value} = e.target;
            setText(value);
            validateText(value);
          }}
        />
      </div>
      <DialogActions>
        <Button
          disabled={!embedResult}
          onClick={onClick}
          data-test-id={`${embedConfig.type}-embed-modal-submit-btn`}>
          Embed
        </Button>
      </DialogActions>
    </div>
  );
}

export default function AutoEmbedPlugin(): JSX.Element {
  const [modal, showModal] = useModal();

  const openEmbedModal = (embedConfig: PlaygroundEmbedConfig) => {
    showModal(`Embed ${embedConfig.contentName}`, (onClose) => (
      <AutoEmbedDialog embedConfig={embedConfig} onClose={onClose} />
    ));
  };

  const getMenuOptions = (
    activeEmbedConfig: PlaygroundEmbedConfig,
    embedFn: () => void,
    dismissFn: () => void,
  ) => {
    return [
      new AutoEmbedOption('Dismiss', {
        onSelect: dismissFn,
      }),
      new AutoEmbedOption(`Embed ${activeEmbedConfig.contentName}`, {
        onSelect: embedFn,
      }),
    ];
  };

  const classes = useStyles(styles);

  return (
    <>
      {modal}
      <LexicalAutoEmbedPlugin<PlaygroundEmbedConfig>
        embedConfigs={EmbedConfigs}
        onOpenEmbedModalForConfig={openEmbedModal}
        getMenuOptions={getMenuOptions}
        menuRenderFn={(
          anchorElementRef,
          {selectedIndex, options, selectOptionAndCleanUp, setHighlightedIndex},
        ) =>
          anchorElementRef.current
            ? ReactDOM.createPortal(
                <div
                  className={classes.popover}
                  style={{
                    marginLeft: `${Math.max(
                      parseFloat(anchorElementRef.current.style.width) - 200,
                      0,
                    )}px`,
                    width: 200,
                  }}>
                  <AutoEmbedMenu
                    options={options}
                    selectedItemIndex={selectedIndex}
                    onOptionClick={(option: AutoEmbedOption, index: number) => {
                      setHighlightedIndex(index);
                      selectOptionAndCleanUp(option);
                    }}
                    onOptionMouseEnter={(index: number) => {
                      setHighlightedIndex(index);
                    }}
                    classes={classes}
                  />
                </div>,
                anchorElementRef.current,
              )
            : null
        }
      />
    </>
  );
}
