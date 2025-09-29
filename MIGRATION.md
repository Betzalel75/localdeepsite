# Migration Guide - LocalSite Hybrid Mode

Ce guide vous aide à migrer votre installation LocalSite existante vers le nouveau système hybride qui supporte à la fois les modèles locaux et cloud.

## Vue d'ensemble des changements

### Nouveautés
- ✨ Support des APIs cloud (DeepSeek, Gemini, OpenAI, Claude, etc.)
- ✨ Interface unifiée pour tous les modèles
- ✨ Auto-détection des modèles et providers disponibles
- ✨ Validation automatique des clés API
- ✨ Mode hybride (local + cloud)
- ✨ Composant de statut des providers en temps réel

### Compatibilité
- ✅ 100% compatible avec les installations Ollama existantes
- ✅ Vos modèles locaux continuent de fonctionner
- ✅ Aucune modification requise pour une utilisation locale uniquement

## Migration par étapes

### Étape 1 : Sauvegarde (optionnel mais recommandé)
```bash
# Sauvegardez votre configuration actuelle
cp .env.local .env.local.backup
```

### Étape 2 : Mise à jour des variables d'environnement

#### Option A : Mode local uniquement (aucun changement requis)
Si vous voulez continuer à utiliser uniquement les modèles locaux, votre configuration actuelle fonctionne toujours :

```env
LOCAL_MODE=true
NEXT_PUBLIC_LOCAL_MODE=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-r1:7b
```

#### Option B : Ajout du support cloud
Pour ajouter des modèles cloud à votre installation locale existante :

```env
# Gardez votre configuration locale existante
LOCAL_MODE=true
NEXT_PUBLIC_LOCAL_MODE=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-r1:7b

# Activez le mode hybride
ENABLE_MIXED_MODE=true
NEXT_PUBLIC_ENABLE_MIXED_MODE=true

# Ajoutez vos clés API (optionnel)
DEEPSEEK_API_KEY=your_deepseek_api_key
GEMINI_API_KEY=your_GEMINI_API_KEY
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GROQ_API_KEY=your_groq_api_key
```

#### Option C : Migration vers le cloud uniquement
Pour utiliser uniquement les modèles cloud :

```env
# Désactivez le mode local
LOCAL_MODE=false
NEXT_PUBLIC_LOCAL_MODE=false

# Ajoutez vos clés API
DEEPSEEK_API_KEY=your_deepseek_api_key
GEMINI_API_KEY=your_GEMINI_API_KEY
# ... autres clés API
```

### Étape 3 : Redémarrer l'application
```bash
npm run dev
```

### Étape 4 : Vérification
1. Ouvrez l'application dans votre navigateur
2. Allez dans les paramètres (icône d'engrenage)
3. Vérifiez que vos modèles sont bien détectés
4. Testez la génération avec différents modèles

## Configuration des clés API

### DeepSeek (Recommandé - Très abordable)
1. Créez un compte sur [platform.deepseek.com](https://platform.deepseek.com)
2. Générez une clé API
3. Ajoutez dans `.env.local` :
```env
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Google Gemini (Gratuit avec quotas généreux)
1. Allez sur [aistudio.google.com](https://aistudio.google.com)
2. Créez une clé API
3. Ajoutez dans `.env.local` :
```env
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### OpenAI
1. Créez un compte sur [platform.openai.com](https://platform.openai.com)
2. Générez une clé API
3. Ajoutez dans `.env.local` :
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Anthropic Claude
1. Créez un compte sur [console.anthropic.com](https://console.anthropic.com)
2. Générez une clé API
3. Ajoutez dans `.env.local` :
```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Groq (Très rapide, gratuit avec limites)
1. Créez un compte sur [console.groq.com](https://console.groq.com)
2. Générez une clé API
3. Ajoutez dans `.env.local` :
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Fonctionnalités de l'interface

### Nouveau composant de statut
- Indicateur en temps réel de l'état des providers
- Accessible via l'icône dans le header de l'éditeur
- Affiche le nombre de modèles disponibles
- Permet de rafraîchir la détection

### Paramètres améliorés
- Filtrage par type de modèle (Local/Cloud/Tous)
- Auto-sélection du meilleur provider
- Validation des clés API en temps réel
- Interface adaptative selon les providers disponibles

### Sélection intelligente
- L'application recommande automatiquement le meilleur modèle disponible
- Priorité donnée aux modèles locaux si disponibles
- Fallback automatique en cas d'indisponibilité

## Résolution de problèmes

### Les modèles cloud ne s'affichent pas
1. Vérifiez que vos clés API sont correctes dans `.env.local`
2. Redémarrez l'application
3. Vérifiez la console pour les erreurs de validation
4. Testez vos clés avec `/api/check-api-keys`

### Les modèles locaux ont disparu
1. Assurez-vous qu'Ollama fonctionne : `ollama list`
2. Vérifiez que `OLLAMA_BASE_URL` est correct
3. Redémarrez Ollama : `ollama serve`
4. Rafraîchissez la détection dans l'interface

### Erreurs de réseau
1. Vérifiez votre connexion Internet
2. Certains providers peuvent être bloqués dans votre région
3. Utilisez un VPN si nécessaire
4. Consultez le statut des services des providers

### Performance dégradée
1. Les modèles cloud sont généralement plus rapides
2. Vérifiez votre quota/limite de taux
3. Considérez utiliser Groq pour la vitesse
4. Revenez aux modèles locaux si nécessaire

## Migration des projets existants

### Projets créés avec des modèles locaux
- Continueront de fonctionner normalement
- Peuvent être édités avec des modèles cloud
- Pas de conversion nécessaire

### Historique des prompts
- Préservé lors de la migration
- Compatible avec tous types de modèles
- Accessible depuis l'interface histoire

## Recommandations

### Pour un usage occasionnel
- Utilisez Google Gemini (gratuit avec quotas généreux)
- Ou Groq (très rapide, gratuit avec limites)

### Pour un usage intensif
- DeepSeek (très abordable, excellente qualité)
- Combiné avec des modèles locaux pour la confidentialité

### Pour la confidentialité maximale
- Gardez uniquement les modèles locaux
- Utilisez le mode `LOCAL_MODE=true`
- Aucune donnée ne sera envoyée sur Internet

### Configuration optimale
```env
# Mode hybride optimal
ENABLE_MIXED_MODE=true
NEXT_PUBLIC_ENABLE_MIXED_MODE=true

# Local pour la confidentialité
OLLAMA_BASE_URL=http://localhost:11434

# Cloud pour la performance
DEEPSEEK_API_KEY=your_key
GEMINI_API_KEY=your_key
GROQ_API_KEY=your_key
```

## Support et aide

### Logs de débogage
- Ouvrez la console développeur (F12)
- Vérifiez l'onglet "Network" pour les erreurs API
- Consultez l'onglet "Console" pour les messages d'erreur

### Test de connectivité
Utilisez ces endpoints pour tester votre configuration :
- `/api/check-api-keys` - Vérifie les clés disponibles
- `/api/ollama-models` - Liste les modèles Ollama
- `/api/test-api-key` - Teste une clé API spécifique

### Restauration en cas de problème
```bash
# Restaurez votre configuration précédente
cp .env.local.backup .env.local
npm run dev
```

## Questions fréquentes

### Q: Mes modèles locaux sont-ils toujours prioritaires ?
R: Oui, si vous avez des modèles locaux disponibles, ils seront proposés en premier dans l'interface.

### Q: Mes données sont-elles envoyées au cloud sans mon consentement ?
R: Non, vous choisissez explicitement quel modèle utiliser. Les modèles locaux restent 100% privés.

### Q: Puis-je mélanger modèles locaux et cloud dans le même projet ?
R: Oui, vous pouvez utiliser différents modèles pour différentes parties du projet.

### Q: Comment savoir si j'utilise un modèle local ou cloud ?
R: L'interface indique clairement le type de modèle (Local/Cloud) dans les paramètres.

### Q: Que se passe-t-il si ma connexion Internet tombe ?
R: Vous pouvez continuer à utiliser les modèles locaux normalement.

---

🎉 **Félicitations !** Vous avez maintenant accès au meilleur des deux mondes : la confidentialité des modèles locaux ET la puissance des modèles cloud !