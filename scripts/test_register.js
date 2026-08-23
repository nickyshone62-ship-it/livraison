const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRegister() {
  console.log('🧪 Simulating driver registration...');
  const res = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '+226 71 22 33 44',
      password: 'password123',
      role: 'LIVREUR',
      fullName: 'Test Livreur Sawadogo',
      firstName: 'Test',
      lastName: 'Sawadogo',
      idCardNumber: 'B99887766',
      vehicleType: 'MOTO',
      brand: 'Nanfang',
      paymentMethod: 'ORANGE_MONEY',
      selectedZones: ['Zogona', 'Tampouy'],
    }),
  }).catch(e => ({ ok: false, error: e.message }));

  console.log('Register Response Status:', res.status);
  if (res.ok) {
    const data = await res.json();
    console.log('Register Result:', data);
  } else {
    const errText = await res.text().catch(() => '');
    console.log('Register Error:', errText);
  }
}

testRegister().finally(() => prisma.$disconnect());
