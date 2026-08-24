# Plan de Travail & Feuille de Route - LivraisonOuaga 🇧🇫

Ce document détaille le plan d'action étape par étape pour faire évoluer le MVP actuel vers la version de production déployée et opérationnelle sur le terrain à Ouagadougou.

---

## 📅 Chronogramme Synthétique

```
[Phase 1] PWA & Mobile Installable (Jours 1 - 3)
   │
   ▼
[Phase 2] Intégration Paiements Mobile Money (Jours 4 - 8)
   │
   ▼
[Phase 3] Notifications SMS & WhatsApp (Jours 9 - 11)
   │
   ▼
[Phase 4] Carte Interactive & Géolocalisation GPS (Jours 12 - 16)
   │
   ▼
[Phase 5] Déploiement Production & Lancement Pilote Ouaga (Jours 17 - 21)
```

---

## 🛠️ Détail des Phases de Développement

### PHASE 1 : Transformation en PWA (Progressive Web App)
**Objectif** : Rendre l'application installable sur smartphone Android & iPhone en 1 clic sans passer par le Play Store.
- [x] Créer le fichier `public/manifest.json` avec les icônes de la plateforme.
- [x] Configurer un Service Worker pour la mise en cache et le fonctionnement fluide sur connexions 3G/4G à Ouagadougou (`public/sw.js`).
- [x] Ajouter le composant d'installation PWA (`src/components/PWAInstaller.tsx`).
- [x] **Intégration des Vrais Logos des Moyens de Paiement (Orange Money, Moov Money, Wave)** : Ajout des vrais badges vectoriels SVG officiels de marque (*Orange Money OM*, *Moov Money*, *Wave*) directement dans le formulaire de paiement et d'inscription sur [OnboardingAuth.tsx](file:///c:/Users/HP/Documents/Livraison/src/components/OnboardingAuth.tsx).

### PHASE 2 : Intégration des Paiements Mobile Money
**Objectif** : Automatiser l'encaissement des abonnements mensuels et des frais de vérification livreurs.
- [x] Définir les modules de paiement Orange Money, Moov Money, Wave (`src/lib/payments.ts`).
- [x] Créer la route d'API `/api/payments/initiate` pour le déclenchement des paiements.
- [x] Activer la mise à jour automatique des abonnements clients et du statut KYC des livreurs après paiement validé.
- [x] **Tarification d'Abonnement Finale** : Conservation exclusive des 2 plans uniques : **Plan Livreur** (500 FCFA/mois) et **Plan Commerçant** (1 000 FCFA/mois). Tous les autres plans (*Particulier*, *Pro*, *Entreprise*) ont été définitivement retirés.
- [x] **Verrouillage Strict des Comptes Inactifs / Abonnements Expirés** : Implémentation du contrôle d'accès dans `validateActiveSubscription()` ([auth.ts](file:///c:/Users/HP/Documents/Livraison/src/lib/auth.ts)) bloquant les requêtes API (403 Forbidden) et affichant un écran de verrouillage complet sur les tableaux de bord client et livreur dès l'expiration de l'abonnement.

### PHASE 3 : Système de Notifications SMS & WhatsApp
**Objectif** : Alerter instantanément les clients et livreurs même s'ils n'ont pas l'application ouverte.
- [x] Connecter un service de notifications multi-canal (`src/lib/notifications.ts`).
- [x] Génération et sécurisation par codes OTP de ramassage et de livraison.
- [x] Notifications en direct pour chaque étape de la course.

### PHASE 4 : Carte Interactive & Suivi GPS en Temps Réel
**Objectif** : Offrir la visualisation géographique du trajet à Ouagadougou.
- [x] Intégrer le composant de carte interactive `DeliveryMap.tsx`.
- [x] Afficher les marqueurs des points de ramassage (Point A) et de livraison (Point B) avec statut en direct.
- [x] **Gestion des Zones & Quartiers** : Suppression de la tarification indicative. Le formulaire de création de zone dans le panneau administrateur ([admin/page.tsx](file:///c:/Users/HP/Documents/Livraison/src/app/admin/page.tsx)) requiert désormais uniquement l'*Arrondissement* et les *Quartier(s)*.
- [x] **Panneau Administrateur Enrichi (Suivi Complet & Proposals)** : L'administrateur visualise l'ensemble des demandes de livraison, toutes les propositions de prix émises par les livreurs, le livreur sélectionné par le client, ainsi que la carte de suivi GPS en direct ([admin/page.tsx](file:///c:/Users/HP/Documents/Livraison/src/app/admin/page.tsx)).
- [x] **Verrouillage Tâche Unique Livreur (Exclusion des Multiples Courses)** : Tout livreur sélectionné pour une livraison ne peut soumettre d'autres propositions ou accepter une autre course tant qu'il n'a pas terminé et livré ses tâches actuelles (statut LIVRÉ) ([propose/route.ts](file:///c:/Users/HP/Documents/Livraison/src/app/api/deliveries/%5Bid%5D/propose/route.ts), [select-driver/route.ts](file:///c:/Users/HP/Documents/Livraison/src/app/api/deliveries/%5Bid%5D/select-driver/route.ts)).
- [x] **Chronométrage Précis (Temps d'Aller & Temps de Remise)** : Calcul et affichage automatique en temps réel du temps mis par le livreur pour aller récupérer le colis au Point A (`pickedUpAt - startedAt`) et du temps mis pour le remettre au destinataire au Point B (`deliveredAt - pickedUpAt`) ([admin/page.tsx](file:///c:/Users/HP/Documents/Livraison/src/app/admin/page.tsx)).
- [x] **Inscription Directe Rétablie (Sans E-mail Obligatoire)** : Rétablissement du mode d'inscription directe via numéro de téléphone et mot de passe. L'e-mail est de nouveau optionnel et la validation par lien e-mail a été annulée à la demande de l'utilisateur ([schema.prisma](file:///c:/Users/HP/Documents/Livraison/prisma/schema.prisma), [register/route.ts](file:///c:/Users/HP/Documents/Livraison/src/app/api/auth/register/route.ts), [OnboardingAuth.tsx](file:///c:/Users/HP/Documents/Livraison/src/components/OnboardingAuth.tsx)).
- [x] **Connexion Directe Inscription ↔ Page Administrateur (Alerte Sonore & Toast en Direct)** : Connexion temps réel intégrale entre la page d'inscription et le tableau de bord administrateur. Dès qu'un utilisateur (Livreur / Boutique) s'inscrit, l'espace Administrateur déclenche un signal sonore Web Audio (carillon 🔔) et affiche une modale Pop-up d'Alerte Rutilante en haut à droite pour approuver le compte d'un simple clic ([register/route.ts](file:///c:/Users/HP/Documents/Livraison/src/app/api/auth/register/route.ts), [admin/page.tsx](file:///c:/Users/HP/Documents/Livraison/src/app/admin/page.tsx)).
- [x] **Système de Notification Administrateur & Alerte Inscriptions Instantanée** : Intégration de la cloche de notifications en direct (`Notifications Système`), de la journalisation SMS/WhatsApp à l'administration (+226 70 00 00 00) et des cartes d'approbation d'urgence des nouveaux livreurs et boutiques en 1 clic ([register/route.ts](file:///c:/Users/HP/Documents/Livraison/src/app/api/auth/register/route.ts), [notifications/route.ts](file:///c:/Users/HP/Documents/Livraison/src/app/api/admin/notifications/route.ts), [admin/page.tsx](file:///c:/Users/HP/Documents/Livraison/src/app/admin/page.tsx)).
- [x] **Saisie Manuelle Dynamique du Code Secret Super Administrateur** : L'utilisateur doit saisir lui-même son code secret à tout moment dans un champ sécurisé masqué (`type="password"`). Suppression de toute valeur préremplie et validation dynamique en base de données ou via le code secret maître ([admin-login/route.ts](file:///c:/Users/HP/Documents/Livraison/src/app/api/auth/admin-login/route.ts), [admin/page.tsx](file:///c:/Users/HP/Documents/Livraison/src/app/admin/page.tsx), [OnboardingAuth.tsx](file:///c:/Users/HP/Documents/Livraison/src/components/OnboardingAuth.tsx)).
- [x] **Remise à Zéro Complète pour les Activités Réelles** : Purge intégrale de toutes les données de démonstration réalisée avec succès sur Supabase PostgreSQL. Conservation exclusive du Super Administrateur (`Nick2004`), des 11 arrondissements de Ouagadougou et des grilles d'abonnement ([reset_db.js](file:///c:/Users/HP/Documents/Livraison/scripts/reset_db.js)).
- [x] **Rafraîchissement Automatique en Temps Réel (4 sec)** : Automatisation intégrale du rechargement des données en arrière-plan toutes les 4 secondes sur tous les espaces (Admin, Client, Livreur) pour un suivi instantané sans rechargement manuel de page ([admin/page.tsx](file:///c:/Users/HP/Documents/Livraison/src/app/admin/page.tsx), [client/page.tsx](file:///c:/Users/HP/Documents/Livraison/src/app/client/page.tsx), [livreur/page.tsx](file:///c:/Users/HP/Documents/Livraison/src/app/livreur/page.tsx)).
- [x] **Retrait du Guide d'Utilisation** : Masquage définitif du bloc de guide de démarrage dans l'espace client & boutique ([client/page.tsx](file:///c:/Users/HP/Documents/Livraison/src/app/client/page.tsx)) à la demande de l'utilisateur.
- [x] **Remise à Zéro Complète & Retrait du Bouton de Réinitialisation** : Purge intégrale de toutes les données de test réalisée avec succès. Retrait du bouton de réinitialisation du panneau d'administration pour éviter tout effacement accidentel pendant les opérations réelles ([admin/page.tsx](file:///c:/Users/HP/Documents/Livraison/src/app/admin/page.tsx)).

- [x] Intégration Base de Données Persistante Supabase (PostgreSQL) : Conversion du schéma Prisma pour PostgreSQL ([schema.prisma](file:///c:/Users/HP/Documents/Livraison/prisma/schema.prisma)), configuration des variables d'environnement `DATABASE_URL` (pooler serveur port 6543) et `DIRECT_URL` (port 5432).
- [x] Synchronisation du schéma Prisma sur la base de données distante Supabase via `npx prisma db push`.
- [x] Ensemencement réussi de la base Supabase (`prisma/seed.ts`) avec les rôles, zones des 11 arrondissements et abonnements initiaux.
- [x] Vérification intégrale du build de production (`next build` : 28 pages statiques & dynamiques générées sans erreur).
- [ ] Configurer les 3 variables d'environnement (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`) sur Vercel et lancer le redéploiement.
- [ ] Tester les parcours utilisateurs de bout en bout en ligne.

---

## 🎯 Prochaine Action Immédiate Recommandée

Exécuter la vérification complète de l'application (build, test des routes, vérification de la base de données) pour entamer la **PHASE 5 : Préparation au Déploiement & Recette Finale**.
