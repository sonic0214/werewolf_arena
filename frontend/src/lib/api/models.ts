import { apiClient } from './client';
import {
  ModelInfo,
  ModelTestRequest,
  ModelTestResponse,
  AvailableProviders,
  API_ENDPOINTS,
} from '@/types/api';

export const modelsAPI = {
  // Get all available models
  async getModels(): Promise<ModelInfo[]> {
    const response = await apiClient.get<{ models: ModelInfo[], total: number }>(API_ENDPOINTS.MODELS);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch models');
    }

    return response.data.models;
  },

  // Get specific model information
  async getModelInfo(alias: string): Promise<ModelInfo> {
    const response = await apiClient.get<ModelInfo>(API_ENDPOINTS.MODEL_INFO(alias));

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch model info');
    }

    return response.data;
  },

  // Test a model with a prompt
  async testModel(request: ModelTestRequest): Promise<ModelTestResponse> {
    const response = await apiClient.post<ModelTestResponse>(API_ENDPOINTS.MODEL_TEST, request);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to test model');
    }

    return response.data;
  },

  // Get available providers
  async getAvailableProviders(): Promise<AvailableProviders> {
    const response = await apiClient.get<AvailableProviders>(API_ENDPOINTS.MODEL_PROVIDERS);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch providers');
    }

    return response.data;
  },

  // Get models by provider
  async getModelsByProvider(provider: string): Promise<ModelInfo[]> {
    const allModels = await this.getModels();
    return allModels.filter(model => model.provider === provider);
  },

  // Get models by role (villager/werewolf suitable)
  async getModelsByRole(role: 'villager' | 'werewolf'): Promise<ModelInfo[]> {
    const allModels = await this.getModels();

    // You might want to implement different logic here based on model capabilities
    // For now, return all models
    return allModels;
  },

  // Check if model is available
  async isModelAvailable(alias: string): Promise<boolean> {
    try {
      await this.getModelInfo(alias);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Get recommended models for each role
  async getRecommendedModels(): Promise<{
    villagers: ModelInfo[];
    werewolves: ModelInfo[];
  }> {
    const allModels = await this.getModels();

    // For now, return a basic split. You can make this more sophisticated
    // based on model capabilities, cost, performance, etc.
    const midPoint = Math.floor(allModels.length / 2);

    return {
      villagers: allModels.slice(0, midPoint),
      werewolves: allModels.slice(midPoint),
    };
  },

  // Batch test multiple models
  async batchTestModels(modelAliases: string[], prompt?: string): Promise<ModelTestResponse[]> {
    const testPromises = modelAliases.map(alias =>
      this.testModel({ model_alias: alias, prompt })
    );

    try {
      const results = await Promise.allSettled(testPromises);

      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            model_alias: modelAliases[index],
            response: '',
            latency_ms: 0,
            success: false,
            error: result.reason?.message || 'Test failed',
          };
        }
      });
    } catch (error) {
      throw new Error('Batch testing failed');
    }
  },
};