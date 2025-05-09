import React, { FC, ReactNode } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { DnaIcon } from '../icons/dnaIcon';
import { MushroomCloudIcon } from '../icons/mushroomCloudIcon';
import { CausePrioIcon } from '../icons/causePrioIcon';
import { ScrollIcon } from '../icons/scrollIcon';
import { BirdIcon } from '../icons/birdIcon';
import { ChickenIcon } from '../icons/chickenIcon';
import { ChoiceIcon } from '../icons/choiceIcon';
import { AiIcon } from '../icons/aiIcon';
import { GiveIcon } from '../icons/giveIcon';
import { TelescopeIcon } from '../icons/telescopeIcon';
import { GhdIcon } from '../icons/ghdIcon';
import { GroupsIcon } from '../icons/groupsIcon';
import { PolicyIcon } from '../icons/policyIcon';
import { forumSelect } from '../../lib/forumTypeUtils';
import { LotusOutlineIcon } from '../icons/lotusIcon';
import classNames from 'classnames';

// Mapping from tag slug to icon
export const coreTagIconMap = forumSelect<Record<string, FC<{className?: string}>>>({
  EAForum: {
    'biosecurity-and-pandemics': DnaIcon,
    'existential-risk': MushroomCloudIcon,
    'global-catastrophic-risk': MushroomCloudIcon, // (Possibly) replacing existential-risk
    'cause-prioritization': CausePrioIcon,
    'moral-philosophy': ScrollIcon,
    'philosophy': ScrollIcon, // Replacing moral-philosophy
    'wild-animal-welfare': BirdIcon,
    'farmed-animal-welfare': ChickenIcon,
    'animal-welfare': BirdIcon, // Replacing wild-animal-welfare and farmed-animal-welfare
    'effective-altruism-groups': GroupsIcon,
    'building-effective-altruism': GroupsIcon,
    'community': LotusOutlineIcon,
    'career-choice': ChoiceIcon,
    'taking-action': ChoiceIcon, // Doesn't exist yet, but may be replacing career-choice
    'ai-risk': AiIcon,
    'ai-safety': AiIcon, // Replacing ai-risk
    'global-health-and-development': GhdIcon,
    'policy': PolicyIcon,
    'effective-giving': GiveIcon,
    'forecasting-and-estimation': TelescopeIcon,
  },
  default: {}
})

const styles = (theme: ThemeType) => ({
  // prevent LotusOutlineIcon from having a fill
  noFill: {
    fill: 'none !important'
  }
});

const CoreTagIconInner = ({tag, fallbackNode, className, classes}: {
  tag: {slug: string},
  fallbackNode?: ReactNode,
  className?: string,
  classes: ClassesType<typeof styles>
}) => {
  const Icon = coreTagIconMap[tag.slug]
  if (!Icon) {
    return fallbackNode ? <>{fallbackNode}</> : null
  }
  return <Icon className={classNames(className, {[classes.noFill]: Icon === LotusOutlineIcon})} />
}

export const CoreTagIcon = registerComponent("CoreTagIcon", CoreTagIconInner, {styles});


