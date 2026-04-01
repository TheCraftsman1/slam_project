const fs = require('fs');
const files = [
  'src/components/panels/CollegePanel.tsx',
  'src/components/panels/CityPanel.tsx',
  'src/components/map/MapControls.tsx',
  'src/components/IndoorScreen.tsx',
  'src/components/AssistantScreen.tsx'
];

files.forEach(f => {
  try {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/glass-strong/g, 'bg-card border border-border-subtle shadow-minimal');
    content = content.replace(/glass-card-hover/g, 'bg-card border border-border-subtle shadow-sm hover:bg-border-subtle transition-colors');
    content = content.replace(/glass-card/g, 'bg-card border border-border-subtle shadow-sm');
    content = content.replace(/text-slate-\d00/g, 'text-text-sub'); // Generic slate text replace
    content = content.replace(/text-white/g, 'text-text-main'); // Generic white text replace
    fs.writeFileSync(f, content);
  } catch (e) {
    console.error("Failed", f, e);
  }
});
console.log('done');
