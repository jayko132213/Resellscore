# Mise en ligne ResellScore

Objectif : mettre le site sur Vercel maintenant, puis brancher le domaine plus tard.

## 1. Supabase reel

1. Cree un projet Supabase.
2. Va dans SQL Editor.
3. Colle tout le fichier `supabase/schema.sql`.
4. Lance le script.
5. Recupere :
   - Project URL
   - anon public key
   - service_role key

Dans Vercel, ajoute :

```txt
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 2. PayPal live

Pour lancer maintenant sans SIRET, garde le paiement manuel :

```txt
PAYMENT_MODE=manual
```

Dans ce mode, les boutons payants ouvrent la page de paiement manuel. Le client envoie sa preuve, puis le proprietaire active le plan dans le panel admin avec une date de fin.

PayPal Live automatique pourra etre active plus tard avec :

```txt
PAYMENT_MODE=paypal
```

Il faudra alors creer les produits/plans en mode Live, pas Sandbox.

Plans conseilles :

- Starter : 10 analyses / jour
- Pro : 50 analyses / jour
- Elite : analyses illimitees + Tendances

Dans Vercel, ajoute :

```txt
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_PLAN_STARTER_ID=...
PAYPAL_PLAN_PRO_ID=...
PAYPAL_PLAN_ELITE_ID=...
PAYPAL_WEBHOOK_ID=...
```

Webhook PayPal a creer vers :

```txt
https://resellscore.vercel.app/api/paypal/webhook
```

Evenements minimum :

- BILLING.SUBSCRIPTION.CREATED
- BILLING.SUBSCRIPTION.ACTIVATED
- BILLING.SUBSCRIPTION.CANCELLED
- BILLING.SUBSCRIPTION.EXPIRED
- BILLING.SUBSCRIPTION.SUSPENDED
- BILLING.SUBSCRIPTION.PAYMENT.FAILED

## 3. OpenAI

La cle deja collee dans la conversation doit etre remplacee avant publication.

Dans Vercel :

```txt
AI_PROVIDER=openai
OPENAI_API_KEY=nouvelle_cle
OPENAI_MODEL=gpt-4o-mini
```

## 4. Vercel

1. Mets le projet sur GitHub.
2. Dans Vercel, importe le projet.
3. Framework : Next.js.
4. Ajoute les variables d'environnement.
5. Deploy.

## 5. Test apres deploy

Ouvre :

```txt
https://resellscore.vercel.app/api/launch-check
```

Tout doit etre vert avant de faire payer de vrais clients.

## Important

Sans domaine payant, l'adresse sera du style :

```txt
https://resellscore.vercel.app
```

Plus tard, tu pourras ajouter `resellscore.fr` sans refaire le site.
