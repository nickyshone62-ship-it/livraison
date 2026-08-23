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
- [x] **Authentification Administrateur Infaillible (Code Maître & Téléphone)** : Prise en charge instantanée de la connexion Super-Admin par le code secret maître (`Nick2004`) et par le numéro de téléphone officiel (`+226 06 88 73 30` / `06887330`). Création dynamique automatique et sécurisée du compte Super-Admin en cas d'absence initiale ([login/route.ts](file:///c:/Users/HP/Documents/Livraison/src/app/api/auth/login/route.ts), [admin/page.tsx](file:///c:/Users/HP/Documents/Livraison/src/app/admin/page.tsx)).
- [x] **Retrait du Guide d'Utilisation** : Masquage définitif du bloc de guide de démarrage dans l'espace client & boutique ([client/page.tsx](file:///c:/Users/HP/Documents/Livraison/src/app/client/page.tsx)) à la demande de l'utilisateur.
- [x] **Remise à Zéro Complète & Retrait du Bouton de Réinitialisation** : Purge intégrale de toutes les données de test réalisée avec succès. Retrait du bouton de réinitialisation du panneau d'administration pour éviter tout effacement accidentel pendant les opérations réelles ([admin/page.tsx](file:///c:/Users/HP/Documents/Livraison/src/app/admin/page.tsx)).

### PHASE 5 : Déploiement Production & Lancement Pilote à Ouagadougou
**Objectif** : Déployer sur serveur sécurisé et lancer le test avec les livreurs et commerçants.
- [ ] Valider le build TypeScript et la base de données SQLite/PostgreSQL.
- [ ] Tester les parcours utilisateurs de bout en bout (Client, Livreur, Admin).
- [ ] Préparer l'environnement de production.

---

## 🎯 Prochaine Action Immédiate Recommandée

Exécuter la vérification complète de l'application (build, test des routes, vérification de la base de données) pour entamer la **PHASE 5 : Préparation au Déploiement & Recette Finale**.
