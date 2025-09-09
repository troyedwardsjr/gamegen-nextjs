"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Chip } from '@heroui/chip';
import { Badge } from '@heroui/badge';
import { Spinner } from '@heroui/spinner';
import { Tooltip } from '@heroui/tooltip';
import { Progress } from '@heroui/progress';
import { Tabs, Tab } from '@heroui/tabs';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import Link from 'next/link';

import {
  CreditCardIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  EyeIcon,
  ShareIcon,
  PlusIcon,
} from '@/components/icons';

interface BillingStats {
  currentBalance: number;
  creditsUsed: number;
  creditsRemaining: number;
  creditsAllowance: number;
  monthlySpend: number;
  projectedSpend: number;
  nextBillingDate: string;
  subscriptionStatus: 'active' | 'paused' | 'cancelled' | 'past_due';
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'failed';
  description: string;
  downloadUrl?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

interface UsageRecord {
  id: string;
  date: string;
  service: string;
  description: string;
  credits: number;
  cost: number;
  projectName?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  status: 'active' | 'expired' | 'declined';
}

interface BillingDashboardProps {
  className?: string;
}

export default function BillingDashboard({ className = '' }: BillingDashboardProps) {
  // State management
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState<string | null>(null);
  
  // Data
  const [billingStats, setBillingStats] = useState<BillingStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  // Filters
  const [dateRange, setDateRange] = useState('30d');
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  
  // Modals
  const { isOpen: isPaymentModalOpen, onOpen: onPaymentModalOpen, onClose: onPaymentModalClose } = useDisclosure();
  const { isOpen: isInvoiceModalOpen, onOpen: onInvoiceModalOpen, onClose: onInvoiceModalClose } = useDisclosure();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Mock data loading
  useEffect(() => {
    loadBillingData();
  }, [dateRange]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock billing stats
      setBillingStats({
        currentBalance: 847.50,
        creditsUsed: 3250,
        creditsRemaining: 750,
        creditsAllowance: 4000,
        monthlySpend: 185.20,
        projectedSpend: 223.50,
        nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        subscriptionStatus: 'active',
      });

      // Mock invoices
      setInvoices([
        {
          id: '1',
          number: 'INV-2025-001',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 185.20,
          status: 'paid',
          description: 'January 2025 Usage',
          items: [
            { description: 'AI Credits - 2500 units', quantity: 2500, unitPrice: 0.05, total: 125.00 },
            { description: 'Storage - 10GB', quantity: 10, unitPrice: 2.50, total: 25.00 },
            { description: 'Collaboration Sessions - 15 hours', quantity: 15, unitPrice: 2.35, total: 35.20 },
          ],
        },
        {
          id: '2',
          number: 'INV-2024-052',
          date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 167.80,
          status: 'paid',
          description: 'December 2024 Usage',
          items: [
            { description: 'AI Credits - 2200 units', quantity: 2200, unitPrice: 0.05, total: 110.00 },
            { description: 'Storage - 8GB', quantity: 8, unitPrice: 2.50, total: 20.00 },
            { description: 'Collaboration Sessions - 16 hours', quantity: 16, unitPrice: 2.35, total: 37.80 },
          ],
        },
      ]);

      // Mock usage records
      setUsageRecords([
        {
          id: '1',
          date: new Date().toISOString(),
          service: 'AI Generation',
          description: 'Character sprite generation',
          credits: 50,
          cost: 2.50,
          projectName: 'Space Shooter Deluxe',
        },
        {
          id: '2',
          date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          service: 'Code Compilation',
          description: 'Game build and optimization',
          credits: 25,
          cost: 1.25,
          projectName: 'Pixel Adventure Quest',
        },
      ]);

      // Mock payment methods
      setPaymentMethods([
        {
          id: '1',
          type: 'card',
          last4: '4242',
          brand: 'Visa',
          expiryMonth: 12,
          expiryYear: 2027,
          isDefault: true,
          status: 'active',
        },
        {
          id: '2',
          type: 'card',
          last4: '5555',
          brand: 'Mastercard',
          expiryMonth: 8,
          expiryYear: 2026,
          isDefault: false,
          status: 'active',
        },
      ]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
      console.error('Billing data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      if (invoiceFilter === 'all') return true;
      return invoice.status === invoiceFilter;
    });
  }, [invoices, invoiceFilter]);

  const usageByService = useMemo(() => {
    const serviceMap: Record<string, { credits: number; cost: number }> = {};
    
    usageRecords.forEach(record => {
      if (!serviceMap[record.service]) {
        serviceMap[record.service] = { credits: 0, cost: 0 };
      }
      serviceMap[record.service].credits += record.credits;
      serviceMap[record.service].cost += record.cost;
    });

    return Object.entries(serviceMap).map(([service, data]) => ({
      service,
      ...data,
    })).sort((a, b) => b.cost - a.cost);
  }, [usageRecords]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'danger';
      case 'failed': return 'danger';
      case 'active': return 'success';
      default: return 'default';
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    onInvoiceModalOpen();
  };

  return (
    <>
      {/* Invoice Detail Modal */}
      <Modal isOpen={isInvoiceModalOpen} onClose={onInvoiceModalClose} size="3xl">
        <ModalContent>
          <ModalHeader>
            Invoice {selectedInvoice?.number}
          </ModalHeader>
          <ModalBody>
            {selectedInvoice && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Invoice Date</p>
                    <p className="text-white font-semibold">{formatDate(selectedInvoice.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Due Date</p>
                    <p className="text-white font-semibold">{formatDate(selectedInvoice.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <Chip color={getStatusColor(selectedInvoice.status) as any} variant="flat">
                      {selectedInvoice.status}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Amount</p>
                    <p className="text-white font-bold text-xl">{formatCurrency(selectedInvoice.amount)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-3">Invoice Items</h4>
                  <div className="space-y-2">
                    {selectedInvoice.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-white font-medium">{item.description}</p>
                          <p className="text-gray-400 text-sm">
                            {item.quantity} × {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <p className="text-white font-semibold">{formatCurrency(item.total)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onClick={onInvoiceModalClose}>
              Close
            </Button>
            <Button color="primary" startContent={<ArrowDownIcon className="w-4 h-4" />}>
              Download PDF
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Billing & Usage</h2>
            <p className="text-gray-400">
              Monitor your usage, manage your subscription, and view invoices
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select
              placeholder="Time Range"
              className="w-32"
              selectedKeys={[dateRange]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setDateRange(selected);
              }}
            >
              <SelectItem key="7d">7 days</SelectItem>
              <SelectItem key="30d">30 days</SelectItem>
              <SelectItem key="90d">90 days</SelectItem>
              <SelectItem key="1y">1 year</SelectItem>
            </Select>
            <Button
              color="primary"
              startContent={<PlusIcon className="w-4 h-4" />}
              onClick={onPaymentModalOpen}
            >
              Add Payment Method
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-400 font-medium">Error loading billing data</p>
            <p className="text-red-300 text-sm">{error}</p>
            <Button
              size="sm"
              variant="bordered"
              className="mt-2 border-red-500/50 text-red-400"
              onClick={() => loadBillingData()}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Billing Overview Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardBody className="p-6">
                  <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-700 rounded w-3/4"></div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : billingStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/20">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-green-400">Current Balance</div>
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <BanknotesIcon className="w-5 h-5 text-green-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(billingStats.currentBalance)}
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/20">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-blue-400">Credits Used</div>
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <ChartBarIcon className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-2">
                  {billingStats.creditsUsed.toLocaleString()}
                </div>
                <Progress
                  value={(billingStats.creditsUsed / billingStats.creditsAllowance) * 100}
                  color="primary"
                  size="sm"
                  classNames={{
                    indicator: "bg-blue-500",
                  }}
                />
                <div className="text-xs text-gray-400 mt-1">
                  {billingStats.creditsRemaining.toLocaleString()} remaining
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/20">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-purple-400">Monthly Spend</div>
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <CreditCardIcon className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(billingStats.monthlySpend)}
                </div>
                <div className="text-xs text-gray-400 flex items-center mt-1">
                  <ArrowUpIcon className="w-3 h-3 mr-1" />
                  Projected: {formatCurrency(billingStats.projectedSpend)}
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-500/20">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-yellow-400">Next Billing</div>
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <CalendarDaysIcon className="w-5 h-5 text-yellow-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatDate(billingStats.nextBillingDate)}
                </div>
                <Chip
                  size="sm"
                  color={getStatusColor(billingStats.subscriptionStatus) as any}
                  variant="flat"
                >
                  {billingStats.subscriptionStatus}
                </Chip>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Navigation Tabs */}
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={setActiveTab as any}
          variant="bordered"
          color="primary"
          classNames={{
            tabList: "bg-gray-900/50 backdrop-blur-xl border-purple-500/20",
            tab: "text-gray-400 hover:text-white",
            cursor: "bg-purple-500",
          }}
        >
          <Tab 
            key="overview" 
            title={
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="w-4 h-4" />
                <span>Usage</span>
              </div>
            }
          />
          <Tab 
            key="invoices" 
            title={
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="w-4 h-4" />
                <span>Invoices</span>
              </div>
            }
          />
          <Tab 
            key="payment" 
            title={
              <div className="flex items-center space-x-2">
                <CreditCardIcon className="w-4 h-4" />
                <span>Payment Methods</span>
              </div>
            }
          />
        </Tabs>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Usage by Service */}
                <Card className="bg-gradient-to-r from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-white">Usage by Service</h3>
                  </CardHeader>
                  <CardBody className="p-6 pt-0">
                    <div className="space-y-4">
                      {loading ? (
                        Array(3).fill(0).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
                            <div className="h-2 bg-gray-700 rounded"></div>
                          </div>
                        ))
                      ) : (
                        usageByService.map((service, index) => (
                          <div key={service.service} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-white font-medium">{service.service}</span>
                                <span className="text-gray-400 text-sm">
                                  {service.credits} credits • {formatCurrency(service.cost)}
                                </span>
                              </div>
                              <Progress
                                value={((service.cost / usageByService[0]?.cost) || 0) * 100}
                                color={index === 0 ? 'primary' : 'default'}
                                size="sm"
                                classNames={{
                                  indicator: index === 0 ? "bg-purple-500" : "bg-gray-600",
                                }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardBody>
                </Card>

                {/* Recent Usage */}
                <Card className="bg-gradient-to-r from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-white">Recent Usage</h3>
                  </CardHeader>
                  <CardBody className="p-6 pt-0">
                    <div className="space-y-3">
                      {loading ? (
                        Array(5).fill(0).map((_, i) => (
                          <div key={i} className="animate-pulse flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-700 rounded"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-700 rounded w-1/2 mb-1"></div>
                              <div className="h-3 bg-gray-700 rounded w-1/3"></div>
                            </div>
                            <div className="h-4 bg-gray-700 rounded w-16"></div>
                          </div>
                        ))
                      ) : (
                        usageRecords.map((record) => (
                          <div key={record.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <ChartBarIcon className="w-5 h-5 text-purple-400" />
                              </div>
                              <div>
                                <p className="text-white font-medium">{record.description}</p>
                                <p className="text-gray-400 text-sm">
                                  {record.projectName && `${record.projectName} • `}
                                  {formatDate(record.date)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-semibold">{formatCurrency(record.cost)}</p>
                              <p className="text-gray-400 text-sm">{record.credits} credits</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Select
                    placeholder="Filter invoices"
                    className="w-48"
                    selectedKeys={[invoiceFilter]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as typeof invoiceFilter;
                      setInvoiceFilter(selected);
                    }}
                  >
                    <SelectItem key="all">All Invoices</SelectItem>
                    <SelectItem key="paid">Paid</SelectItem>
                    <SelectItem key="pending">Pending</SelectItem>
                    <SelectItem key="overdue">Overdue</SelectItem>
                  </Select>
                  
                  <p className="text-sm text-gray-400">
                    {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="space-y-3">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardBody className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                            </div>
                            <div className="h-6 bg-gray-700 rounded w-20"></div>
                          </div>
                        </CardBody>
                      </Card>
                    ))
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <Card key={invoice.id} className="bg-gradient-to-r from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
                        <CardBody className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="text-white font-semibold">{invoice.number}</h4>
                                <Chip
                                  size="sm"
                                  color={getStatusColor(invoice.status) as any}
                                  variant="flat"
                                >
                                  {invoice.status}
                                </Chip>
                              </div>
                              <p className="text-gray-400 text-sm mb-1">{invoice.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>Issued: {formatDate(invoice.date)}</span>
                                <span>Due: {formatDate(invoice.dueDate)}</span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-xl font-bold text-white mb-2">
                                {formatCurrency(invoice.amount)}
                              </p>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="bordered"
                                  onClick={() => handleViewInvoice(invoice)}
                                  startContent={<EyeIcon className="w-3 h-3" />}
                                >
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="bordered"
                                  startContent={<ArrowDownIcon className="w-3 h-3" />}
                                >
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))
                  )}
                </div>

                {filteredInvoices.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No invoices found</h3>
                    <p className="text-gray-400">
                      {invoiceFilter === 'all' 
                        ? "No invoices have been generated yet"
                        : `No ${invoiceFilter} invoices found`
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paymentMethods.map((method) => (
                    <Card key={method.id} className="bg-gradient-to-r from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
                      <CardBody className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <CreditCardIcon className="w-5 h-5 text-purple-400" />
                            <span className="text-white font-medium">
                              {method.brand} •••• {method.last4}
                            </span>
                          </div>
                          {method.isDefault && (
                            <Chip size="sm" color="primary" variant="flat">
                              Default
                            </Chip>
                          )}
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Expires</span>
                            <span className="text-white">
                              {String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Status</span>
                            <Chip
                              size="sm"
                              color={getStatusColor(method.status) as any}
                              variant="flat"
                            >
                              {method.status}
                            </Chip>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="bordered" className="flex-1">
                            Edit
                          </Button>
                          <Button size="sm" variant="bordered" color="danger">
                            Remove
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                  
                  <Card className="bg-gradient-to-r from-gray-900/40 to-gray-800/20 border-purple-500/20 border-dashed backdrop-blur-xl">
                    <CardBody className="p-4 flex items-center justify-center">
                      <Button
                        variant="ghost"
                        color="primary"
                        onClick={onPaymentModalOpen}
                        startContent={<PlusIcon className="w-4 h-4" />}
                        className="h-full w-full"
                      >
                        Add Payment Method
                      </Button>
                    </CardBody>
                  </Card>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}