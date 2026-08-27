
const fs = require('fs');
let file = 'C:/Sales Tracker/src/pages/mobile/HomepageV3.tsx';
let content = fs.readFileSync(file, 'utf8');

// The faulty lines are:
// const uncontactedCustomerCount = myCustomers.filter(c => {
// ...
// const uncontactedProspekCount = myProspek.filter(p => p.status === 'Cold').length;

content = content.replace(
  'const uncontactedCustomerCount = myCustomers.filter(c => {',
  'const uncontactedCustomerCount = customers.filter(c => c.sales_pic === salesId).filter(c => {'
);

content = content.replace(
  'const uncontactedProspekCount = myProspek.filter(p => p.status === \\'Cold\\').length;',
  'const uncontactedProspekCount = prospek.filter(p => p.sales_owner === salesId).filter(p => p.status === \\'Cold\\').length;'
);

fs.writeFileSync(file, content);
console.log('Fixed myCustomers and myProspek type errors');

