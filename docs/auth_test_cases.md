# Documentation des Cas de Test d'Authentification

## Introduction

Ce document détaille les cas de test pour le système d'authentification, incluant les scénarios normaux et les cas d'erreur. Chaque cas de test est accompagné des résultats attendus et des instructions pour reproduire le scénario.

## Table des Matières

1. [Inscription (Sign Up)](#1-inscription-sign-up)
2. [Connexion (Sign In)](#2-connexion-sign-in)
3. [Email Non Confirmé](#3-email-non-confirmé)
4. [Renvoi d'Email de Confirmation](#4-renvoi-demail-de-confirmation)
5. [Magic Link](#5-magic-link)
6. [Normalisation d'Email](#6-normalisation-demail)
7. [Gestion des Erreurs](#7-gestion-des-erreurs)

## 1. Inscription (Sign Up)

### TC-1.1: Inscription réussie

**Description**: Utilisateur s'inscrit avec un email et mot de passe valides.

**Étapes**:
1. Accéder à la page d'inscription
2. Saisir un email valide (ex: `test@example.com`)
3. Saisir un mot de passe valide (min. 8 caractères, avec majuscule, chiffre et caractère spécial)
4. Cliquer sur "S'inscrire"

**Résultat attendu**:
- Message de succès: "Inscription réussie! Veuillez vérifier votre email pour confirmer votre compte."
- Email de confirmation envoyé à l'adresse fournie
- Redirection vers la page de connexion ou page d'attente de confirmation

**Test automatisé**: `src/components/auth/__tests__/SignUpForm.test.tsx`

### TC-1.2: Inscription avec email déjà utilisé

**Description**: Tentative d'inscription avec un email déjà enregistré.

**Étapes**:
1. Accéder à la page d'inscription
2. Saisir un email déjà utilisé
3. Saisir un mot de passe valide
4. Cliquer sur "S'inscrire"

**Résultat attendu**:
- Message d'erreur: "Cet email est déjà associé à un compte. Veuillez vous connecter ou utiliser un autre email."
- Formulaire reste affiché avec les données saisies
- Champ email mis en évidence avec erreur

**Test automatisé**: `src/components/auth/__tests__/SignUpForm.test.tsx`

## 2. Connexion (Sign In)

### TC-2.1: Connexion réussie avec email confirmé

**Description**: Utilisateur se connecte avec des identifiants valides et email confirmé.

**Étapes**:
1. Accéder à la page de connexion
2. Saisir un email valide et confirmé
3. Saisir le mot de passe correct
4. Cliquer sur "Se connecter"

**Résultat attendu**:
- Connexion réussie
- Redirection vers le dashboard
- Token d'authentification stocké
- État utilisateur mis à jour dans le contexte

**Test automatisé**: `src/components/auth/__tests__/SignInForm.test.tsx`

### TC-2.2: Connexion avec mot de passe incorrect

**Description**: Tentative de connexion avec un email valide mais mot de passe incorrect.

**Étapes**:
1. Accéder à la page de connexion
2. Saisir un email valide
3. Saisir un mot de passe incorrect
4. Cliquer sur "Se connecter"

**Résultat attendu**:
- Message d'erreur: "Email ou mot de passe incorrect"
- Formulaire reste affiché avec l'email saisi
- Champ mot de passe vidé

**Test automatisé**: `src/components/auth/__tests__/SignInForm.test.tsx`

## 3. Email Non Confirmé

### TC-3.1: Connexion avec email non confirmé

**Description**: Utilisateur tente de se connecter avec un compte dont l'email n'est pas confirmé.

**Étapes**:
1. Accéder à la page de connexion
2. Saisir un email valide mais non confirmé
3. Saisir le mot de passe correct
4. Cliquer sur "Se connecter"

**Résultat attendu**:
- Message d'erreur: "Votre email n'a pas été confirmé. Veuillez vérifier votre boîte de réception ou cliquer ci-dessous pour recevoir un nouvel email de confirmation."
- Bouton "Renvoyer l'email de confirmation" affiché
- Formulaire reste affiché avec l'email saisi

**Test automatisé**: `src/components/auth/__tests__/EmailNotConfirmedBanner.test.tsx`

### TC-3.2: Affichage de la bannière pour email non confirmé

**Description**: Vérifier que la bannière s'affiche correctement sur le dashboard pour un utilisateur avec email non confirmé.

**Étapes**:
1. Se connecter avec un compte dont l'email n'est pas confirmé
2. Accéder au dashboard

**Résultat attendu**:
- Bannière `EmailNotConfirmedBanner` visible en haut du dashboard
- Message explicatif sur la nécessité de confirmer l'email
- Bouton "Renvoyer l'email de confirmation" fonctionnel

**Test automatisé**: `src/components/auth/__tests__/EmailNotConfirmedBanner.test.tsx`

## 4. Renvoi d'Email de Confirmation

### TC-4.1: Renvoi d'email de confirmation réussi

**Description**: Utilisateur demande un nouvel email de confirmation.

**Étapes**:
1. Se connecter avec un compte dont l'email n'est pas confirmé
2. Cliquer sur "Renvoyer l'email de confirmation" dans la bannière

**Résultat attendu**:
- Message de succès: "Email de confirmation envoyé à [email]"
- Bouton désactivé pendant 60 secondes (cooldown)
- Compteur affiché indiquant le temps restant avant de pouvoir renvoyer

**Test automatisé**: `src/components/auth/__tests__/ResendConfirmationButton.test.tsx`

### TC-4.2: Limitation du renvoi d'email (cooldown)

**Description**: Vérifier que l'utilisateur ne peut pas demander plusieurs emails de confirmation en succession rapide.

**Étapes**:
1. Se connecter avec un compte dont l'email n'est pas confirmé
2. Cliquer sur "Renvoyer l'email de confirmation"
3. Tenter de cliquer à nouveau immédiatement après

**Résultat attendu**:
- Premier clic: Email envoyé, message de succès
- Bouton désactivé avec compteur de temps
- Second clic: Aucune action (bouton désactivé)

**Test automatisé**: `src/components/auth/__tests__/ResendConfirmationButton.test.tsx`

## 5. Magic Link

### TC-5.1: Demande de Magic Link réussie

**Description**: Utilisateur demande une connexion par Magic Link.

**Étapes**:
1. Accéder à la page de connexion
2. Cliquer sur "Se connecter avec un Magic Link"
3. Saisir un email valide
4. Cliquer sur "Envoyer le Magic Link"

**Résultat attendu**:
- Message de succès: "Magic Link envoyé à [email]"
- Instructions pour vérifier la boîte de réception
- Email contenant le Magic Link envoyé à l'adresse fournie

**Test automatisé**: `src/components/auth/__tests__/MagicLinkForm.test.tsx`

### TC-5.2: Validation du Magic Link

**Description**: Utilisateur clique sur le Magic Link reçu par email.

**Étapes**:
1. Recevoir un email avec Magic Link
2. Cliquer sur le lien dans l'email

**Résultat attendu**:
- Redirection vers l'application
- Connexion automatique
- Redirection vers le dashboard
- État utilisateur mis à jour dans le contexte

**Test manuel**: Ce test nécessite une vérification manuelle avec un vrai email.

## 6. Normalisation d'Email

### TC-6.1: Correction automatique des domaines courants

**Description**: Vérifier que le système corrige automatiquement les fautes de frappe dans les domaines d'email courants.

**Étapes**:
1. Accéder à la page de connexion
2. Saisir un email avec une faute de frappe dans le domaine (ex: `user@gmial.com`)
3. Soumettre le formulaire

**Résultat attendu**:
- Suggestion de correction: "Vouliez-vous dire user@gmail.com?"
- Option pour utiliser l'email corrigé
- Option pour conserver l'email original

**Test automatisé**: `src/utils/__tests__/emailNormalizer.test.tsx`

### TC-6.2: Validation d'email avec domaine inexistant

**Description**: Vérifier que le système détecte les domaines d'email probablement invalides.

**Étapes**:
1. Accéder à la page de connexion
2. Saisir un email avec un domaine probablement invalide (ex: `user@domaineinexistant.xyz`)
3. Soumettre le formulaire

**Résultat attendu**:
- Avertissement: "Ce domaine d'email semble inhabituel. Veuillez vérifier votre saisie."
- Option pour continuer malgré l'avertissement
- Suggestion de domaines populaires

**Test automatisé**: `src/utils/__tests__/emailValidator.test.tsx`

## 7. Gestion des Erreurs

### TC-7.1: Erreur de connexion avec message contextuel

**Description**: Vérifier que les erreurs d'authentification affichent des messages contextuels utiles.

**Étapes**:
1. Provoquer différentes erreurs d'authentification (mot de passe incorrect, compte inexistant, etc.)
2. Observer les messages d'erreur

**Résultat attendu**:
- Messages d'erreur spécifiques et utiles
- Suggestions d'actions correctives
- Pas de messages techniques ou codes d'erreur bruts

**Test automatisé**: `src/context/__tests__/AuthContext.test.tsx`

### TC-7.2: Journalisation des tentatives d'authentification

**Description**: Vérifier que les tentatives d'authentification sont correctement journalisées.

**Étapes**:
1. Effectuer diverses tentatives d'authentification (réussies et échouées)
2. Vérifier les logs dans la table `auth_logs`

**Résultat attendu**:
- Chaque tentative enregistrée avec timestamp
- Statut de la tentative (succès/échec) correctement enregistré
- Détails pertinents stockés (type d'erreur, méthode d'authentification)
- Aucune information sensible (mot de passe) dans les logs

**Test manuel**: Ce test nécessite un accès à la base de données.

## Matrice de Couverture des Tests

| Fonctionnalité | Tests Unitaires | Tests d'Intégration | Tests E2E | Couverture |
|----------------|-----------------|---------------------|-----------|------------|
| Inscription | ✅ | ✅ | ⚠️ | 90% |
| Connexion | ✅ | ✅ | ⚠️ | 90% |
| Email Non Confirmé | ✅ | ✅ | ❌ | 80% |
| Renvoi d'Email | ✅ | ✅ | ❌ | 85% |
| Magic Link | ✅ | ⚠️ | ❌ | 70% |
| Normalisation d'Email | ✅ | ⚠️ | ❌ | 75% |
| Gestion des Erreurs | ✅ | ⚠️ | ❌ | 75% |

**Légende**:
- ✅ Tests complets
- ⚠️ Tests partiels
- ❌ Tests manquants

## Prochaines Étapes

1. Compléter les tests E2E pour les flux d'authentification principaux
2. Améliorer la couverture des tests pour Magic Link
3. Ajouter des tests de performance pour les opérations d'authentification
4. Implémenter des tests de sécurité (tentatives multiples, injection)