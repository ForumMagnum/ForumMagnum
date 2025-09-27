import { namesAttachedReactions, NamesAttachedReactionType } from './reactions';
import uniq from 'lodash/uniq';

// List View Sections
export const listPrimary = [
  'agree', 'disagree', 'important', 'dontUnderstand', 'plus', 'shrug', 'thumbs-up', 'thumbs-down', 'seen', 
];

export const listEmotions = [
  'smile', 'laugh', 'sad', 'disappointed', 'confused', 'thinking', 'oops', 'surprise', 'excitement', 
];

export const listViewSectionB = [
  'changemind',   'changed-mind-on-point',
  'heart', 'goodpoint',
  'thanks', 'typo',      
  'why', 'resolved',  
  'beautiful',  'hat', 
  'offtopic', 'coveredAlready2',
];

export const listViewSectionC = [
  'strong-argument', 'weak-argument',
  'crux',         'notacrux',
  'hitsTheMark',  'miss',
  'strawman', 'nitpick', 
  'addc', 'bet',
  'llm-smell','bowels', 
  'moloch','paperclip',   
];

export const listViewSectionD = [
  'clear',        'muddled', 
  'scholarship', 'facilitation', 
  'concrete',     'examples',
  'scout',        'soldier',
  'unnecessarily-combative', 'sneer', 
];

// Grid View Sections
export const gridPrimary = [
  'agree', 'disagree', 'important', 'dontUnderstand', 'plus', 'shrug', 'thumbs-up', 'thumbs-down', 'seen',  
];

export const gridEmotions = [
  'smile', 'laugh', 'sad', 'disappointed', 'confused', 'thinking', 'oops', 'surprise', 'excitement',  
];

export const gridSectionB = [
  'changemind',           'strong-argument', 'crux',       'hitsTheMark', 'clear','concrete', 'scout',  'moloch','why',
  'changed-mind-on-point','weak-argument',  'notacrux', 'miss','muddled', 'examples',  'soldier','paperclip',   'resolved', 
  
  
];

export const gridSectionC = [
  'heart', 'coveredAlready2', 'beautiful','goodpoint', 'strawman','addc', 'llm-smell', 'scholarship', 'unnecessarily-combative', 
  'thanks',      'hat', 'nitpick', 'offtopic','facilitation','bowels', 'typo', 'bet',  'sneer', 
];

export const likelihoods = [
  '1percent', '10percent', '25percent', '40percent', '50percent', '60percent', '75percent', '90percent', '99percent',
];

export const getAllCuratedReactionNames = (): string[] => {
  return uniq([
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
  ]);
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
