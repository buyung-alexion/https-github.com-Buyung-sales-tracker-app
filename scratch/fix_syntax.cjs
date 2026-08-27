const fs = require('fs');

function fixSyntax(file) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/onClick=y\(\) =>/g, 'onClick={() =>');
    content = content.replace(/fontWeight: 500,, marginBottom/g, 'fontWeight: 500, marginBottom');
    fs.writeFileSync(file, content);
}

fixSyntax('C:/Sales Tracker/src/pages/mobile/CustomerMaintenance.tsx');
fixSyntax('C:/Sales Tracker/src/pages/mobile/ProspectingTool.tsx');

console.log("Fixed syntax");
