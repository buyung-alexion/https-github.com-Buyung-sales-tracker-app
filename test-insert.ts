import { store } from './src/store/dataStore.ts';

async function testInsert() {
  const cData = {
    nama_toko: "Test Toko",
    nama_pic: "Test PIC",
    no_wa: "08123456789",
    area: "A001",
    sales_pic: "u2",
    total_order_volume: 0,
    last_order_date: new Date().toISOString()
  };
  console.log("Testing insert...");
  const res = await store.addCustomer(cData);
  console.log("Result:", res);
}

testInsert();
