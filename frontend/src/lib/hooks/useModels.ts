import { useState, useEffect, useCallback } from 'react';
import { modelsAPI } from '@/lib/api/models';
import { ModelInfo, ModelTestResponse } from '@/types/api';

export function useModels() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [testResults, setTestResults] = useState<Record<string, ModelTestResponse>>({});

  // Fetch all models
  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const fetchedModels = await modelsAPI.getModels();
      setModels(fetchedModels);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch models';
      setError(errorMessage);
      console.error('Error fetching models:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Test a model
  const testModel = useCallback(async (modelAlias: string, prompt?: string) => {
    setError(undefined);

    try {
      const result = await modelsAPI.testModel({
        model_alias: modelAlias,
        prompt: prompt || 'Hello! Please respond briefly to confirm you are working.'
      });

      setTestResults(prev => ({
        ...prev,
        [modelAlias]: result,
      }));

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Model test failed';
      setError(errorMessage);

      // Store failed result
      const failedResult: ModelTestResponse = {
        model_alias: modelAlias,
        response: '',
        latency_ms: 0,
        success: false,
        error: errorMessage,
      };

      setTestResults(prev => ({
        ...prev,
        [modelAlias]: failedResult,
      }));

      throw err;
    }
  }, []);

  // Test multiple models
  const batchTestModels = useCallback(async (modelAliases: string[], prompt?: string) => {
    setLoading(true);
    setError(undefined);

    try {
      const results = await modelsAPI.batchTestModels(modelAliases, prompt);

      const newTestResults: Record<string, ModelTestResponse> = {};
      results.forEach(result => {
        newTestResults[result.model_alias] = result;
      });

      setTestResults(prev => ({
        ...prev,
        ...newTestResults,
      }));

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch test failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get models by provider
  const getModelsByProvider = useCallback((provider: string) => {
    return models.filter(model => model.provider === provider);
  }, [models]);

  // Get models by role (suitable for villagers/werewolves)
  const getModelsByRole = useCallback((role: 'villager' | 'werewolf') => {
    // For now, just return all models. You can implement more sophisticated logic
    // based on model capabilities, cost, etc.
    return models;
  }, [models]);

  // Get recommended models
  const getRecommendedModels = useCallback(async () => {
    try {
      return await modelsAPI.getRecommendedModels();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get recommendations';
      setError(errorMessage);
      return { villagers: [], werewolves: [] };
    }
  }, []);

  // Check if model is available
  const isModelAvailable = useCallback((alias: string) => {
    return models.some(model => model.alias === alias);
  }, [models]);

  // Get model test result
  const getModelTestResult = useCallback((alias: string) => {
    return testResults[alias];
  }, [testResults]);

  // Clear test results
  const clearTestResults = useCallback(() => {
    setTestResults({});
  }, []);

  // Get available providers
  const getAvailableProviders = useCallback(async () => {
    try {
      return await modelsAPI.getAvailableProviders();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch providers';
      setError(errorMessage);
      return {};
    }
  }, []);

  // Auto-fetch models on mount
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return {
    // Data
    models,
    testResults,
    loading,
    error,

    // Actions
    fetchModels,
    testModel,
    batchTestModels,
    clearTestResults,

    // Computed values
    getModelsByProvider,
    getModelsByRole,
    getRecommendedModels,
    getAvailableProviders,
    isModelAvailable,
    getModelTestResult,

    // Status
    hasModels: models.length > 0,
    hasTestResults: Object.keys(testResults).length > 0,
  };
}