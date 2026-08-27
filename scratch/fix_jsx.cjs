const fs = require('fs');

function fixJSX(file) {
    let content = fs.readFileSync(file, 'utf8');
    // Wrap the returned siblings in a parent div
    content = content.replace(/return \(\s*<div\s*key=\{([cp]\.id)\}\s*className="tap-active"/g, 'return (\n              <div key={}>\n                <div \n                className="tap-active"');
    
    // In CustomerMaintenance.tsx the closing divs:
    // the end of the mapped item has </div>\n            );\n          })}
    // We need to add one more </div> before );\n          })}
    content = content.replace(/<\/div>\s*\);\s*\}\)}/g, '</div>\n              </div>\n            );\n          })}');
    
    fs.writeFileSync(file, content);
}

fixJSX('C:/Sales Tracker/src/pages/mobile/CustomerMaintenance.tsx');
fixJSX('C:/Sales Tracker/src/pages/mobile/ProspectingTool.tsx');

console.log("Fixed JSX");
