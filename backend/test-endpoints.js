import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('🧪 Starting Smart Bharat Automated API Validation Tests...\n');
  let passed = 0;
  let failed = 0;

  const testCases = [
    {
      name: 'GET /schemes - Retrieve Civic Schemes',
      fn: async () => {
        const res = await fetch(`${BASE_URL}/schemes`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('Expected array response');
        console.log(`  ✓ GET /schemes passed (${data.length} schemes found)`);
      }
    },
    {
      name: 'POST /chat - Chatbot Intent & Language Auto-Match',
      fn: async () => {
        const res = await fetch(`${BASE_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'mujhe naya passport chahiye' })
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (!data.response) throw new Error('Missing response content');
        console.log(`  ✓ POST /chat passed (Detected Intent: ${data.intent || 'N/A'})`);
      }
    },
    {
      name: 'GET /complaints - Fetch Dashboard Records',
      fn: async () => {
        const res = await fetch(`${BASE_URL}/complaints`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('Expected array response');
        console.log(`  ✓ GET /complaints passed (${data.length} items parsed)`);
      }
    }
  ];

  for (const tc of testCases) {
    try {
      console.log(`⏳ Testing: ${tc.name}`);
      await tc.fn();
      passed++;
    } catch (err) {
      console.error(`  ❌ Failed: ${tc.name} - ${err.message}`);
      failed++;
    }
  }

  console.log(`\n==================================================`);
  console.log(`📊 TEST RUN COMPLETED: ${passed} Passed, ${failed} Failed`);
  console.log(`==================================================\n`);
  
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
