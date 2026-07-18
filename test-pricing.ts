import { calculateRentalPrice } from './lib/pricing';

function testPricing() {
  const product = {
    rentalPricePerDay: 100,
    depositAmount: 500,
    stockQty: 5
  };

  const today = new Date('2026-07-18T10:00:00Z');
  const tomorrow = new Date('2026-07-19T10:00:00Z');
  const yesterday = new Date('2026-07-17T10:00:00Z');

  console.log("--- TEST 1: End Date Before Start Date ---");
  try {
    calculateRentalPrice(product, today, yesterday, 1);
    console.error("FAIL: Did not reject end date before start date");
  } catch (e: any) {
    console.log("PASS:", e.message);
  }

  console.log("\n--- TEST 2: Quantity > Stock ---");
  try {
    calculateRentalPrice(product, today, tomorrow, 6);
    console.error("FAIL: Did not reject quantity > stock");
  } catch (e: any) {
    console.log("PASS:", e.message);
  }

  console.log("\n--- TEST 3: Zero / Negative Duration ---");
  try {
    calculateRentalPrice(product, today, yesterday, 1);
    console.error("FAIL: Did not reject negative duration");
  } catch (e: any) {
    console.log("PASS:", e.message);
  }
  
  // Wait, if start and end are same day, it should count as 1 day, no error.
  console.log("\n--- TEST 4: Same day counts as 1 day ---");
  try {
    const res = calculateRentalPrice(product, today, today, 1);
    console.log("PASS:", res.days === 1 ? "1 day" : "Failed days count");
  } catch (e: any) {
    console.error("FAIL:", e.message);
  }
}

testPricing();
