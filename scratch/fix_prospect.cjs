const fs = require('fs');
let file = 'C:/Sales Tracker/src/pages/mobile/ProspectingTool.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix the comment issue
content = content.replace(/\/\/\s*statusOverride:\s*p\.status/g, '');

// Fix the JSX sibling issue (same as CustomerMaintenance but for ProspectingTool)
// Wait, I already ran fixJSX on it, but the fix_key failed to add <div key={p.id}> ?
// Let me check if <div key={p.id}> is there. If not, add it.
content = content.replace(/return \(\s*<div key=\{\}>\s*<div \s*className="tap-active"/g, 'return (\n              <div key={p.id}>\n                <div \n                className="tap-active"');

fs.writeFileSync(file, content);
console.log("Fixed ProspectingTool");
