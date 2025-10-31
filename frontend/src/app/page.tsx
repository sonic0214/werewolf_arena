'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useGameActions, useGameSettings, useGameLoading, useGameError, useCurrentGame } from '@/lib/store/gameStore';
import { useModels } from '@/lib/hooks/useModels';
import { ModelInfo } from '@/types/api';

export default function Home() {
  const router = useRouter();
  const { models, loading: modelsLoading } = useModels();
  const { startGame, setGameSettings } = useGameActions();
  const gameSettings = useGameSettings();
  const gameLoading = useGameLoading();
  const gameError = useGameError();
  const currentGame = useCurrentGame();

  const [villagerModel, setVillagerModel] = useState<string>('glmz1-flash');
  const [werewolfModel, setWerewolfModel] = useState<string>('glmz1-flash');
  const [customPlayerNames, setCustomPlayerNames] = useState<string>('');

  // Set default model when models are loaded
  useEffect(() => {
    if (models && models.length > 0) {
      // Find the default model or use the first available one
      const defaultModel = models.find(m => m.alias === 'glmz1-flash') || models[0];
      if (defaultModel && !villagerModel) {
        setVillagerModel(defaultModel.alias);
        setWerewolfModel(defaultModel.alias);
      }
    }
  }, [models]);

  // Auto-redirect to live game page when game starts successfully
  useEffect(() => {
    if (currentGame && currentGame.session_id && gameLoading === 'success') {
      console.log('Game started successfully, redirecting to live page:', currentGame.session_id);
      router.push(`/live/${currentGame.session_id}`);
    }
  }, [currentGame, gameLoading, router]);

  const handleStartGame = async () => {
    try {
      // Update game settings
      const playerNames = customPlayerNames
        ? customPlayerNames.split(',').map(name => name.trim()).filter(name => name)
        : undefined;

      setGameSettings({
        villager_models: [villagerModel],
        werewolf_models: [werewolfModel],
        player_names: playerNames,
      });

      // Start game
      await startGame({
        villager_model: villagerModel,
        werewolf_model: werewolfModel,
        player_names: playerNames,
        discussion_time_minutes: 5,
        max_rounds: 10,
      });

    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  // Filter enabled models only
  const enabledModels = models?.filter(model => model.enabled) || [];
  const modelOptions = enabledModels.map(model => ({
    value: model.alias,
    label: `${model.name} (${model.provider})`,
    disabled: !model.enabled
  }));

  if (modelsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Available Models...</h2>
          <p className="text-gray-600">Please wait while we fetch the AI models.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🐺 Werewolf Arena
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered social deduction game where language models compete in the classic Werewolf game
          </p>
        </div>

        {/* Game Configuration */}
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Game Configuration</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Villager Model */}
            <div>
              <Select
                label="Villager Model"
                placeholder="Select villager model"
                value={villagerModel}
                onChange={(value) => setVillagerModel(value as string)}
                options={modelOptions}
                helperText="Model for villagers"
              />
              {villagerModel && (
                <div className="mt-2">
                  <Badge variant="secondary">
                    {enabledModels.find(m => m.alias === villagerModel)?.name || villagerModel}
                  </Badge>
                </div>
              )}
            </div>

            {/* Werewolf Model */}
            <div>
              <Select
                label="Werewolf Model"
                placeholder="Select werewolf model"
                value={werewolfModel}
                onChange={(value) => setWerewolfModel(value as string)}
                options={modelOptions}
                helperText="Model for werewolves"
              />
              {werewolfModel && (
                <div className="mt-2">
                  <Badge variant="danger">
                    {enabledModels.find(m => m.alias === werewolfModel)?.name || werewolfModel}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Optional Player Names */}
          <div className="mb-6">
            <Input
              label="Custom Player Names (optional)"
              placeholder="Enter comma-separated player names"
              value={customPlayerNames}
              onChange={(e) => setCustomPlayerNames(e.target.value)}
              helperText="Leave empty to use random names"
            />
          </div>

          {/* Game Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discussion Time (minutes)
              </label>
              <Select
                value={gameSettings.discussion_time_minutes.toString()}
                onChange={(value) => setGameSettings({
                  discussion_time_minutes: parseInt(value)
                })}
                options={[
                  { value: '3', label: '3 minutes' },
                  { value: '5', label: '5 minutes' },
                  { value: '10', label: '10 minutes' },
                  { value: '15', label: '15 minutes' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Rounds
              </label>
              <Select
                value={gameSettings.max_rounds.toString()}
                onChange={(value) => setGameSettings({
                  max_rounds: parseInt(value)
                })}
                options={[
                  { value: '5', label: '5 rounds' },
                  { value: '10', label: '10 rounds' },
                  { value: '15', label: '15 rounds' },
                  { value: '20', label: '20 rounds' },
                ]}
              />
            </div>
          </div>

          {/* Error Display */}
          {gameError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{gameError}</p>
            </div>
          )}

          {/* Start Game Button */}
          <div className="flex justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartGame}
              disabled={
                !villagerModel ||
                !werewolfModel ||
                gameLoading === 'loading'
              }
              loading={gameLoading === 'loading'}
            >
              {gameLoading === 'loading' ? 'Starting Game...' : 'Start Game'}
            </Button>
          </div>
        </Card>

        {/* Available Models */}
        {enabledModels.length > 0 && (
          <Card>
            <h3 className="text-xl font-semibold mb-4">Available Models ({enabledModels.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enabledModels.map(model => {
                const isVillagerSelected = villagerModel === model.alias;
                const isWerewolfSelected = werewolfModel === model.alias;

                return (
                  <div
                    key={model.alias}
                    className={`p-3 border rounded-md hover:shadow-sm transition-all cursor-pointer ${
                      model.enabled
                        ? 'border-gray-200 hover:border-primary-300'
                        : 'border-gray-100 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{model.name}</h4>
                      <div className="flex gap-1">
                        <Badge
                          variant={model.enabled ? "default" : "secondary"}
                          size="sm"
                        >
                          {model.provider}
                        </Badge>
                        {model.alias === 'glmz1-flash' && (
                          <Badge variant="success" size="sm">Default</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {model.description || `${model.provider} model`}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {isVillagerSelected && (
                        <Badge variant="secondary" size="sm">Villager</Badge>
                      )}
                      {isWerewolfSelected && (
                        <Badge variant="danger" size="sm">Werewolf</Badge>
                      )}
                    </div>
                    {model.context_length && (
                      <p className="text-xs text-gray-500 mt-2">
                        Context: {model.context_length.toLocaleString()} tokens
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Show disabled models if any */}
            {models && models.some(m => !m.enabled) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Disabled Models (require API keys)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {models.filter(m => !m.enabled).map(model => (
                    <div
                      key={model.alias}
                      className="p-2 border border-gray-100 rounded-md opacity-60"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{model.name}</span>
                        <Badge variant="secondary" size="sm">{model.provider}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
