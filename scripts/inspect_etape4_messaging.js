const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectEtape4() {
  console.log('=== INSPECTION MESSAGERIE ET NOTIFICATIONS (ÉTAPE 4) ===\n');

  // 1. Inspect Conversations Table
  const convs = await prisma.$queryRaw`
    SELECT c.id, c.delivery_id as "deliveryId", c.client_id as "clientId", c.driver_id as "driverId", c.created_at as "createdAt"
    FROM public.conversations c
    ORDER BY c.created_at DESC;
  `;
  console.log(`1. CONVERSATIONS EN BASE (${convs.length}) :`);
  for (const c of convs) {
    console.log(`   - ID: ${c.id} | Delivery: ${c.deliveryId} | Client: ${c.clientId} | Driver: ${c.driverId}`);
  }

  // 2. Inspect Messages Table
  const msgs = await prisma.$queryRaw`
    SELECT m.id, m.conversation_id as "conversationId", m.sender_id as "senderId", m.content, m.is_read as "isRead", m.created_at as "createdAt"
    FROM public.messages m
    ORDER BY m.created_at DESC
    LIMIT 5;
  `;
  console.log(`\n2. MESSAGES EN BASE (5 Derniers sur ${msgs.length}) :`);
  for (const m of msgs) {
    console.log(`   - Msg ID: ${m.id} | Conv: ${m.conversationId} | Expéditeur: ${m.senderId} | Lu: ${m.isRead} | Contenu: "${m.content}"`);
  }

  // 3. Inspect Notifications Table
  const notifs = await prisma.$queryRaw`
    SELECT n.id, n.user_id as "userId", n.title, n.message, n.type::text as type, n.is_read as "isRead", n.created_at as "createdAt"
    FROM public.notifications n
    ORDER BY n.created_at DESC
    LIMIT 5;
  `;
  console.log(`\n3. NOTIFICATIONS EN BASE (5 Dernières) :`);
  for (const n of notifs) {
    console.log(`   - Notif ID: ${n.id} | User: ${n.userId} | Titre: "${n.title}" | Lu: ${n.isRead} | Type: ${n.type}`);
  }

  // 4. RLS Policies
  const rls = await prisma.$queryRaw`
    SELECT tablename, policyname, cmd, qual
    FROM pg_policies
    WHERE tablename IN ('conversations', 'messages', 'notifications')
    ORDER BY tablename, policyname;
  `;
  console.log('\n4. POLICIES RLS MESSAGERIE & NOTIFICATIONS :');
  for (const p of rls) {
    console.log(`   - Table: ${p.tablename.padEnd(15)} | Policy: ${p.policyname.padEnd(25)} | Cmd: ${p.cmd}`);
  }
}

inspectEtape4()
  .catch((e) => console.error('Error inspecting step 4:', e))
  .finally(async () => await prisma.$disconnect());
