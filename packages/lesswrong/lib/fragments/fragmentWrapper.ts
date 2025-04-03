import mapValues from 'lodash/mapValues';

interface FragmentInfo {
  fragmentName: string
  fragmentText: string
}

// Get a fragment's name from its text
export function extractFragmentName(fragmentText: string): FragmentName {
  const match = fragmentText.match(/fragment (.*) on/)
  if (!match) throw new Error("Could not extract fragment name");
  return match[1] as FragmentName;
}

export function transformFragments(fragments: Record<string, FragmentInfo|(() => FragmentInfo)>) {
  return mapValues(fragments, (f: FragmentInfo|(() => FragmentInfo)) =>
    (typeof f === 'function')
      ? f().fragmentText
      : f.fragmentText
  );
}

export function frag(strings: TemplateStringsArray, ...values: (string|FragmentInfo|(() => FragmentInfo))[]): FragmentInfo {
  const sb: string[] = [];
  
  for (let i=0; i<strings.length; i++) {
    sb.push(strings[i]);
    if (i < values.length) {
      const val = values[i];
      if (typeof val === 'string') {
        sb.push(val);
      } else if (typeof val === 'function') {
        sb.push(val().fragmentName);
      } else {
        sb.push(val.fragmentName);
      }
    }
  }
  
  const fragmentText = sb.join('');
  return {
    fragmentName: extractFragmentName(fragmentText),
    fragmentText,
  };
}
