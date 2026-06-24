# Tuto : configurer « Se connecter avec Google » pour GeekStack

Ce tuto te guide étape par étape pour qu'un bouton **« Se connecter avec Google »** fonctionne dans ton app. Compte ~15 minutes.

**Prérequis** : avoir déjà créé le projet Supabase et noté ton `NEXT_PUBLIC_SUPABASE_URL` (du type `https://abcxyz12345.supabase.co`).

---

## 🎯 Comprendre avant d'agir

### Les 3 acteurs

```
┌───────────┐         ┌──────────┐         ┌────────┐
│ GeekStack │ ◄─────► │ Supabase │ ◄─────► │ Google │
│  (ton app)│         │  (auth)  │         │(identité)│
└───────────┘         └──────────┘         └────────┘
```

Quand un utilisateur cliquera sur **« Se connecter avec Google »** dans ton app :

1. **GeekStack** dit à Supabase : « démerde-toi pour vérifier l'identité »
2. **Supabase** redirige vers Google
3. L'utilisateur s'authentifie chez **Google**
4. Google renvoie une preuve à **Supabase**
5. Supabase renvoie l'utilisateur connecté à **GeekStack**

### Pourquoi 5 sous-étapes ?

Google n'accepte pas de coopérer avec n'importe quel site. Il faut :
- **déclarer ton app chez Google** (3.a, 3.b, 3.c)
- **donner les clés à Supabase** (3.d)
- **dire à Supabase où renvoyer l'utilisateur** après login (3.e)

### Récap : qui apprend quoi à qui ?

| Étape | Tu enseignes ça…                            | …à qui ?  |
|-------|---------------------------------------------|-----------|
| 3.a   | « cette app existe »                        | Google    |
| 3.b   | « voici son nom + ton email »               | Google    |
| 3.c   | « voici l'URL Supabase autorisée »          | Google    |
| 3.d   | « voici les clés Google que tu peux utiliser » | Supabase |
| 3.e   | « voici les URLs GeekStack autorisées »     | Supabase  |

---

## 3.a — Créer un projet Google Cloud

> **Pourquoi ?** Google Cloud Console est le « tableau de bord » où tu gères toutes tes apps qui parlent à Google. Tu crées un projet `GeekStack` qui sera le conteneur de toute la suite.

1. Va sur **https://console.cloud.google.com** et connecte-toi avec ton compte Google perso.
2. En haut de la page, à côté du logo Google Cloud, clique sur le **sélecteur de projet** (un menu déroulant qui affiche soit "Sélectionner un projet" soit le nom d'un projet existant).
3. Dans la pop-up qui s'ouvre, clique sur **Nouveau projet** (en haut à droite).
4. Remplis :
   - **Nom du projet** : `GeekStack`
   - **Organisation** : laisse `Aucune organisation` (c'est un projet perso)
5. Clique sur **Créer**. Attends ~30 secondes que le projet se crée.
6. Une notification en haut à droite t'indique que le projet est prêt. Clique sur **Sélectionner le projet** pour basculer dessus, ou re-utilise le sélecteur de projet en haut pour choisir `GeekStack`.

✅ **Tu sauras que c'est bon quand** : le nom `GeekStack` apparaît dans le sélecteur de projet en haut.

---

## 3.b — Configurer l'écran de consentement OAuth

> **Pourquoi ?** C'est la **pop-up Google que verra l'utilisateur** quand il cliquera « Se connecter avec Google » : *« GeekStack veut accéder à votre profil Google. Autoriser ? »*. Tu décides ici ce qui s'affiche dans cette pop-up.

1. Dans Google Cloud Console, ouvre le **menu hamburger** (☰ en haut à gauche).
2. Navigue vers **APIs et services** → **Écran de consentement OAuth**.

   *(Selon la version de l'interface, ça peut être sous "OAuth consent screen" en anglais, ou directement accessible via la barre de recherche en haut — tape "consent".)*

3. **User Type** (Type d'utilisateur) : choisis **External** (Externe), puis clique **Créer**.

   > 💡 « External » signifie : n'importe quel compte Google peut se connecter. « Internal » est réservé aux Google Workspace d'entreprise, ce n'est pas ton cas.

4. Remplis le formulaire **App information** :
   - **App name** (Nom de l'application) : `GeekStack`
   - **User support email** : ton email perso
   - **App logo** : laisse vide (optionnel)
5. Plus bas, **Developer contact information** : remets ton email perso.
6. Clique **Save and continue** (Enregistrer et continuer).
7. Page **Scopes** (Champs d'application) → ne touche à rien → **Save and continue**.
8. Page **Test users** → ne touche à rien → **Save and continue**.
9. Page **Summary** (Résumé) → **Back to Dashboard** (Retour au tableau de bord).

### ⚠️ Étape capitale : publier l'app

Pour l'instant ton app est en mode **« Testing »** : **seul ton compte Google peut s'y connecter**. Pour que n'importe qui (ta copine, des amis…) puisse se connecter, il faut publier.

1. Sur la page principale de l'**écran de consentement OAuth**, trouve la section **Publishing status** (Statut de publication).
2. Clique sur **Publish App** (Publier l'application) → confirme **Confirm**.

> 💡 **Ne t'inquiète pas** : « publish » ne signifie pas que ton app apparaît dans un annuaire public ou un store. C'est juste un statut Google qui dit « cette app accepte tous les utilisateurs ». Google peut afficher une bannière « cette app n'est pas vérifiée » au premier login d'un utilisateur — tu peux ignorer, ça disparaîtra après quelques utilisations.

✅ **Tu sauras que c'est bon quand** : le statut de publication affiche **In production** (En production) au lieu de **Testing**.

---

## 3.c — Créer les credentials OAuth (les clés)

> **Pourquoi ?** C'est ici que tu génères les **2 clés secrètes** que Supabase utilisera pour prouver à Google « c'est bien moi, GeekStack ».

1. Dans le menu de gauche (toujours sous **APIs et services**), clique sur **Credentials** (Identifiants).
2. En haut, clique **+ Create credentials** → **OAuth client ID** (ID client OAuth).
3. **Application type** : **Web application**.
4. **Name** : `GeekStack Web` (peut être n'importe quoi, c'est juste un label interne).
5. Section **Authorized redirect URIs** (URI de redirection autorisés) : clique **+ Add URI**.

   Colle l'URL suivante en remplaçant `<TON-PROJET>` par l'identifiant de ton projet Supabase :

   ```
   https://<TON-PROJET>.supabase.co/auth/v1/callback
   ```

   **Exemple concret** : si ton `NEXT_PUBLIC_SUPABASE_URL` vaut `https://abcxyz12345.supabase.co`, alors tu colles :

   ```
   https://abcxyz12345.supabase.co/auth/v1/callback
   ```

   > 💡 Cette URL c'est *« l'adresse à laquelle Google a le droit de renvoyer l'utilisateur après l'avoir authentifié »*. C'est une sécurité : si quelqu'un essayait d'utiliser tes clés depuis un autre site, Google refuserait. **Cette adresse pointe vers Supabase, pas vers GeekStack**.

6. Clique **Create**.
7. Une pop-up s'affiche avec :
   - **Client ID** (ID client) — long, du type `1234-abcd.apps.googleusercontent.com`
   - **Client Secret** (Secret client) — du type `GOCSPX-xxxxxxx`

   👉 **Copie ces deux valeurs dans un bloc-notes**, on les colle juste après.

✅ **Tu sauras que c'est bon quand** : tu as les deux clés sous les yeux dans un endroit sûr.

---

## 3.d — Donner les clés à Supabase

> **Pourquoi ?** Supabase a maintenant tout ce qu'il faut pour parler à Google en ton nom.

1. Va sur **https://supabase.com** → ouvre ton projet `geekstack`.
2. Dans le menu de gauche, clique sur l'icône **🔒 Authentication**.
3. Sous-menu **Providers** (Fournisseurs).
4. Trouve **Google** dans la liste et clique dessus pour l'ouvrir.
5. Active le toggle **Enable Sign in with Google**.
6. Colle :
   - **Client ID (for OAuth)** : ton **Client ID** Google
   - **Client Secret (for OAuth)** : ton **Client Secret** Google
7. **Save** (en bas).

✅ **Tu sauras que c'est bon quand** : Google apparaît avec un statut **Enabled** dans la liste des Providers.

---

## 3.e — Dire à Supabase où renvoyer l'utilisateur

> **Pourquoi ?** Une fois Google authentifié, Supabase doit renvoyer l'utilisateur **chez GeekStack**. Cette étape lui dit quelles URLs sont autorisées.

1. Toujours dans **Authentication**, clique sur **URL Configuration** dans le sous-menu.
2. **Site URL** : `http://localhost:3000`

   > 💡 On mettra l'URL Vercel plus tard, en prod.

3. **Redirect URLs** : clique **Add URL** et ajoute ces deux entrées :
   ```
   http://localhost:3000/auth/callback
   https://geekstack.vercel.app/auth/callback
   ```

   > 💡 La seconde URL est anticipée pour Vercel. Si ton URL finale est différente (ex. `geekstack-bytosui.vercel.app`), tu pourras la modifier le moment venu.

4. **Save**.

✅ **Tu sauras que c'est bon quand** : les deux URLs apparaissent dans la liste des Redirect URLs.

---

## 🎉 Tu as fini !

Petit test rapide pour valider sans coder :

1. Dans Supabase → **Authentication** → **Providers** → **Google** → l'état doit être **Enabled** avec une coche verte.
2. Dans Google Cloud Console → **Credentials** → tu dois voir une ligne `OAuth 2.0 Client IDs` → `GeekStack Web`.
3. Dans Google Cloud Console → **OAuth consent screen** → statut **In production**.

Si les 3 sont OK, Google OAuth est prêt côté infra. Le bouton « Se connecter avec Google » dans GeekStack saura comment se brancher dès qu'on l'aura codé.

---

## 🆘 En cas de souci

| Symptôme | Cause probable | Solution |
|----------|----------------|----------|
| « redirect_uri_mismatch » au login | URL Supabase mal collée dans 3.c | Vérifie que l'URL Google est *exactement* `https://<projet>.supabase.co/auth/v1/callback` |
| « App not verified » bandeau jaune | Normal pour app non-vérifiée par Google | L'utilisateur clique « Advanced » → « Go to GeekStack (unsafe) ». Disparaît après quelques semaines d'usage. |
| Pas de bouton Google côté Supabase | Provider pas sauvegardé | Retourne à 3.d, refais Save |
| Tu te connectes mais après tu reviens sur une page d'erreur | Redirect URL manquante côté Supabase | Vérifie 3.e, ajoute `http://localhost:3000/auth/callback` |

---

Quand tu as fini les 5 sous-étapes, reviens me dire « OAuth ok » et on enchaîne sur la suite (`SETUP.md` → étape 4 : variables d'env locales).
