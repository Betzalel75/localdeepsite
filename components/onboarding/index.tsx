"use client";

import { useState, useEffect } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Zap,
  Shield,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useModelConfiguration } from "@/hooks/useApiManager";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const {
    localProviders,
    cloudProviders,
    canUseLocalModels,
    canUseCloudModels,
  } = useModelConfiguration();

  useEffect(() => {
    // Check if user has seen the onboarding
    const seen = localStorage.getItem("localsite-onboarding-seen");
    if (!seen) {
      setIsOpen(true);
    } else {
      setHasSeenOnboarding(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem("localsite-onboarding-seen", "true");
    setHasSeenOnboarding(true);
    setIsOpen(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem("localsite-onboarding-seen");
    setHasSeenOnboarding(false);
    setCurrentStep(0);
    setIsOpen(true);
  };

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Bienvenue dans LocalSite Hybride !",
      description: "Découvrez les nouvelles fonctionnalités",
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      content: (
        <div className="text-center space-y-4">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-neutral-100">
            LocalSite Hybride est arrivé !
          </h3>
          <p className="text-neutral-300 max-w-md">
            Vous pouvez maintenant utiliser à la fois des modèles IA locaux
            (Ollama) et des APIs cloud (DeepSeek, Gemini, OpenAI, etc.) dans une
            interface unifiée.
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <Badge variant="secondary" className="gap-2">
              <Shield className="h-3 w-3" />
              100% Local
            </Badge>
            <Badge variant="secondary" className="gap-2">
              <Globe className="h-3 w-3" />
              APIs Cloud
            </Badge>
          </div>
        </div>
      ),
    },
    {
      id: "local-models",
      title: "Modèles Locaux",
      description: "Confidentialité et contrôle total",
      icon: <Shield className="h-8 w-8 text-blue-500" />,
      content: (
        <div className="space-y-4">
          <div className="bg-blue-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-neutral-100 text-center">
            Modèles Locaux avec Ollama
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-neutral-200">100% Privé</p>
                <p className="text-sm text-neutral-400">
                  Aucune donnée n&aposest envoyée sur Internet
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-neutral-200">Pas de coûts</p>
                <p className="text-sm text-neutral-400">
                  Utilisez vos ressources locales
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-neutral-200">Contrôle total</p>
                <p className="text-sm text-neutral-400">
                  Choisissez vos modèles et paramètres
                </p>
              </div>
            </div>
          </div>
          {canUseLocalModels && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm">
                ✅ {localProviders.length} provider(s) local(aux) détecté(s)
              </p>
            </div>
          )}
          {!canUseLocalModels && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-amber-400 text-sm">
                💡 Installez Ollama pour utiliser des modèles locaux
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "cloud-models",
      title: "Modèles Cloud",
      description: "Performance et modèles de pointe",
      icon: <Globe className="h-8 w-8 text-purple-500" />,
      content: (
        <div className="space-y-4">
          <div className="bg-purple-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
            <Globe className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-neutral-100 text-center">
            APIs Cloud Disponibles
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-neutral-800 rounded-lg text-center">
                <p className="font-medium text-neutral-200">DeepSeek</p>
                <p className="text-xs text-neutral-400">Très abordable</p>
              </div>
              <div className="p-3 bg-neutral-800 rounded-lg text-center">
                <p className="font-medium text-neutral-200">Gemini</p>
                <p className="text-xs text-neutral-400">Gratuit</p>
              </div>
              <div className="p-3 bg-neutral-800 rounded-lg text-center">
                <p className="font-medium text-neutral-200">GPT-4</p>
                <p className="text-xs text-neutral-400">Haute qualité</p>
              </div>
              <div className="p-3 bg-neutral-800 rounded-lg text-center">
                <p className="font-medium text-neutral-200">Claude</p>
                <p className="text-xs text-neutral-400">Excellent</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg">
              <CheckCircle className="h-5 w-5 text-purple-500" />
              <div>
                <p className="font-medium text-neutral-200">
                  Performance optimisée
                </p>
                <p className="text-sm text-neutral-400">
                  Modèles de dernière génération
                </p>
              </div>
            </div>
          </div>
          {canUseCloudModels && (
            <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <p className="text-purple-400 text-sm">
                ✅ {cloudProviders.length} provider(s) cloud configuré(s)
              </p>
            </div>
          )}
          {!canUseCloudModels && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm">
                💡 Ajoutez des clés API dans .env.local pour utiliser les
                modèles cloud
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "how-to-use",
      title: "Comment utiliser",
      description: "Interface simple et intuitive",
      icon: <Zap className="h-8 w-8 text-green-500" />,
      content: (
        <div className="space-y-4">
          <div className="bg-green-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-neutral-100 text-center">
            Utilisation Simple
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-neutral-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold text-neutral-200">
                1
              </div>
              <div>
                <p className="font-medium text-neutral-200">
                  Ouvrez les Paramètres
                </p>
                <p className="text-sm text-neutral-400">
                  Cliquez sur l&aposicône d&aposengrenage dans l&aposéditeur
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-neutral-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold text-neutral-200">
                2
              </div>
              <div>
                <p className="font-medium text-neutral-200">
                  Choisissez votre Type
                </p>
                <p className="text-sm text-neutral-400">
                  Local Only, Cloud Only, ou All Models
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-neutral-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold text-neutral-200">
                3
              </div>
              <div>
                <p className="font-medium text-neutral-200">
                  Sélectionnez un Modèle
                </p>
                <p className="text-sm text-neutral-400">
                  L&aposapplication recommande automatiquement le meilleur
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-neutral-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold text-neutral-200">
                4
              </div>
              <div>
                <p className="font-medium text-neutral-200">
                  Commencez à Créer !
                </p>
                <p className="text-sm text-neutral-400">
                  Tapez votre demande et laissez l&aposIA travailler
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "status",
      title: "État des Providers",
      description: "Surveillez vos modèles disponibles",
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
      content: (
        <div className="space-y-4">
          <div className="bg-green-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-neutral-100 text-center">
            Statut en Temps Réel
          </h3>
          <div className="space-y-3">
            <p className="text-neutral-300 text-center">
              Un nouveau composant de statut vous permet de surveiller tous vos
              providers et modèles disponibles.
            </p>
            <div className="bg-neutral-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-300">
                  Providers en ligne
                </span>
                <Badge variant="secondary">
                  {(canUseLocalModels ? 1 : 0) + (canUseCloudModels ? 1 : 0)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-300">
                  Modèles disponibles
                </span>
                <Badge variant="secondary">
                  {localProviders.reduce(
                    (acc, p) => acc + p.supportedModels.length,
                    0,
                  ) +
                    cloudProviders.reduce(
                      (acc, p) => acc + p.supportedModels.length,
                      0,
                    )}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-neutral-400 text-center">
              💡 Cliquez sur l&aposindicateur de statut dans le header pour plus
              de détails
            </p>
          </div>
        </div>
      ),
    },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  if (!isOpen && hasSeenOnboarding) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={resetOnboarding}
        className="text-neutral-400 hover:text-neutral-300"
      >
        🎯 Guide
      </Button>
    );
  }

  if (!isOpen && !hasSeenOnboarding) {
    return null;
  }

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl bg-neutral-900 border-neutral-800 p-0">
        <DialogTitle className="hidden" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            {currentStepData.icon}
            <div>
              <h2 className="text-lg font-bold text-neutral-100">
                {currentStepData.title}
              </h2>
              <p className="text-sm text-neutral-400">
                {currentStepData.description}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">{currentStepData.content}</div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-800">
          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? "bg-blue-500"
                    : index < currentStep
                      ? "bg-green-500"
                      : "bg-neutral-600"
                }`}
              />
            ))}
            <span className="text-xs text-neutral-400 ml-2">
              {currentStep + 1} / {steps.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button onClick={completeOnboarding} className="gap-2">
                Commencer
                <CheckCircle className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={nextStep} className="gap-2">
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export a hook to manually trigger onboarding
export const useOnboarding = () => {
  const resetOnboarding = () => {
    localStorage.removeItem("localsite-onboarding-seen");
    window.location.reload();
  };

  return { resetOnboarding };
};
