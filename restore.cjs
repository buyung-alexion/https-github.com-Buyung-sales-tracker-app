const fs=require('fs');
let c=fs.readFileSync('src/pages/mobile/HomepageV2.tsx','utf8');
c=c.replace(/return \(/, \
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysRemaining = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const uncontactedProspekCount = prospek.filter(p => 
    p.sales_owner === salesId && 
    !activities.some(act => act.target_id === p.id && (act.tipe_aksi === 'WA' || act.tipe_aksi === 'Call'))
  ).length;

  const uncontactedCustomerCount = customers.filter(c => 
    c.sales_pic === salesId && 
    !activities.some(act => act.target_id === c.id && (act.tipe_aksi === 'WA' || act.tipe_aksi === 'Call'))
  ).length;

  const { totalActual: totalActualPoints } = calculateSalesPoints(
    salesId,
    activities,
    prospek,
    systemTargets,
    'month'
  );

  return (\);
fs.writeFileSync('src/pages/mobile/HomepageV2.tsx',c);
