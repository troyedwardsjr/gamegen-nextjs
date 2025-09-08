/**
 * LLM Provider Configuration Management
 *
 * Centralized configuration management for LLM providers with
 * hot-swappable configs, environment variable support, and validation.
 */

import { ProviderConfiguration } from "./types";

export interface LLMSystemConfig {
  default_provider: string;
  fallback_chain: string[];
  max_concurrent_requests: number;
  health_check_interval: number;
  failover_enabled: boolean;
  providers: Record<string, ProviderConfiguration>;
}

export class LLMConfigManager {
  private config: LLMSystemConfig;
  private configWatchers: ((config: LLMSystemConfig) => void)[] = [];
  private initialized: boolean = false;

  constructor(initialConfig?: Partial<LLMSystemConfig>) {
    this.config = this.mergeWithDefaults(initialConfig || {});
    this.initialized = true;
  }

  /**
   * Initialize configuration from environment variables
   */
  static fromEnvironment(): LLMConfigManager {
    const config: Partial<LLMSystemConfig> = {
      default_provider: process.env.LLM_DEFAULT_PROVIDER || "claude",
      fallback_chain: process.env.LLM_FALLBACK_CHAIN?.split(",") || ["claude"],
      max_concurrent_requests: parseInt(
        process.env.LLM_MAX_CONCURRENT_REQUESTS || "10",
      ),
      health_check_interval: parseInt(
        process.env.LLM_HEALTH_CHECK_INTERVAL || "30000",
      ),
      failover_enabled: process.env.LLM_FAILOVER_ENABLED !== "false",
      providers: {},
    };

    // Load Claude configuration
    const claudeApiKey = process.env.ANTHROPIC_API_KEY;

    if (claudeApiKey) {
      config.providers!.claude = {
        id: "claude",
        name: "Anthropic Claude",
        type: "claude",
        enabled: true,
        priority: 1,
        config: {
          api_key: claudeApiKey,
          endpoint:
            process.env.ANTHROPIC_ENDPOINT || "https://api.anthropic.com",
          model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
          max_tokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || "4000"),
          temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || "0.7"),
          rate_limit: {
            requests_per_minute: parseInt(
              process.env.ANTHROPIC_REQUESTS_PER_MINUTE || "100",
            ),
            tokens_per_minute: parseInt(
              process.env.ANTHROPIC_TOKENS_PER_MINUTE || "100000",
            ),
          },
          health_check_interval: parseInt(
            process.env.ANTHROPIC_HEALTH_CHECK_INTERVAL || "60000",
          ),
          timeout: parseInt(process.env.ANTHROPIC_TIMEOUT || "30000"),
          retry_attempts: parseInt(process.env.ANTHROPIC_RETRY_ATTEMPTS || "3"),
          fallback_provider: process.env.ANTHROPIC_FALLBACK_PROVIDER,
        },
        circuit_breaker: {
          failure_threshold: parseInt(
            process.env.ANTHROPIC_FAILURE_THRESHOLD || "5",
          ),
          reset_timeout: parseInt(
            process.env.ANTHROPIC_RESET_TIMEOUT || "60000",
          ),
          monitor_window: parseInt(
            process.env.ANTHROPIC_MONITOR_WINDOW || "300000",
          ),
          half_open_max_calls: parseInt(
            process.env.ANTHROPIC_HALF_OPEN_MAX_CALLS || "3",
          ),
        },
        rate_limit: {
          requests_per_minute: parseInt(
            process.env.ANTHROPIC_REQUESTS_PER_MINUTE || "100",
          ),
          tokens_per_minute: parseInt(
            process.env.ANTHROPIC_TOKENS_PER_MINUTE || "100000",
          ),
          burst_limit: parseInt(process.env.ANTHROPIC_BURST_LIMIT || "150"),
          user_tier_multiplier: {
            free: 0.5,
            pro: 1.0,
            enterprise: 2.0,
          },
        },
        created_at: new Date(),
        updated_at: new Date(),
      };
    }

    return new LLMConfigManager(config);
  }

  /**
   * Get current system configuration
   */
  getConfig(): LLMSystemConfig {
    return JSON.parse(JSON.stringify(this.config)); // Deep clone
  }

  /**
   * Get provider configuration by ID
   */
  getProviderConfig(providerId: string): ProviderConfiguration | undefined {
    return this.config.providers[providerId];
  }

  /**
   * Get all enabled provider configurations
   */
  getEnabledProviders(): ProviderConfiguration[] {
    return Object.values(this.config.providers).filter((p) => p.enabled);
  }

  /**
   * Update system configuration
   */
  updateConfig(updates: Partial<LLMSystemConfig>): void {
    const oldConfig = this.config;

    this.config = { ...this.config, ...updates };

    // Validate the new configuration
    this.validateConfig();

    // Notify watchers of config change
    this.notifyConfigWatchers();

    console.info("[LLMConfig] System configuration updated", {
      changes: this.getConfigDiff(oldConfig, this.config),
    });
  }

  /**
   * Update provider configuration
   */
  updateProviderConfig(
    providerId: string,
    updates: Partial<ProviderConfiguration>,
  ): void {
    const existingProvider = this.config.providers[providerId];

    if (!existingProvider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const updatedProvider = {
      ...existingProvider,
      ...updates,
      updated_at: new Date(),
    };

    // Validate provider configuration
    this.validateProviderConfig(updatedProvider);

    this.config.providers[providerId] = updatedProvider;

    // Notify watchers
    this.notifyConfigWatchers();

    console.info("[LLMConfig] Provider configuration updated", {
      providerId,
      changes: updates,
    });
  }

  /**
   * Add new provider configuration
   */
  addProvider(
    config: Omit<ProviderConfiguration, "created_at" | "updated_at">,
  ): void {
    const providerConfig: ProviderConfiguration = {
      ...config,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Validate provider configuration
    this.validateProviderConfig(providerConfig);

    this.config.providers[config.id] = providerConfig;

    // Notify watchers
    this.notifyConfigWatchers();

    console.info("[LLMConfig] Provider added", { providerId: config.id });
  }

  /**
   * Remove provider configuration
   */
  removeProvider(providerId: string): void {
    if (!this.config.providers[providerId]) {
      throw new Error(`Provider ${providerId} not found`);
    }

    // Check if provider is used in fallback chain
    if (this.config.fallback_chain.includes(providerId)) {
      throw new Error(
        `Cannot remove provider ${providerId}: it's in the fallback chain`,
      );
    }

    // Check if it's the default provider
    if (this.config.default_provider === providerId) {
      throw new Error(
        `Cannot remove provider ${providerId}: it's the default provider`,
      );
    }

    delete this.config.providers[providerId];

    // Notify watchers
    this.notifyConfigWatchers();

    console.info("[LLMConfig] Provider removed", { providerId });
  }

  /**
   * Enable or disable a provider
   */
  setProviderEnabled(providerId: string, enabled: boolean): void {
    const provider = this.config.providers[providerId];

    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    provider.enabled = enabled;
    provider.updated_at = new Date();

    // Notify watchers
    this.notifyConfigWatchers();

    console.info("[LLMConfig] Provider enabled status changed", {
      providerId,
      enabled,
    });
  }

  /**
   * Watch for configuration changes
   */
  watchConfig(callback: (config: LLMSystemConfig) => void): () => void {
    this.configWatchers.push(callback);

    // Return unwatch function
    return () => {
      const index = this.configWatchers.indexOf(callback);

      if (index > -1) {
        this.configWatchers.splice(index, 1);
      }
    };
  }

  /**
   * Export configuration for backup
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from backup
   */
  importConfig(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson) as LLMSystemConfig;

      // Validate imported configuration
      this.validateImportedConfig(importedConfig);

      this.config = importedConfig;

      // Notify watchers
      this.notifyConfigWatchers();

      console.info("[LLMConfig] Configuration imported successfully");
    } catch (error) {
      throw new Error(
        `Failed to import configuration: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Get configuration summary for monitoring
   */
  getConfigSummary(): {
    total_providers: number;
    enabled_providers: number;
    default_provider: string;
    fallback_chain_length: number;
    last_updated: Date;
  } {
    const enabledProviders = this.getEnabledProviders();
    const lastUpdated = Math.max(
      ...Object.values(this.config.providers).map((p) =>
        p.updated_at.getTime(),
      ),
    );

    return {
      total_providers: Object.keys(this.config.providers).length,
      enabled_providers: enabledProviders.length,
      default_provider: this.config.default_provider,
      fallback_chain_length: this.config.fallback_chain.length,
      last_updated: new Date(lastUpdated),
    };
  }

  /**
   * Merge with default configuration
   */
  private mergeWithDefaults(config: Partial<LLMSystemConfig>): LLMSystemConfig {
    const defaults: LLMSystemConfig = {
      default_provider: "claude",
      fallback_chain: ["claude"],
      max_concurrent_requests: 10,
      health_check_interval: 30000,
      failover_enabled: true,
      providers: {},
    };

    return { ...defaults, ...config };
  }

  /**
   * Validate system configuration
   */
  private validateConfig(): void {
    // Check if default provider exists and is enabled
    const defaultProvider = this.config.providers[this.config.default_provider];

    if (!defaultProvider) {
      throw new Error(
        `Default provider '${this.config.default_provider}' not found`,
      );
    }

    if (!defaultProvider.enabled) {
      throw new Error(
        `Default provider '${this.config.default_provider}' is disabled`,
      );
    }

    // Check fallback chain
    for (const providerId of this.config.fallback_chain) {
      const provider = this.config.providers[providerId];

      if (!provider) {
        throw new Error(`Fallback provider '${providerId}' not found`);
      }

      if (!provider.enabled) {
        console.warn(
          `[LLMConfig] Fallback provider '${providerId}' is disabled`,
        );
      }
    }

    // Validate numeric constraints
    if (this.config.max_concurrent_requests <= 0) {
      throw new Error("max_concurrent_requests must be greater than 0");
    }

    if (this.config.health_check_interval < 1000) {
      throw new Error("health_check_interval must be at least 1000ms");
    }
  }

  /**
   * Validate provider configuration
   */
  private validateProviderConfig(config: ProviderConfiguration): void {
    // Required fields
    if (!config.id || !config.name || !config.type) {
      throw new Error("Provider must have id, name, and type");
    }

    // Validate provider config
    if (!config.config.api_key) {
      throw new Error("Provider must have api_key");
    }

    if (!config.config.endpoint) {
      throw new Error("Provider must have endpoint");
    }

    if (!config.config.model) {
      throw new Error("Provider must have model");
    }

    // Validate numeric values
    if (config.config.max_tokens <= 0) {
      throw new Error("max_tokens must be greater than 0");
    }

    if (config.config.temperature < 0 || config.config.temperature > 2) {
      throw new Error("temperature must be between 0 and 2");
    }

    if (config.config.timeout <= 0) {
      throw new Error("timeout must be greater than 0");
    }

    // Validate rate limits
    if (config.rate_limit.requests_per_minute <= 0) {
      throw new Error("requests_per_minute must be greater than 0");
    }

    if (config.rate_limit.tokens_per_minute <= 0) {
      throw new Error("tokens_per_minute must be greater than 0");
    }

    // Validate circuit breaker config
    if (config.circuit_breaker.failure_threshold <= 0) {
      throw new Error("failure_threshold must be greater than 0");
    }

    if (config.circuit_breaker.reset_timeout <= 0) {
      throw new Error("reset_timeout must be greater than 0");
    }
  }

  /**
   * Validate imported configuration
   */
  private validateImportedConfig(config: any): void {
    if (!config || typeof config !== "object") {
      throw new Error("Configuration must be an object");
    }

    // Check required top-level fields
    const requiredFields = ["default_provider", "fallback_chain", "providers"];

    for (const field of requiredFields) {
      if (!(field in config)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate providers
    if (!config.providers || typeof config.providers !== "object") {
      throw new Error("providers must be an object");
    }

    for (const [providerId, providerConfig] of Object.entries(
      config.providers,
    )) {
      try {
        this.validateProviderConfig(providerConfig as ProviderConfiguration);
      } catch (error) {
        throw new Error(
          `Invalid provider config for '${providerId}': ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      }
    }
  }

  /**
   * Notify configuration watchers
   */
  private notifyConfigWatchers(): void {
    if (!this.initialized) return;

    for (const watcher of this.configWatchers) {
      try {
        watcher(this.getConfig());
      } catch (error) {
        console.error("[LLMConfig] Error notifying config watcher:", error);
      }
    }
  }

  /**
   * Get configuration differences for logging
   */
  private getConfigDiff(
    oldConfig: LLMSystemConfig,
    newConfig: LLMSystemConfig,
  ): Record<string, any> {
    const diff: Record<string, any> = {};

    // Check top-level changes
    const topLevelFields = [
      "default_provider",
      "fallback_chain",
      "max_concurrent_requests",
      "health_check_interval",
      "failover_enabled",
    ];

    for (const field of topLevelFields) {
      if (
        JSON.stringify(oldConfig[field as keyof LLMSystemConfig]) !==
        JSON.stringify(newConfig[field as keyof LLMSystemConfig])
      ) {
        diff[field] = {
          old: oldConfig[field as keyof LLMSystemConfig],
          new: newConfig[field as keyof LLMSystemConfig],
        };
      }
    }

    // Check provider changes
    const oldProviderIds = new Set(Object.keys(oldConfig.providers));
    const newProviderIds = new Set(Object.keys(newConfig.providers));

    // Added providers
    const addedProviders = Array.from(newProviderIds).filter(
      (id) => !oldProviderIds.has(id),
    );

    if (addedProviders.length > 0) {
      diff.added_providers = addedProviders;
    }

    // Removed providers
    const removedProviders = Array.from(oldProviderIds).filter(
      (id) => !newProviderIds.has(id),
    );

    if (removedProviders.length > 0) {
      diff.removed_providers = removedProviders;
    }

    // Modified providers
    const modifiedProviders: string[] = [];

    Array.from(newProviderIds).forEach((providerId) => {
      if (oldProviderIds.has(providerId)) {
        const oldProvider = oldConfig.providers[providerId];
        const newProvider = newConfig.providers[providerId];

        if (JSON.stringify(oldProvider) !== JSON.stringify(newProvider)) {
          modifiedProviders.push(providerId);
        }
      }
    });

    if (modifiedProviders.length > 0) {
      diff.modified_providers = modifiedProviders;
    }

    return diff;
  }
}
