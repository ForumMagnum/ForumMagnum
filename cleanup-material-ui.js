#!/usr/bin/env node

/**
 * Script to remove unused Material-UI vendor files identified by knip
 * 
 * This script reads the output from knip, filters for Material-UI files,
 * and safely removes them after confirmation.
 * It preserves .d.ts files that are associated with components we're using.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const MATERIAL_UI_PATH = 'packages/lesswrong/lib/vendor/@material-ui/';
const BACKUP_DIR = 'material-ui-backup';

// Read the knip results
console.log('Running knip to identify unused Material-UI files...');
try {
  // Run knip and filter for Material-UI files only
  const output = execSync('npx knip --include files | grep "@material-ui"', { encoding: 'utf-8' });
  const allUnusedFiles = output.split('\n').filter(line => line.trim() !== '');
  
  if (allUnusedFiles.length === 0) {
    console.log('No unused Material-UI files found.');
    process.exit(0);
  }

  console.log(`Found ${allUnusedFiles.length} potential unused Material-UI files.`);
  
  // Filter out .d.ts files that are associated with components we're using
  const dtsFiles = allUnusedFiles.filter(file => file.endsWith('.d.ts'));
  const nonDtsFiles = allUnusedFiles.filter(file => !file.endsWith('.d.ts'));
  
  console.log(`Found ${dtsFiles.length} .d.ts files among the unused files.`);
  
  // Find which .d.ts files to preserve
  const dtsToPreserve = [];
  
  // First, find all used Material-UI modules/components in the codebase
  console.log('Analyzing Material-UI usage in the codebase...');
  
  // Identify which Material-UI packages are used
  try {
    // A more general search for any Material-UI imports in the codebase
    // Use a simpler pattern that's less likely to cause escaping issues
    console.log('Searching for Material-UI imports...');
    const importFinderCmd = `grep -r --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" "@material-ui" packages/lesswrong/`;
    const importResults = execSync(importFinderCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    
    if (!importResults) {
      console.log('No Material-UI imports found. Processing all files as unused.');
    } else {
      console.log('Found Material-UI imports in the codebase.');
      
      // Extract the package paths from imports
      const importLines = importResults.split('\n');
      console.log(`Found ${importLines.length} lines with Material-UI imports.`);
      
      // Create a map of material-ui modules being used
      const usedModules = new Set();
      
      importLines.forEach(line => {
        // Filter for actual import statements and extract module paths
        if (line.includes('from') && line.includes('@material-ui/')) {
          // Extract module path with a more reliable pattern
          const moduleMatch = line.match(/@material-ui\/[a-zA-Z0-9-]+/);
          if (moduleMatch && moduleMatch[0]) {
            usedModules.add(moduleMatch[0]);
          }
        }
      });
      
      console.log(`Identified ${usedModules.size} Material-UI modules in use: ${Array.from(usedModules).join(', ')}`);
      
      // Now check each .d.ts file to see if it belongs to a module we're using
      for (const dtsFile of dtsFiles) {
        // Get the module path from the file path
        // E.g., packages/lesswrong/lib/vendor/@material-ui/core/Button.d.ts -> @material-ui/core
        const modulePathMatch = dtsFile.match(/(@material-ui\/[^/]+)/);
        
        if (modulePathMatch && modulePathMatch[1]) {
          const modulePath = modulePathMatch[1];
          
          if (usedModules.has(modulePath)) {
            // This .d.ts file belongs to a module we're using
            console.log(`Preserving ${dtsFile} - its module '${modulePath}' is used in codebase`);
            dtsToPreserve.push(dtsFile);
            continue;
          }
        }
        
        // As a fallback, also check for the specific component name
        const filePathParts = dtsFile.split('/');
        const fileName = filePathParts[filePathParts.length - 1];
        const componentName = fileName.replace('.d.ts', '');
        
        // Skip index.d.ts files that we'll handle separately
        if (componentName === 'index') {
          // Include all index.d.ts files from modules that are used
          const modulePathMatch = dtsFile.match(/(@material-ui\/[^/]+)/);
          if (modulePathMatch && modulePathMatch[1] && usedModules.has(modulePathMatch[1])) {
            console.log(`Preserving module definition file ${dtsFile}`);
            dtsToPreserve.push(dtsFile);
          }
          continue;
        }
        
        try {
          // Simplify component search with multiple separate grep calls
          // instead of complex patterns
          let isUsed = false;
          
          // Check for the component name in import statements
          try {
            const importGrepCmd = `grep -r --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" "import.*${componentName}" packages/lesswrong/`;
            const importResult = execSync(importGrepCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
            if (importResult) {
              isUsed = true;
            }
          } catch (e) {
            // No matches found, continue
          }
          
          // If not found in imports, check for JSX usage
          if (!isUsed) {
            try {
              const jsxGrepCmd = `grep -r --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" "<${componentName}[ />]" packages/lesswrong/`;
              const jsxResult = execSync(jsxGrepCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
              if (jsxResult) {
                isUsed = true;
              }
            } catch (e) {
              // No matches found, continue
            }
          }
          
          if (isUsed) {
            console.log(`Preserving ${dtsFile} - component '${componentName}' is used in codebase`);
            dtsToPreserve.push(dtsFile);
          }
        } catch (err) {
          console.log(`Error checking usage for component ${componentName}: ${err.message}`);
          // Error during search, continue with next file
        }
      }
    }
  } catch (err) {
    console.error('Error while analyzing Material-UI usage:', err.message);
    
    // Fallback: preserve all .d.ts files if we can't determine what's used
    console.log('Due to error, preserving all .d.ts files to be safe.');
    dtsToPreserve.push(...dtsFiles);
  }
  
  // Final list of files to remove
  const unusedFiles = [...nonDtsFiles, ...dtsFiles.filter(file => !dtsToPreserve.includes(file))];
  
  console.log(`\nSummary before removal:`);
  console.log(`- Total flagged files: ${allUnusedFiles.length}`);
  console.log(`- .d.ts files to preserve: ${dtsToPreserve.length}`);
  console.log(`- Files to remove: ${unusedFiles.length}`);
  
  if (unusedFiles.length === 0) {
    console.log('No files to remove after filtering.');
    process.exit(0);
  }
  
  // Create a backup directory
  const backupDir = path.join(process.cwd(), BACKUP_DIR);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`Created backup directory: ${backupDir}`);
  }

  // Ask for confirmation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question(`Do you want to remove these ${unusedFiles.length} files? (yes/no): `, (answer) => {
    if (answer.toLowerCase() === 'yes') {
      // Create a backup archive first
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupArchive = path.join(backupDir, `material-ui-backup-${timestamp}.tar.gz`);
      console.log(`Creating backup archive: ${backupArchive}`);
      execSync(`tar -czf ${backupArchive} ${MATERIAL_UI_PATH}`);
      
      // Remove files
      console.log('Removing unused files...');
      let removedCount = 0;
      let errorCount = 0;
      
      unusedFiles.forEach(filePath => {
        try {
          fs.unlinkSync(filePath);
          console.log(`Removed: ${filePath}`);
          removedCount++;
        } catch (err) {
          console.error(`Error removing ${filePath}: ${err.message}`);
          errorCount++;
        }
      });

      console.log(`\nSummary:`);
      console.log(`- Total files: ${unusedFiles.length}`);
      console.log(`- Successfully removed: ${removedCount}`);
      console.log(`- Errors: ${errorCount}`);
      console.log(`- Backup created at: ${backupArchive}`);
      
      // Check for empty directories
      console.log(`\nChecking for empty directories...`);
      const emptyDirs = findEmptyDirs(MATERIAL_UI_PATH);
      
      if (emptyDirs.length > 0) {
        console.log(`Found ${emptyDirs.length} empty directories.`);
        rl.question('Do you want to remove empty directories as well? (yes/no): ', (answer) => {
          if (answer.toLowerCase() === 'yes') {
            let removedDirsCount = 0;
            emptyDirs.forEach(dir => {
              try {
                fs.rmdirSync(dir);
                console.log(`Removed empty directory: ${dir}`);
                removedDirsCount++;
              } catch (err) {
                console.error(`Error removing directory ${dir}: ${err.message}`);
              }
            });
            console.log(`Removed ${removedDirsCount} empty directories.`);
          }
          rl.close();
        });
      } else {
        console.log('No empty directories found.');
        rl.close();
      }
    } else {
      console.log('Operation cancelled.');
      rl.close();
    }
  });
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

/**
 * Recursively find empty directories
 * @param {string} dirPath - Path to check for empty directories
 * @returns {string[]} Array of empty directory paths
 */
function findEmptyDirs(dirPath) {
  const emptyDirs = [];
  
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    
    if (items.length === 0) {
      emptyDirs.push(dir);
      return;
    }
    
    // Check if directory only contains empty directories
    let isEmpty = true;
    let subdirs = [];
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        subdirs.push(itemPath);
      } else {
        isEmpty = false;
        break;
      }
    }
    
    if (isEmpty) {
      // Check all subdirs
      for (const subdir of subdirs) {
        scanDir(subdir);
      }
      
      // Check again after scanning subdirs
      const remainingItems = fs.readdirSync(dir);
      if (remainingItems.length === 0) {
        emptyDirs.push(dir);
      }
    }
  }
  
  scanDir(dirPath);
  return emptyDirs;
} 