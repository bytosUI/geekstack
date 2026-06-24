x@# GeekStack — Setup externe

Tu dois créer 3 comptes / clés avant qu'on puisse connecter l'app. Compte ~20-30 min au total. Suis dans l'ordre.

---

## 1. Supabase (~10 min)

Supabase héberge la base Postgres et gère l'auth.

### a. Créer le projet
1. Va sur https://supabase.com → **Sign in** (avec ton GitHub `bytosUI`, c'est le plus simple).
2. **New Project** :
   - Name : `geekstack`
   - Database password : génère-en un fort, **note-le quelque part** (KeyChain, gestionnaire de mdp)
   - Region : **Europe (Paris)** ou **Europe (Frankfurt)**
   - Plan : **Free** (largement suffisant pour le MVP)
3. Attends ~2 min que la base provisionne.

### b. Récupérer les clés API
1. Settings (icône engrenage en bas à gauche) → **API**.
2. Copie dans un bloc-notes :
   - `Project URL` → ce sera `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` (sous "Project API keys") → ce sera `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### c. Exécuter le schéma SQL
1. Menu de gauche → **SQL Editor** → **+ New query**.
2. Ouvre le fichier `supabase/schema.sql` du projet, copie tout son contenu, colle dans l'éditeur.
3. **Run** (bouton en bas à droite). Tu dois voir `Success. No rows returned`.
4. Vérifie en allant dans **Table Editor** → tu dois voir `profiles`, `movies`, `library_entries`, `events`.

---

## 2. TMDB API (~5 min)

TMDB fournit les données films (titres, affiches, synopsis…).

1. Va sur https://www.themoviedb.org → **Sign Up**.
2. Confirme ton email.
3. Une fois connecté : avatar en haut à droite → **Settings** → menu de gauche **API** → **Create**.
4. Choisis **Developer** (gratuit, perso).
5. Remplis le formulaire (objectif : MVP perso, app de suivi films).
6. Une fois validé, sur la page **API** tu verras deux clés. Copie **API Read Access Token** (le long, type JWT) — ce sera `TMDB_API_KEY`.

---

## 3. Google OAuth via Supabase (~10 min)

Pour le bouton « Se connecter avec Google ».

### a. Créer un projet Google Cloud
1. Va sur https://console.cloud.google.com → connecte-toi avec ton compte Google.
2. En haut, **sélectionne un projet** → **Nouveau projet** :
   - Nom : `GeekStack`
   - Pas d'organisation
3. **Créer**.

### b. Configurer l'écran de consentement OAuth
1. Menu hamburger → **APIs & Services** → **OAuth consent screen**.
2. **User type** : **External** → Create.
3. Remplis :
   - App name : `GeekStack`
   - User support email : ton email
   - Developer contact info : ton email
4. **Save and continue** trois fois (scopes / test users / summary → rien à toucher).
5. À la fin, sur la page **OAuth consent screen** → **Publish app** → Confirm. (Sans ça, seul ton email peut se connecter.)

### c. Créer les credentials OAuth
1. **APIs & Services** → **Credentials** → **+ Create credentials** → **OAuth client ID**.
2. **Application type** : **Web application**.
3. **Name** : `GeekStack Web`.
4. **Authorized redirect URIs** → **+ Add URI** → colle l'URL callback Supabase :
   ```
   https://<TON-PROJET-SUPABASE>.supabase.co/auth/v1/callback
   ```
   (Tu trouves `<TON-PROJET-SUPABASE>` dans `NEXT_PUBLIC_SUPABASE_URL`.)
5. **Create**. Récupère **Client ID** et **Client Secret**.

### d. Activer Google dans Supabase
1. Retour sur Supabase → **Authentication** (menu de gauche) → **Providers**.
2. Trouve **Google** → **Enable**.
3. Colle ton **Client ID** et **Client Secret**.
4. **Save**.

### e. Configurer les URLs autorisées dans Supabase
1. Toujours dans **Authentication** → **URL Configuration**.
2. **Site URL** : `http://localhost:3000` (on changera en prod pour l'URL Vercel)
3. **Redirect URLs** (ajoute les deux) :
   - `http://localhost:3000/auth/callback`
   - `https://geekstack.vercel.app/auth/callback` (ou ton URL Vercel finale)

---

## 4. Variables d'environnement locales

Crée `.env.local` à la racine du projet en copiant `.env.example` :

```sh
cp .env.example .env.local
```

Remplis les 3 valeurs récoltées plus haut. **Ne commit jamais ce fichier** (déjà dans `.gitignore`).

---

## ✅ Quand tout ça est fait

Dis-moi « setup ok » et je continue : intégration des clients Supabase + TMDB, middleware auth, et les 6 écrans.
