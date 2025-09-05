'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Switch } from '@heroui/switch';
import { Badge } from '@heroui/badge';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Spinner } from '@heroui/spinner';
import { useLLMProvider } from '@/lib/hooks/use-llm-provider';
import { ProviderConfig, ProviderHealthStatus } from '@/lib/llm/types';

export default function LLMProvidersPage() {
  const {
    providers,
    activeProvider,
    addProvider,
    updateProvider,
    removeProvider,
    setActiveProvider,
    testProvider,
    getProviderHealth,
    getProviderMetrics,
    loading,
    error
  } = useLLMProvider();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(null);
  const [formData, setFormData] = useState<Partial<ProviderConfig>>({});
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [healthStatuses, setHealthStatuses] = useState<Record<string, ProviderHealthStatus>>({});

  useEffect(() => {
    // Fetch health status for all providers
    providers.forEach(async (provider) => {
      const health = await getProviderHealth(provider.id);
      setHealthStatuses(prev => ({ ...prev, [provider.id]: health }));
    });
  }, [providers, getProviderHealth]);

  const handleAddProvider = () => {
    setEditingProvider(null);
    setFormData({
      id: '',
      name: '',
      type: 'claude',
      config: {
        api_key: '',
        endpoint: '',
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.7,
        timeout: 30000,
        retry: {
          retries: 3,
          minTimeout: 1000,
          maxTimeout: 10000,
          factor: 2
        },
        rate_limit: {
          requests_per_minute: 20,
          tokens_per_minute: 40000
        }
      },
      priority: 1,
      enabled: true
    });
    setIsModalOpen(true);
  };

  const handleEditProvider = (provider: ProviderConfig) => {
    setEditingProvider(provider);
    setFormData(provider);
    setIsModalOpen(true);
  };

  const handleSaveProvider = async () => {
    if (editingProvider) {
      await updateProvider(editingProvider.id, formData as ProviderConfig);
    } else {
      await addProvider(formData as ProviderConfig);
    }
    setIsModalOpen(false);
  };

  const handleTestProvider = async (providerId: string) => {
    const result = await testProvider(providerId);
    setTestResults(prev => ({ ...prev, [providerId]: result }));
  };

  const getHealthBadge = (health?: ProviderHealthStatus) => {
    if (!health) return <Badge color="default">Unknown</Badge>;
    
    const colors: Record<string, 'success' | 'warning' | 'danger'> = {
      healthy: 'success',
      degraded: 'warning',
      unhealthy: 'danger'
    };

    return (
      <Badge color={colors[health.status] || 'default'}>
        {health.status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">LLM Provider Management</h1>
        <Button color="primary" onPress={handleAddProvider}>
          Add Provider
        </Button>
      </div>

      {error && (
        <Card className="bg-danger-50 border-danger-200">
          <CardBody>
            <p className="text-danger">{error}</p>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-6">
        {providers.map((provider) => (
          <Card key={provider.id} className="relative">
            <CardHeader className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-xl font-semibold">{provider.name}</h3>
                  <p className="text-small text-default-500">
                    {provider.type} - {provider.config.model}
                  </p>
                </div>
                {getHealthBadge(healthStatuses[provider.id])}
                {activeProvider?.id === provider.id && (
                  <Badge color="primary" variant="flat">Active</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  isSelected={provider.enabled}
                  onValueChange={(value) => 
                    updateProvider(provider.id, { ...provider, enabled: value })
                  }
                  size="sm"
                />
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => handleTestProvider(provider.id)}
                >
                  Test
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => handleEditProvider(provider)}
                >
                  Edit
                </Button>
                {activeProvider?.id !== provider.id && (
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    onPress={() => setActiveProvider(provider.id)}
                  >
                    Set Active
                  </Button>
                )}
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  onPress={() => removeProvider(provider.id)}
                >
                  Remove
                </Button>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-small text-default-500">Endpoint</p>
                  <p className="text-small font-mono">{provider.config.endpoint}</p>
                </div>
                <div>
                  <p className="text-small text-default-500">Max Tokens</p>
                  <p className="text-small">{provider.config.max_tokens}</p>
                </div>
                <div>
                  <p className="text-small text-default-500">Temperature</p>
                  <p className="text-small">{provider.config.temperature}</p>
                </div>
                <div>
                  <p className="text-small text-default-500">Priority</p>
                  <p className="text-small">{provider.priority}</p>
                </div>
              </div>

              {healthStatuses[provider.id] && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-small text-default-500">Response Time</p>
                    <p className="text-small">{healthStatuses[provider.id].response_time}ms</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Success Rate</p>
                    <p className="text-small">{(healthStatuses[provider.id].success_rate * 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Total Requests</p>
                    <p className="text-small">{healthStatuses[provider.id].total_requests}</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Last Check</p>
                    <p className="text-small">
                      {new Date(healthStatuses[provider.id].last_check).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )}

              {testResults[provider.id] && (
                <div className="mt-4 p-4 bg-default-50 rounded-lg">
                  <p className="text-small font-semibold mb-2">Test Results:</p>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(testResults[provider.id], null, 2)}
                  </pre>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader>
            {editingProvider ? 'Edit Provider' : 'Add New Provider'}
          </ModalHeader>
          <ModalBody className="space-y-4">
            <Input
              label="Provider ID"
              value={formData.id || ''}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              isDisabled={!!editingProvider}
            />
            <Input
              label="Provider Name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="API Key"
                type="password"
                value={formData.config?.api_key || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config!, api_key: e.target.value }
                })}
              />
              <Input
                label="Endpoint"
                value={formData.config?.endpoint || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config!, endpoint: e.target.value }
                })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Model"
                value={formData.config?.model || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config!, model: e.target.value }
                })}
              />
              <Input
                label="Max Tokens"
                type="number"
                value={formData.config?.max_tokens?.toString() || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config!, max_tokens: parseInt(e.target.value) }
                })}
              />
              <Input
                label="Temperature"
                type="number"
                step="0.1"
                value={formData.config?.temperature?.toString() || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config!, temperature: parseFloat(e.target.value) }
                })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Requests per Minute"
                type="number"
                value={formData.config?.rate_limit?.requests_per_minute?.toString() || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: {
                    ...formData.config!,
                    rate_limit: {
                      ...formData.config!.rate_limit!,
                      requests_per_minute: parseInt(e.target.value)
                    }
                  }
                })}
              />
              <Input
                label="Tokens per Minute"
                type="number"
                value={formData.config?.rate_limit?.tokens_per_minute?.toString() || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: {
                    ...formData.config!,
                    rate_limit: {
                      ...formData.config!.rate_limit!,
                      tokens_per_minute: parseInt(e.target.value)
                    }
                  }
                })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Priority"
                type="number"
                value={formData.priority?.toString() || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  priority: parseInt(e.target.value)
                })}
              />
              <div className="flex items-center gap-2">
                <Switch
                  isSelected={formData.enabled}
                  onValueChange={(value) => setFormData({ ...formData, enabled: value })}
                />
                <span>Enabled</span>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSaveProvider}>
              {editingProvider ? 'Update' : 'Add'} Provider
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}