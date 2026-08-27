
const fs = require('fs');
let file = 'C:/Sales Tracker/src/pages/mobile/HomepageV3.tsx';
let content = fs.readFileSync(file, 'utf8');

const missingLogic = 
  const uncontactedCustomerCount = myCustomers.filter(c => {
    const act = activities.find(a => a.target_id === c.id);
    return !act;
  }).length;
  const uncontactedProspekCount = myProspek.filter(p => p.status === 'Cold').length;
;

content = content.replace(
  'const myOrderan = thisMonthOrders.length;',
  'const myOrderan = thisMonthOrders.length;' + missingLogic
);

fs.writeFileSync(file, content);
console.log('HomepageV3 missing vars added');

