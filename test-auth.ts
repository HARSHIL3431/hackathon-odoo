async function runTests() {
  console.log("--- TEST 1: Duplicate Registration ---");
  const regRes = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Duplicate Customer",
      email: "customer1@example.com", // seeded email
      password: "password123",
    }),
  });
  
  console.log(`Status: ${regRes.status}`);
  const regData = await regRes.json();
  console.log(`Body: ${JSON.stringify(regData)}`);

  console.log("\n--- TEST 2: Authorization Guard ---");
  // Log in as customer
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "customer1@example.com",
      password: "password123", // seeded password
    }),
  });
  const cookies = loginRes.headers.get('set-cookie');
  console.log(`Login Status: ${loginRes.status}`);
  
  // Access admin route
  const adminRes = await fetch("http://localhost:3000/admin/dashboard", {
    headers: {
      "Cookie": cookies || "",
      "Accept": "text/html",
    }
  });
  
  console.log(`Admin Route Status: ${adminRes.status}`);
  const html = await adminRes.text();
  if (html.includes('Forbidden: Admin access required')) {
    console.log("Success: Proper 403 page rendered.");
  } else if (html.includes('Unhandled Runtime Error') || html.includes('Error:')) {
    console.log("Failure: Next.js Error Page rendered!");
    console.log(html.substring(0, 500));
  } else {
    console.log("Unknown response.");
    console.log(html.substring(0, 500));
  }
}

runTests().catch(console.error);
