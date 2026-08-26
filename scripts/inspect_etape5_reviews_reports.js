const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectEtape5() {
  console.log('=== INSPECTION ÉVALUATIONS, SIGNALEMENTS ET LITIGES (ÉTAPE 5) ===\n');

  // 1. Inspect Reviews Table
  const reviews = await prisma.$queryRaw`
    SELECT r.id, r.delivery_id as "deliveryId", r.reviewer_id as "reviewerId", r.reviewed_driver_id as "driverId", r.rating, r.comment, r.created_at as "createdAt"
    FROM public.reviews r
    ORDER BY r.created_at DESC;
  `;
  console.log(`1. ÉVALUATIONS EN BASE (${reviews.length}) :`);
  for (const r of reviews) {
    console.log(`   - Review ID: ${r.id} | Delivery: ${r.deliveryId} | Note: ${r.rating}/5 | Commentaire: "${r.comment || 'N/A'}"`);
  }

  // 2. Inspect Reports Table
  const reports = await prisma.$queryRaw`
    SELECT rep.id, rep.reporter_id as "reporterId", rep.reported_user_id as "reportedUserId", rep.delivery_id as "deliveryId", rep.reason, rep.status::text as status, rep.created_at as "createdAt"
    FROM public.reports rep
    ORDER BY rep.created_at DESC;
  `;
  console.log(`\n2. SIGNALEMENTS EN BASE (${reports.length}) :`);
  for (const rep of reports) {
    console.log(`   - Report ID: ${rep.id} | Auteur: ${rep.reporterId} | Motif: ${rep.reason} | Statut: ${rep.status}`);
  }

  // 3. Inspect Admin Actions Table
  const actions = await prisma.$queryRaw`
    SELECT a.id, a.admin_id as "adminId", a.action_type as "actionType", a.target_table as "targetTable", a.target_id as "targetId", a.created_at as "createdAt"
    FROM public.admin_actions a
    ORDER BY a.created_at DESC
    LIMIT 5;
  `;
  console.log(`\n3. ACTIONS ADMINISTRATEUR EN BASE (5 Dernières) :`);
  for (const act of actions) {
    console.log(`   - Action ID: ${act.id} | Admin: ${act.adminId} | Type: ${act.actionType} | Cible: ${act.targetTable} (${act.targetId})`);
  }

  // 4. RLS Policies
  const rls = await prisma.$queryRaw`
    SELECT tablename, policyname, cmd, qual
    FROM pg_policies
    WHERE tablename IN ('reviews', 'reports', 'admin_actions')
    ORDER BY tablename, policyname;
  `;
  console.log('\n4. POLICIES RLS ÉVALUATIONS & SIGNALEMENTS :');
  for (const p of rls) {
    console.log(`   - Table: ${p.tablename.padEnd(15)} | Policy: ${p.policyname.padEnd(25)} | Cmd: ${p.cmd}`);
  }
}

inspectEtape5()
  .catch((e) => console.error('Error inspecting step 5:', e))
  .finally(async () => await prisma.$disconnect());
