
const fs = require('fs');

function getContext(file, lineStr) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    const l = parseInt(lineStr) - 1;
    console.log('\n--- ' + file + ' line ' + (l+1) + ' ---');
    for(let i=Math.max(0, l-5); i<=Math.min(lines.length-1, l+5); i++) {
        console.log((i+1) + ': ' + lines[i]);
    }
}

getContext('C:/Sales Tracker/src/pages/mobile/CustomerMaintenance.tsx', 296);
getContext('C:/Sales Tracker/src/pages/mobile/ProspectingTool.tsx', 322);

