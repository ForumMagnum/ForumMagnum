import { namesAttachedReactions, NamesAttachedReactionType } from './reactions';

// List View Sections
export const listPrimary = [
  'agree', 'disagree', 'important', 'dontUnderstand', 'shrug', 'thinking', 'surprise', 'seen', 'thanks', 
];

export const listEmotions = [
  'smile', 'laugh', 'disappointed', 'confused', 'roll', 'excitement', 'thumbs-up', 'thumbs-down', 'paperclip', 
];

export const listViewSectionB = [
  'changemind',   'insightful',
  'thanks',       'heart',
  'typo',         'why', 
  'offtopic',     'elaborate',
];

export const listViewSectionC = [
  'hitsTheMark',  'miss',
  'crux',         'notacrux',
  'locallyValid', 'locallyInvalid',
  'facilitation', 'unnecessarily-combative',
  'yeswhatimean', 'strawman',
  'concrete',     'examples',
  'clear',        'muddled',
  'betTrue',      'betFalse',
  'scout',        'soldier',
];

export const listViewSectionD = [
  'scholarship',  'taboo',             
  'coveredAlready','timecost',
];

// Grid View Sections
export const gridPrimary = [
  'agree', 'disagree', 'important', 'dontUnderstand', 'changemind', 'shrug', 'thinking', 'surprise', 'seen',  
];

export const gridEmotions = [
  'smile', 'laugh', 'disappointed', 'confused', 'roll', 'excitement', 'thumbs-up', 'thumbs-down', 'thanks', 
];

export const gridSectionB = [
  'crux',       'hitsTheMark', 'locallyValid',   'scout',     'facilitation',             'concrete',  'yeswhatimean', 'clear', 'betTrue',
  'notacrux',   'miss',        'locallyInvalid', 'soldier',   'unnecessarily-combative','examples',  'strawman',     'muddled', 'betFalse',
];

export const gridSectionC = [
  'heart', 'insightful', 'taboo',  'offtopic',  'elaborate',  'timecost',  'typo', 'scholarship', 'why'
];

export const likelihoods = [
  '1percent', '10percent', '25percent', '40percent', '50percent', '60percent', '75percent', '90percent', '99percent',
];

export const getAllCuratedReactionNames = (): string[] => {
  return [
    ...listPrimary,
    ...listEmotions,
    ...listViewSectionB,
    ...listViewSectionC,
    ...listViewSectionD,
    ...gridPrimary,
    ...gridEmotions,
    ...gridSectionB,
    ...gridSectionC,
    ...likelihoods
  ].filter((name, index, self) => self.indexOf(name) === index);
};

// Filter reactions to only include curated and non-deprecated ones
export const getCuratedActiveReactions = (searchText: string = ''): NamesAttachedReactionType[] => {
  const curatedNames = getAllCuratedReactionNames();
  const activeReacts = namesAttachedReactions.filter(r => 
    !r.deprecated && curatedNames.includes(r.name)
  );
  
  if (!searchText || !searchText.length) {
    return activeReacts;
  }
  
  const searchLower = searchText.toLowerCase();
  return activeReacts.filter(
    reaction => reaction.name.toLowerCase().startsWith(searchLower)
      || reaction.label.toLowerCase().startsWith(searchLower)
      || reaction.searchTerms?.some(searchTerm => searchTerm.toLowerCase().startsWith(searchLower))
  );
}; 
