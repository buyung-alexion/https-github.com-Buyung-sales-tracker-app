const fs = require('fs');
let tsx = fs.readFileSync('src/pages/mobile/HomepageV2.tsx', 'utf8');

const badChunk = `  UseEffect(() => {
    document.body.classList.add('wallet-theme');
    const totalSO = breakdown?.order || 0;
  const totalVisit = (breakdown?.visitProspek || 0) + (breakdown?.visitCustomer || 0);
  const totalMyCustomer = customers.filter(c => c.sales_pic === salesId).length;
  const totalMyProspek = prospek.filter(p => p.sales_owner === salesId).length;

  return () => { document.body.classList.remove('wallet-theme'); }
  }, []);`;

const goodChunk = `  useEffect(() => {
    document.body.classList.add('wallet-theme');
    return () => { document.body.classList.remove('wallet-theme'); }
  }, []);`;

tsx = tsx.replace(badChunk, goodChunk);

const returnChunk1 = `  const { totalActual: totalActualPoints, breakdown } = calculateSalesPoints(
    salesId,
    activities,
    prospek,
    systemTargets,
    'month'
  );

  return (`;

const returnChunk2 = `  const { totalActual: totalActualPoints, breakdown } = calculateSalesPoints(
    salesId,
    activities,
    prospek,
    systemTargets,
    'month'
  );

  const totalSO = breakdown?.order || 0;
  const totalVisit = (breakdown?.visitProspek || 0) + (breakdown?.visitCustomer || 0);
  const totalMyCustomer = customers.filter(c => c.sales_pic === salesId).length;
  const totalMyProspek = prospek.filter(p => p.sales_owner === salesId).length;

  return (`;

tsx = tsx.replace(returnChunk1, returnChunk2);

fs.writeFileSync('src/pages/mobile/HomepageV2.tsx', tsx);
console.log('Fixed');