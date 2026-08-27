const fs = require('fs');

function cleanDivs(file) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}\)}/g, '</div>\n              </div>\n            );\n          })}');
    fs.writeFileSync(file, content);
}

cleanDivs('C:/Sales Tracker/src/pages/mobile/CustomerMaintenance.tsx');
cleanDivs('C:/Sales Tracker/src/pages/mobile/ProspectingTool.tsx');
console.log("Cleaned extra divs");
