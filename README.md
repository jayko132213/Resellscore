# ResellScore

ResellScore est une base SaaS Next.js pour analyser une annonce Vinted/vintage, estimer le potentiel de revente et gérer des abonnements PayPal avec Supabase.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Supabase Auth, Database, Storage et RLS
- PayPal Subscriptions avec webhook vérifié
- Gemini API côté serveur, avec fallback local si aucune clé IA n'est configurée
- Déploiement gratuit possible sur Vercel avec une URL `*.vercel.app`

## Lancer en local

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Ouvre ensuite `http://localhost:3000`.

## Créer le projet Supabase

1. Crée un projet sur Supabase.
2. Va dans SQL Editor.
3. Colle et exécute `supabase/schema.sql`.
4. Dans Authentication, active Email + Password.
5. Récupère l'URL du projet et les clés API.

Variables à mettre dans `.env.local` puis dans Vercel :

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
AI_PROVIDER=gemini
```

La clé `SUPABASE_SERVICE_ROLE_KEY` reste uniquement côté serveur. Ne jamais la préfixer par `NEXT_PUBLIC_`.

## PayPal Subscriptions

1. Crée une app PayPal Developer en sandbox.
2. Crée trois produits/plans de subscription :
   - Starter : 9,99 EUR/mois
   - Pro : 14,99 EUR/mois
   - Elite : 23,99 EUR/mois
3. Copie les IDs de plans dans les variables :

```bash
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...
PAYPAL_PLAN_STARTER_ID=...
PAYPAL_PLAN_PRO_ID=...
PAYPAL_PLAN_ELITE_ID=...
```

4. Crée un webhook PayPal pointant vers :

```text
https://ton-site.vercel.app/api/paypal/webhook
```

Événements à écouter :

- `BILLING.SUBSCRIPTION.CREATED`
- `BILLING.SUBSCRIPTION.ACTIVATED`
- `BILLING.SUBSCRIPTION.CANCELLED`
- `BILLING.SUBSCRIPTION.EXPIRED`
- `BILLING.SUBSCRIPTION.SUSPENDED`
- `BILLING.SUBSCRIPTION.PAYMENT.FAILED`

Le site ne débloque jamais un plan payant juste parce que l'utilisateur revient depuis PayPal. Le profil Supabase est mis à jour via webhook PayPal vérifié.

## Mode développement PayPal

Si les clés PayPal ne sont pas configurées, les plans payants affichent un bouton `Simulation paiement` uniquement lorsque `NODE_ENV !== "production"`. Cette route refuse toute simulation en production.

## Déployer gratuitement sur Vercel

1. Pousse le projet sur GitHub.
2. Importe le repo dans Vercel.
3. Ajoute toutes les variables d'environnement.
4. Déploie.
5. Mets `NEXT_PUBLIC_SITE_URL=https://resellscore.vercel.app` ou l'URL gratuite donnée par Vercel.
6. Mets à jour l'URL du webhook PayPal avec l'URL Vercel.

## Tester PayPal en sandbox

1. Utilise les credentials sandbox PayPal.
2. Connecte-toi à l'app avec un utilisateur Supabase.
3. Va dans `/pricing` et lance un abonnement.
4. Valide avec un compte acheteur sandbox PayPal.
5. Vérifie dans Supabase que `profiles.plan`, `subscription_status` et `paypal_subscription_id` sont mis à jour après réception du webhook.

## Passer en production

1. Crée les produits et plans PayPal live.
2. Remplace les variables PayPal sandbox par les variables live.
3. Vérifie que `NODE_ENV=production` sur Vercel.
4. Configure le webhook live vers `/api/paypal/webhook`.
5. Fais un paiement réel de faible montant ou un plan test live avant d'ouvrir publiquement.

## Sécurité prévue

- Auth Supabase côté serveur pour `/dashboard`, `/analyze` et les API.
- RLS sur `profiles`, `analyses`, `usage_logs`, `subscriptions`.
- Limites d'usage vérifiées côté serveur.
- Rate limiting mémoire simple sur l'API d'analyse.
- Clés IA, PayPal et service role jamais exposées côté client.
- Upload image limité au dossier utilisateur dans Supabase Storage.

## Notes produit

Les résultats affichés sont des estimations, pas des garanties de marge ou de revente. L'application n'effectue pas de scraping Vinted automatique ; le lien est seulement utilisé comme contexte utilisateur.
