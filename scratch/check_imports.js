import fs from 'fs';
import path from 'path';

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') {
        walk(path.join(dir, file), fileList);
      }
    } else if (file.endsWith('.jsx')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files = walk('./src');
let foundErrors = false;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  
  // Find all <Tags> (components)
  const componentRegex = /<([A-Z][a-zA-Z0-9]*)/g;
  let match;
  const componentsUsed = new Set();
  while ((match = componentRegex.exec(content)) !== null) {
    componentsUsed.add(match[1]);
  }

  // Find all imports
  const importRegex = /import\s+.*?from\s+['"].*?['"]/gs;
  const importsStr = (content.match(importRegex) || []).join('\n');
  
  // Find all local declarations
  const localDeclRegex = /(?:const|let|var|function|class)\s+([A-Z][a-zA-Z0-9]*)/g;
  const localDecls = new Set();
  let localMatch;
  while ((localMatch = localDeclRegex.exec(content)) !== null) {
    localDecls.add(localMatch[1]);
  }

  for (const comp of componentsUsed) {
    if (!importsStr.includes(comp) && !localDecls.has(comp)) {
      console.log(`Potential missing component '${comp}' in ${file}`);
      foundErrors = true;
    }
  }

  // Check for common missing icons
  const iconRegex = /(?:[A-Z][a-zA-Z]*Icon|[a-z]*Icon|[A-Z][a-zA-Z]*)/g;
  // This is too broad, but we can specifically look for common undeclared identifiers.
  // We can look for Capitalized words used as variables but not declared.
  // Instead of full AST parsing, let's just check components for now.
}

if (!foundErrors) {
  console.log("No obvious missing components found.");
}
