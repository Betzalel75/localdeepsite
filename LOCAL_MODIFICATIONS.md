# Modifications LocalSite

Ce fichier documente toutes les modifications apportées pour le mode local.

## Fichiers modifiés

### Configuration
- `.env.local` - Configuration du mode local
- `env.local.example` - Exemple de configuration

### Routes API
- `app/api/ask-ai-local/route.ts` - **NOUVEAU** - Route pour Ollama
- `app/api/ollama-models/route.ts` - **NOUVEAU** - Liste dynamique des modèles
- `app/api/me/route.ts` - Utilisateur fictif en mode local
- `app/api/me/projects/route.ts` - Désactivation en mode local

### Librairies
- `lib/auth.ts` - Bypass authentification (ligne 12-20)
- `lib/providers.ts` - Ajout providers locaux (ligne 37-49, 92-127)
- `lib/client-config.ts` - **NOUVEAU** - Configuration client
- `lib/providers-dynamic.ts` - **NOUVEAU** - Providers dynamiques

### Composants
- `components/contexts/app-context.tsx` - Skip auth en mode local (ligne 28-32)
- `components/editor/ask-ai/index.tsx` - Utilisation route locale (ligne 25, 60-61)
- `components/editor/ask-ai/settings.tsx` - Modèles dynamiques
- `components/editor/deploy-button/index.tsx` - Masqué en mode local (ligne 39-42)
- `components/editor/save-button/index.tsx` - Masqué en mode local (ligne 26-29)
- `components/login-modal/index.tsx` - Masqué en mode local (ligne 24-27)

### Hooks
- `hooks/useLocalMode.ts` - **NOUVEAU** - Détection mode local
- `hooks/useOllamaModels.ts` - **NOUVEAU** - Chargement modèles Ollama

### Assets
- `public/providers/ollama.svg` - **NOUVEAU**
- `public/providers/lm-studio.svg` - **NOUVEAU**

## Patterns de modification

### 1. Détection du mode local
```typescript
const isLocalMode = process.env.NEXT_PUBLIC_LOCAL_MODE === "true";
if (isLocalMode) {
  // Comportement local
}
```

### 2. Bypass d'authentification
```typescript
if (process.env.LOCAL_MODE === "true") {
  return { user: localUser };
}
```

### 3. Masquage de composants
```typescript
if (isLocalMode) {
  return null;
}
```

## Résolution de conflits

Lors d'une mise à jour, prioriser :
1. **Garder** : Nos conditions `isLocalMode`
2. **Merger** : Nouvelles fonctionnalités DeepSite
3. **Adapter** : Nouvelles routes API pour le mode local

## Tests après mise à jour

- [ ] L'application démarre sans erreur
- [ ] Ollama répond correctement
- [ ] Les modèles s'affichent dans la liste
- [ ] La génération de sites fonctionne
- [ ] Pas de boutons de déploiement visibles
- [ ] Pas de modals de login
- [ ] Pas d'appels à HuggingFace dans la console