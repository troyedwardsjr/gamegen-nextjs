"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { Badge } from "@heroui/badge";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Spinner } from "@heroui/spinner";

import { useLLMProvider } from "@/lib/hooks/use-llm-provider";
import { ProviderConfiguration, ProviderConfig, ProviderHealthStatus } from "@/lib/llm/types";

export default function LLMProvidersPage() {
  const {
    providers,
    config,
    isLoading,
    error,
    refresh,
    updateProviderConfig,
    toggleProvider,
    getProviderMetrics,
    resetCircuitBreaker,
  } = useLLMProvider();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any | null>(
    null,
  );
  const [formData, setFormData] = useState<Partial<ProviderConfiguration>>({});
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  const handleAddProvider = () => {
    setEditingProvider(null);
    setFormData({
      id: "",
      name: "",
      type: "claude",
      config: {
        api_key: "",
        endpoint: "",
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        temperature: 0.7,
        timeout: 30000,
        retry_attempts: 3,
        health_check_interval: 60000,
        rate_limit: {
          requests_per_minute: 20,
          tokens_per_minute: 40000,
        },
      },
      priority: 1,
      enabled: true,
    });
    setIsModalOpen(true);
  };

  const handleEditProvider = (provider: any) => {
    setEditingProvider(provider);
    setFormData({
      id: provider.provider_id,
      name: provider.provider_id, // Use provider_id as name for now
      type: "claude", // Default type
      config: provider.metrics?.config || {},
      priority: 1,
      enabled: true,
    });
    setIsModalOpen(true);
  };

  const handleSaveProvider = async () => {
    try {
      if (editingProvider) {
        await updateProviderConfig(editingProvider.provider_id || editingProvider.id, formData);
      } else {
        // For now, just show an alert since we don't have an add provider API
        alert("Adding new providers is not implemented yet");
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving provider:", error);
    }
  };

  const handleTestProvider = async (providerId: string) => {
    try {
      // For now, just get metrics as a simple "test"
      const result = await getProviderMetrics(providerId);
      setTestResults((prev) => ({ ...prev, [providerId]: result }));
    } catch (error) {
      console.error("Error testing provider:", error);
      setTestResults((prev) => ({ ...prev, [providerId]: { error: "Test failed" } }));
    }
  };

  const getHealthBadge = (health?: string) => {
    if (!health) return <Badge color="default">Unknown</Badge>;

    const colors: Record<string, "success" | "warning" | "danger"> = {
      healthy: "success",
      degraded: "warning",
      unhealthy: "danger",
    };

    return (
      <Badge color={colors[health] || "default"}>
        {health.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
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
          <Card key={provider.provider_id} className="relative">
            <CardHeader className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-xl font-semibold">{provider.provider_id}</h3>
                  <p className="text-small text-default-500">
                    Provider - {provider.provider_id}
                  </p>
                </div>
                {getHealthBadge(provider.health_status)}
                {provider.health_status === "healthy" && (
                  <Badge color="primary" variant="flat">
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  isSelected={provider.health_status === "healthy"}
                  size="sm"
                  onValueChange={(value) =>
                    toggleProvider(provider.provider_id, value)
                  }
                />
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => handleTestProvider(provider.provider_id)}
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
                {provider.health_status !== "healthy" && (
                  <Button
                    color="primary"
                    size="sm"
                    variant="flat"
                    onPress={() => resetCircuitBreaker(provider.provider_id)}
                  >
                    Reset
                  </Button>
                )}
                <Button
                  color="danger"
                  size="sm"
                  variant="flat"
                  onPress={() => {
                    // For now, just show an alert since we don't have a remove provider API
                    alert("Removing providers is not implemented yet");
                  }}
                >
                  Remove
                </Button>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-small text-default-500">Status</p>
                  <p className="text-small font-mono">
                    {provider.health_status}
                  </p>
                </div>
                <div>
                  <p className="text-small text-default-500">Circuit Breaker</p>
                  <p className="text-small">{provider.circuit_breaker_state}</p>
                </div>
                <div>
                  <p className="text-small text-default-500">Last Check</p>
                  <p className="text-small">{new Date(provider.last_health_check).toLocaleTimeString()}</p>
                </div>
                <div>
                  <p className="text-small text-default-500">Provider ID</p>
                  <p className="text-small">{provider.provider_id}</p>
                </div>
              </div>

              {provider.metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-small text-default-500">Response Time</p>
                    <p className="text-small">
                      {provider.metrics.average_response_time}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Success Rate</p>
                    <p className="text-small">
                      {provider.metrics.successful_requests > 0 ? 
                        ((provider.metrics.successful_requests / provider.metrics.total_requests) * 100).toFixed(2) : 0
                      }%
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">
                      Total Requests
                    </p>
                    <p className="text-small">
                      {provider.metrics.total_requests}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Last Used</p>
                    <p className="text-small">
                      {new Date(provider.metrics.last_used).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )}

              {testResults[provider.provider_id] && (
                <div className="mt-4 p-4 bg-default-50 rounded-lg">
                  <p className="text-small font-semibold mb-2">Test Results:</p>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(testResults[provider.provider_id], null, 2)}
                  </pre>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        size="2xl"
        onClose={() => setIsModalOpen(false)}
      >
        <ModalContent>
          <ModalHeader>
            {editingProvider ? "Edit Provider" : "Add New Provider"}
          </ModalHeader>
          <ModalBody className="space-y-4">
            <Input
              isDisabled={!!editingProvider}
              label="Provider ID"
              value={formData.id || ""}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            />
            <Input
              label="Provider Name"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="API Key"
                type="password"
                value={formData.config?.api_key || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config!, api_key: e.target.value },
                  })
                }
              />
              <Input
                label="Endpoint"
                value={formData.config?.endpoint || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config!, endpoint: e.target.value },
                  })
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Model"
                value={formData.config?.model || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config!, model: e.target.value },
                  })
                }
              />
              <Input
                label="Max Tokens"
                type="number"
                value={formData.config?.max_tokens?.toString() || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: {
                      ...formData.config!,
                      max_tokens: parseInt(e.target.value),
                    },
                  })
                }
              />
              <Input
                label="Temperature"
                step="0.1"
                type="number"
                value={formData.config?.temperature?.toString() || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: {
                      ...formData.config!,
                      temperature: parseFloat(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Requests per Minute"
                type="number"
                value={
                  formData.config?.rate_limit?.requests_per_minute?.toString() ||
                  ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: {
                      ...formData.config!,
                      rate_limit: {
                        ...formData.config!.rate_limit!,
                        requests_per_minute: parseInt(e.target.value),
                      },
                    },
                  })
                }
              />
              <Input
                label="Tokens per Minute"
                type="number"
                value={
                  formData.config?.rate_limit?.tokens_per_minute?.toString() ||
                  ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: {
                      ...formData.config!,
                      rate_limit: {
                        ...formData.config!.rate_limit!,
                        tokens_per_minute: parseInt(e.target.value),
                      },
                    },
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Priority"
                type="number"
                value={formData.priority?.toString() || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: parseInt(e.target.value),
                  })
                }
              />
              <div className="flex items-center gap-2">
                <Switch
                  isSelected={formData.enabled}
                  onValueChange={(value) =>
                    setFormData({ ...formData, enabled: value })
                  }
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
              {editingProvider ? "Update" : "Add"} Provider
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
