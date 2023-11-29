const fs = require('fs');
const { spawnSync } = require('child_process');

const fragmentsFilePath = 'packages/lesswrong/lib/generated/fragmentTypes.d.ts';

/*
 * Experimentally determine which fields in our graphql fragments are unused,
 * by going line by line through fragmentTypes.d.ts, commenting out one line at
 * a time, running Typescript, and seeing if the omission of that line caused
 * a type error.
 *
 * This is *extremely* slow (tends of seconds per line * thousands of lines),
 * so if you run this, you probably want to run it overnight. This could be done
 * much much faster by using a language server and find-usages (or the
 * find-usages feature in an IDE), but this was easier to automate and I'm only
 * planning on running it once, unattended.
 */

function main() {
  const fragmentsFile = fs.readFileSync(fragmentsFilePath, 'utf8');
  const fragmentsFileLines = fragmentsFile.split('\n');
  
  if(hasAnyTypeErrors()) {
    console.error("Can't run unused fragment-field detection: There are already type errors.");
    return;
  }
  
  for(let i=0; i<fragmentsFileLines.length; i++) {
    const line = fragmentsFileLines[i];
    if(!lineIsTestableFragmentField(line)) {
      console.log(line);
      continue;
    }
    let linesWithOneCommented = [...fragmentsFileLines];
    linesWithOneCommented [i] = `//${line} //Commented out my markUnusedFragmentFields.js for test`;
    const fileWithLineCommented = linesWithOneCommented.join("\n");
    fs.writeFileSync(fragmentsFilePath, fileWithLineCommented, 'utf8');
    
    if(hasAnyTypeErrors()) {
      console.log(line);
    } else {
      console.log(`${line} //UNUSED`);
    }
  }
}

function lineIsTestableFragmentField(line) {
  let numOpenCurlies = countStrsInStr(line, "{");
  let numCloseCurlies = countStrsInStr(line, "}");
  if(numOpenCurlies !== numCloseCurlies) {
    return false;
  }
  if(line.trim().length == 0) {
    return false;
  }
  if(line.trim().startsWith("//")) {
    return false;
  }
  
  return true;
}

function countStrsInStr(haystack, needle) {
  if(needle.length === 0 || haystack.length === 0) {
    return 0;
  }
  return (haystack.split(needle).length - 1);
}

function hasAnyTypeErrors() {
  const result = spawnSync('yarn', ['run', '--silent', 'tsc']);
  const exitStatus = result.status;
  
  return exitStatus!==0;
}

main();
