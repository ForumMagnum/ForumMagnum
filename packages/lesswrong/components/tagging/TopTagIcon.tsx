import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import PeopleIcon from '@material-ui/icons/People';
import EarthIcon from '@material-ui/icons/Public';
import GavelIcon from '@material-ui/icons/Gavel';
import { DnaIcon } from '../icons/dnaIcon';
import { MushroomCloudIcon } from '../icons/mushroomCloudIcon';
import { GlobeIcon } from '../icons/globeIcon';
import { ScrollIcon } from '../icons/scrollIcon';
import { BirdIcon } from '../icons/birdIcon';
import { ChickenIcon } from '../icons/chickenIcon';
import { ChoiceIcon } from '../icons/choiceIcon';
import { ChipIcon } from '../icons/chipIcon';
import { GiveIcon } from '../icons/giveIcon';
import { TelescopeIcon } from '../icons/telescopeIcon';
import { forumSelect } from '../../lib/forumTypeUtils';

// Mapping from tag slug to icon
// Don't want to fight the type system about the type of the MUI icon
export const topTagIconMap = forumSelect<Record<string, any>>({
  EAForum: {
    biosecurity: DnaIcon,
    'biosecurity-and-pandemic-preparedness': DnaIcon, // Replacing biosecurity
    'existential-risk': MushroomCloudIcon,
    'global-catastrophic-risk': MushroomCloudIcon, // (Possibly) replacing existential-risk
    'cause-prioritization': GlobeIcon,
    'moral-philosophy': ScrollIcon,
    'philosophy': ScrollIcon, // Replacing moral-philosophy
    'wild-animal-welfare': BirdIcon,
    'farmed-animal-welfare': ChickenIcon,
    'animal-welfare': BirdIcon, // Replacing wild-animal-welfare and farmed-animal-welfare
    'effective-altruism-groups': PeopleIcon,
    'career-choice': ChoiceIcon,
    'taking-action': ChoiceIcon, // Doesn't exist yet, but may be replacing career-choice
    'ai-risk': ChipIcon,
    'ai-safety': ChipIcon, // Replacing ai-risk
    'global-health-and-development': EarthIcon,
    'policy': GavelIcon,
    'effective-giving': GiveIcon,
    'forecasting-and-estimation': TelescopeIcon,
  },
  default: {}
})

const TopTagIcon = ({tag}: {tag: {slug: string}}) => {
  const Icon = topTagIconMap[tag.slug]
  if (!Icon) return null
  return <Icon />
}

const TopTagIconComponent = registerComponent("TopTagIcon", TopTagIcon);

declare global {
  interface ComponentTypes {
    TopTagIcon: typeof TopTagIconComponent
  }
}
