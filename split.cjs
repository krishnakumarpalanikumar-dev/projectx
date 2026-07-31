const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'styles', 'main.css');
const content = fs.readFileSync(cssPath, 'utf8');

const regex = /\/\* ={10,}\s*\n\s*([^=]+?)\s*\n\s*={10,} \*\//g;
let lastIndex = 0;
let blocks = [];
let match;

while ((match = regex.exec(content)) !== null) {
  if (lastIndex < match.index) {
    blocks[blocks.length - 1].code = content.substring(lastIndex, match.index);
  }
  blocks.push({
    title: match[1].trim(),
    matchIndex: match.index
  });
  lastIndex = match.index;
}
if (blocks.length > 0) {
  blocks[blocks.length - 1].code = content.substring(lastIndex);
}

const baseCss = ['Theme', 'Reset & Base', 'App Layout', 'Sidebar', 'Main Content', 'Top Bar', 'Page Container'];
const compCss = ['Cards', 'Stats Grid', 'Content Grid', 'Buttons', 'Forms', 'Modals', 'Toasts', 'Toast Notifications', 'Badges', 'Settings Modal', 'Forms & Inputs', 'Utilities'];

let baseContent = '';
let compContent = '';
let pages = {};

for (const block of blocks) {
  const title = block.title.toLowerCase();
  
  if (baseCss.some(b => title.includes(b.toLowerCase()))) {
    baseContent += block.code + '\n';
  } else if (compCss.some(c => title.includes(c.toLowerCase()))) {
    compContent += block.code + '\n';
  } else if (title.includes('page') || title.includes('dashboard') || title.includes('chart') || title.includes('market') || title.includes('signal') || title.includes('journal') || title.includes('risk') || title.includes('history') || title.includes('knowledge') || title.includes('tracker') || title.includes('insight') || title.includes('login') || title.includes('auth')) {
    
    let pageName = 'other';
    if (title.includes('chart')) pageName = 'chart';
    else if (title.includes('journal')) pageName = 'journal';
    else if (title.includes('login') || title.includes('auth')) pageName = 'login';
    else if (title.includes('dashboard')) pageName = 'dashboard';
    else if (title.includes('market')) pageName = 'markets';
    else if (title.includes('signal')) pageName = 'signals';
    else if (title.includes('risk')) pageName = 'riskManager';
    else if (title.includes('history')) pageName = 'history';
    else if (title.includes('knowledge')) pageName = 'tradingKnowledge';
    else if (title.includes('tracker') || title.includes('model')) pageName = 'modelTracker';
    else if (title.includes('insight') || title.includes('ai')) pageName = 'aiInsights';
    
    if (!pages[pageName]) pages[pageName] = '';
    pages[pageName] += block.code + '\n';
  } else {
    compContent += block.code + '\n';
  }
}

fs.writeFileSync(path.join(__dirname, 'src', 'styles', 'base.css'), baseContent);
fs.writeFileSync(path.join(__dirname, 'src', 'styles', 'components.css'), compContent);

const pagesDir = path.join(__dirname, 'src', 'styles', 'pages');
if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir);

for (const [name, code] of Object.entries(pages)) {
  fs.writeFileSync(path.join(pagesDir, `${name}.css`), code);
}
console.log('CSS split successfully.');
