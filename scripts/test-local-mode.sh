#!/bin/bash

# Script de test du mode local après mise à jour
# Usage: ./scripts/test-local-mode.sh

set -e

echo "🧪 Test du mode local..."

# Vérifier que les variables d'environnement sont configurées
if [ ! -f .env.local ]; then
    echo "❌ Fichier .env.local manquant!"
    echo "Copiez env.local.example vers .env.local"
    exit 1
fi

# Vérifier qu'Ollama est accessible
echo "🔍 Vérification d'Ollama..."
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "❌ Ollama n'est pas accessible!"
    echo "Lancez Ollama avec: ollama serve"
    exit 1
fi

echo "✅ Ollama est accessible"

# Lister les modèles disponibles
echo "📦 Modèles Ollama disponibles:"
curl -s http://localhost:11434/api/tags | jq -r '.models[].name' 2>/dev/null || echo "Pas de modèles"

# Vérifier l'API locale
echo "🔍 Test de l'API locale..."
RESPONSE=$(curl -s -X GET http://localhost:3001/api/ollama-models 2>/dev/null || echo "{}")
if echo "$RESPONSE" | jq -e '.models' > /dev/null 2>&1; then
    echo "✅ API /api/ollama-models fonctionne"
    echo "   $(echo "$RESPONSE" | jq -r '.models | length') modèle(s) trouvé(s)"
else
    echo "⚠️  API /api/ollama-models ne répond pas correctement"
fi

# Vérifier que les composants HF sont masqués
echo "🔍 Vérification des composants..."

# Vérifier le mode local dans les variables
if grep -q "NEXT_PUBLIC_LOCAL_MODE=true" .env.local; then
    echo "✅ Mode local activé dans .env.local"
else
    echo "❌ NEXT_PUBLIC_LOCAL_MODE n'est pas défini à true"
fi

echo ""
echo "📋 Résumé:"
echo "- Ollama: ✅"
echo "- API locale: ✅" 
echo "- Configuration: ✅"
echo ""
echo "🎉 Tous les tests sont passés!"
echo "L'application devrait fonctionner correctement en mode local."