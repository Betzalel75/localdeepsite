# LocalSite - Mode Hybride Local & Cloud

Ce projet permet d'utiliser à la fois des modèles IA locaux (Ollama, LM Studio) et des APIs cloud (DeepSeek, Gemini, OpenAI, etc.) pour générer des sites web avec l'IA.

## Prérequis

1. **Node.js** version 18 ou supérieure

2. **Pour utilisation locale** (optionnel) :
   - **Ollama** installé et fonctionnel
     ```bash
     # macOS/Linux
     curl -fsSL https://ollama.com/install.sh | sh
     
     # Ou via Homebrew sur macOS
     brew install ollama
     ```
   - **Un modèle Ollama** téléchargé (recommandé : DeepSeek R1)
     ```bash
     ollama pull deepseek-r1:7b
     # Ou pour plus de performance :
     ollama pull deepseek-r1:14b
     ollama pull deepseek-r1:32b
     ```

3. **Pour utilisation cloud** (optionnel) :
   - Clés API de vos providers préférés (DeepSeek, Gemini, OpenAI, etc.)

## Installation

1. Clonez le repository :
   ```bash
   git clone https://github.com/Korben00/LocalSite
   cd LocalSite
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Configurez l'environnement :
   ```bash
   cp .env.local.example .env.local
   ```

4. Éditez `.env.local` selon vos besoins :

   **Pour mode 100% local :**
   ```env
   LOCAL_MODE=true
   NEXT_PUBLIC_LOCAL_MODE=true
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=deepseek-r1:7b
   ```

   **Pour mode cloud uniquement :**
   ```env
   LOCAL_MODE=false
   NEXT_PUBLIC_LOCAL_MODE=false
   
   # Ajoutez vos clés API
   DEEPSEEK_API_KEY=your_deepseek_api_key
   GOOGLE_API_KEY=your_google_api_key
   OPENAI_API_KEY=your_openai_api_key
   # etc...
   ```

   **Pour mode hybride (local + cloud) :**
   ```env
   ENABLE_MIXED_MODE=true
   NEXT_PUBLIC_ENABLE_MIXED_MODE=true
   
   # Configuration locale
   OLLAMA_BASE_URL=http://localhost:11434
   
   # Clés API cloud (optionnelles)
   DEEPSEEK_API_KEY=your_deepseek_api_key
   GOOGLE_API_KEY=your_google_api_key
   ```

## Utilisation

1. **Si vous utilisez des modèles locaux**, démarrez Ollama :
   ```bash
   ollama serve
   ```

2. Lancez l'application :
   ```bash
   npm run dev
   ```

3. Ouvrez votre navigateur à l'adresse : http://localhost:3000

4. **Dans les paramètres de l'éditeur** :
   - Choisissez entre modèles locaux et cloud
   - Sélectionnez votre provider préféré
   - L'application détecte automatiquement les modèles disponibles

## Fonctionnalités

### Mode Local
- ✅ Génération de sites web avec IA locale (Ollama, LM Studio)
- ✅ Modification en temps réel
- ✅ Pas besoin de clés API
- ✅ Données 100% privées
- ✅ Support de plusieurs modèles locaux
- ✅ Détection automatique des modèles installés

### Mode Cloud
- ✅ Accès aux modèles de pointe (DeepSeek, Gemini, GPT-4, Claude)
- ✅ Performance optimisée
- ✅ Pas besoin d'installation locale
- ✅ Support de multiples providers
- ✅ Validation automatique des clés API

### Mode Hybride
- ✅ Choix dynamique entre local et cloud
- ✅ Fallback automatique si un provider n'est pas disponible
- ✅ Interface unifiée pour tous les modèles
- ✅ Configuration flexible

## Modèles recommandés

### Modèles Locaux (Ollama)
| Modèle | VRAM nécessaire | Performance | Usage |
|--------|----------------|-------------|-------|
| deepseek-r1:7b | 6 GB | Rapide | Développement général |
| deepseek-r1:14b | 12 GB | Bon équilibre | Projets complexes |
| deepseek-r1:32b | 24 GB | Haute qualité | Projets professionnels |
| qwen2.5-coder:32b | 24 GB | Excellent | Spécialisé code |
| llama3.3:70b | 48 GB | Très haute qualité | Maximum de qualité |

### Modèles Cloud
| Provider | Modèle | Performance | Coût |
|----------|--------|-------------|------|
| DeepSeek | DeepSeek R1 | Excellent | Très bas |
| Google | Gemini 2.0 Flash | Très bon | Bas |
| OpenAI | GPT-4o | Excellent | Moyen |
| Anthropic | Claude 3.5 Sonnet | Excellent | Moyen |
| Groq | Llama 3.3 70B | Très rapide | Bas |

## Troubleshooting

### Problèmes Locaux

#### Ollama ne répond pas
```bash
# Vérifier qu'Ollama fonctionne
curl http://localhost:11434/api/tags

# Redémarrer Ollama
killall ollama
ollama serve
```

#### Modèle non trouvé
```bash
# Lister les modèles installés
ollama list

# Télécharger le modèle manquant
ollama pull nom-du-modele
```

#### Performance lente
- Utilisez un modèle plus petit (7b au lieu de 32b)
- Fermez d'autres applications gourmandes en mémoire
- Considérez l'utilisation d'un GPU compatible

### Problèmes Cloud

#### Clé API invalide
- Vérifiez que vos clés API sont correctes dans `.env.local`
- Testez vos clés avec l'endpoint `/api/check-api-keys`
- Assurez-vous d'avoir des crédits suffisants

#### Erreur de rate limiting
- Attendez quelques minutes avant de réessayer
- Considérez l'upgrade vers un plan payant du provider
- Utilisez un modèle local en fallback

#### Modèles non détectés
- Redémarrez l'application après avoir ajouté des clés API
- Vérifiez les logs de la console pour les erreurs
- Utilisez le bouton "Refresh" dans les paramètres

## Configuration des Providers

### Providers Locaux

#### LM Studio
1. Configurez LM Studio pour écouter sur le port 1234
2. Modifiez `.env.local` :
   ```env
   LM_STUDIO_BASE_URL=http://localhost:1234
   ```

#### LocalAI
1. Lancez LocalAI sur le port 8080
2. Modifiez `.env.local` :
   ```env
   LOCALAI_BASE_URL=http://localhost:8080
   ```

### Providers Cloud

#### DeepSeek
1. Créez un compte sur [DeepSeek](https://platform.deepseek.com/)
2. Générez une clé API
3. Ajoutez dans `.env.local` :
   ```env
   DEEPSEEK_API_KEY=your_api_key
   ```

#### Google Gemini
1. Créez un projet sur [Google AI Studio](https://aistudio.google.com/)
2. Générez une clé API
3. Ajoutez dans `.env.local` :
   ```env
   GOOGLE_API_KEY=your_api_key
   ```

#### OpenAI
1. Créez un compte sur [OpenAI](https://platform.openai.com/)
2. Générez une clé API
3. Ajoutez dans `.env.local` :
   ```env
   OPENAI_API_KEY=your_api_key
   ```

#### Anthropic Claude
1. Créez un compte sur [Anthropic](https://console.anthropic.com/)
2. Générez une clé API
3. Ajoutez dans `.env.local` :
   ```env
   ANTHROPIC_API_KEY=your_api_key
   ```

## Fonctionnalités Avancées

### Auto-détection
- Détection automatique des modèles Ollama installés
- Validation automatique des clés API cloud
- Sélection intelligente du meilleur provider disponible

### Interface Adaptative
- Bascule fluide entre providers locaux et cloud
- Paramètres contextuels selon le type de modèle
- Indicateurs de statut en temps réel

### Téléchargement de Projets
- Export automatique en ZIP
- Séparation CSS/JS/HTML
- README généré automatiquement

## Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une PR.

## Licence

Ce projet est basé sur DeepSite original par enzostvs.
Modifications pour le mode hybride local/cloud par l'équipe LocalSite.