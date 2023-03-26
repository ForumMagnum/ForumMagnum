import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
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

// Mapping from tag slug to icon
// Don't want to fight the type system about the type of the MUI icon
export const coreTagIconMap = forumSelect<Record<string, any>>({
  EAForum: {
    biosecurity: DnaIcon,
    'biosecurity-and-pandemic-preparedness': DnaIcon, // Replacing biosecurity
    'existential-risk': MushroomCloudIcon,
    'global-catastrophic-risk': MushroomCloudIcon, // (Possibly) replacing existential-risk
    'cause-prioritization': CausePrioIcon,
    'moral-philosophy': ScrollIcon,
    'philosophy': ScrollIcon, // Replacing moral-philosophy
    'wild-animal-welfare': BirdIcon,
    'farmed-animal-welfare': ChickenIcon,
    'animal-welfare': BirdIcon, // Replacing wild-animal-welfare and farmed-animal-welfare
    'effective-altruism-groups': GroupsIcon,
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

const CoreTagIcon = ({tag}: {tag: {slug: string}}) => {
  const Icon = coreTagIconMap[tag.slug]
  if (!Icon) return null
  return <Icon />
}

const CoreTagIconComponent = registerComponent("CoreTagIcon", CoreTagIcon);

declare global {
  interface ComponentTypes {
    CoreTagIcon: typeof CoreTagIconComponent
  }
}
