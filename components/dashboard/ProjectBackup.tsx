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
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
// Using custom tab implementation since HeroUI may not have Tabs
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@heroui/tabs';

import {
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
} from '@/components/icons';

// Types
interface ProjectBackup {
  id: string;
  project_id: string;
  project_title: string;
  project_thumbnail?: string;
  backup_name: string;
  description?: string;
  created_at: string;
  backup_size: number; // in bytes
  backup_type: 'manual' | 'automatic' | 'scheduled';
  backup_status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  backup_data: {
    version: string;
    game_data: any;
    assets: Array<{
      id: string;
      name: string;
      type: string;
      size: number;
      url?: string;
    }>;
    metadata: {
      created_by: string;
      project_version: string;
      backup_settings: any;
    };
  };
  retention_days: number;
  expires_at: string;
  download_url?: string;
  restore_count: number;
}

interface BackupOperation {
  id: string;
  type: 'backup' | 'restore' | 'download';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

interface ProjectBackupProps {
  projectId?: string;
  onBackupCreated?: (backup: ProjectBackup) => void;
  onBackupRestored?: (backup: ProjectBackup) => void;
  onBackupDeleted?: (backupId: string) => void;
}

const BACKUP_TYPES = [
  { key: 'manual', label: 'Manual Backup', description: 'Created manually by user' },
  { key: 'automatic', label: 'Automatic Backup', description: 'Created automatically on major changes' },
  { key: 'scheduled', label: 'Scheduled Backup', description: 'Created on a regular schedule' },
];

const BACKUP_STATUSES = [
  { key: 'completed', label: 'Completed', color: 'success' },
  { key: 'processing', label: 'Processing', color: 'warning' },
  { key: 'pending', label: 'Pending', color: 'default' },
  { key: 'failed', label: 'Failed', color: 'danger' },
  { key: 'expired', label: 'Expired', color: 'danger' },
];

const RETENTION_OPTIONS = [
  { key: '7', label: '7 days' },
  { key: '30', label: '30 days' },
  { key: '90', label: '90 days' },
  { key: '365', label: '1 year' },
  { key: '-1', label: 'Never expire' },
];

export default function ProjectBackup({
  projectId,
  onBackupCreated,
  onBackupRestored,
  onBackupDeleted,
}: ProjectBackupProps) {
  const [backups, setBackups] = useState<ProjectBackup[]>([]);
  const [operations, setOperations] = useState<BackupOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBackupType, setSelectedBackupType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'backup_size' | 'backup_name'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Create Backup Modal
  const { isOpen: isCreateModalOpen, onOpen: onCreateModalOpen, onClose: onCreateModalClose } = useDisclosure();
  const [createBackupData, setCreateBackupData] = useState({
    backup_name: '',
    description: '',
    retention_days: '30',
    include_assets: true,
    include_settings: true,
  });

  // Restore Modal
  const { isOpen: isRestoreModalOpen, onOpen: onRestoreModalOpen, onClose: onRestoreModalClose } = useDisclosure();
  const [restoreBackup, setRestoreBackup] = useState<ProjectBackup | null>(null);
  const [restoreOptions, setRestoreOptions] = useState({
    create_new_project: false,
    restore_assets: true,
    restore_settings: true,
    new_project_name: '',
  });

  // Settings Modal
  const { isOpen: isSettingsModalOpen, onOpen: onSettingsModalOpen, onClose: onSettingsModalClose } = useDisclosure();
  const [backupSettings, setBackupSettings] = useState({
    auto_backup_enabled: true,
    auto_backup_frequency: 'weekly',
    max_backups_per_project: 10,
    default_retention_days: 30,
    compress_backups: true,
  });
  
  const [settingsTab, setSettingsTab] = useState<'general' | 'retention'>('general');

  // Load backups
  useEffect(() => {
    loadBackups();
  }, [projectId]);

  const loadBackups = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with actual implementation
      const mockBackups: ProjectBackup[] = [
        {
          id: '1',
          project_id: projectId || '1',
          project_title: 'Space Shooter Pro',
          backup_name: 'Pre-release backup',
          description: 'Backup before major UI changes',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          backup_size: 15728640, // 15MB
          backup_type: 'manual',
          backup_status: 'completed',
          backup_data: {
            version: '1.2.0',
            game_data: {},
            assets: [],
            metadata: {
              created_by: 'user-123',
              project_version: '1.2.0',
              backup_settings: {},
            },
          },
          retention_days: 30,
          expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
          restore_count: 2,
        },
        {
          id: '2',
          project_id: projectId || '1',
          project_title: 'Space Shooter Pro',
          backup_name: 'Auto backup - Level 3 complete',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          backup_size: 12582912, // 12MB
          backup_type: 'automatic',
          backup_status: 'completed',
          backup_data: {
            version: '1.1.5',
            game_data: {},
            assets: [],
            metadata: {
              created_by: 'system',
              project_version: '1.1.5',
              backup_settings: {},
            },
          },
          retention_days: 30,
          expires_at: new Date(Date.now() + 28 * 86400000).toISOString(),
          restore_count: 0,
        },
      ];

      setBackups(mockBackups);
    } catch (error) {
      console.error('Failed to load backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedBackups = useMemo(() => {
    let filtered = backups.filter(backup => {
      const matchesSearch = backup.backup_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          backup.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          backup.project_title.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedBackupType === 'all' || backup.backup_type === selectedBackupType;
      const matchesStatus = selectedStatus === 'all' || backup.backup_status === selectedStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });

    return filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      if (sortBy === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [backups, searchQuery, selectedBackupType, selectedStatus, sortBy, sortDirection]);

  const handleCreateBackup = async () => {
    const operation: BackupOperation = {
      id: Date.now().toString(),
      type: 'backup',
      status: 'processing',
      progress: 0,
      message: 'Creating backup...',
      started_at: new Date().toISOString(),
    };
    
    setOperations(prev => [...prev, operation]);
    
    // Simulate backup creation process
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setOperations(prev => prev.map(op => 
        op.id === operation.id ? { ...op, progress, message: `Creating backup... ${progress}%` } : op
      ));
    }
    
    // Complete the operation
    const newBackup: ProjectBackup = {
      id: Date.now().toString(),
      project_id: projectId || '1',
      project_title: 'Current Project',
      backup_name: createBackupData.backup_name,
      description: createBackupData.description,
      created_at: new Date().toISOString(),
      backup_size: Math.floor(Math.random() * 20000000) + 5000000,
      backup_type: 'manual',
      backup_status: 'completed',
      backup_data: {
        version: '1.0.0',
        game_data: {},
        assets: [],
        metadata: {
          created_by: 'current-user',
          project_version: '1.0.0',
          backup_settings: createBackupData,
        },
      },
      retention_days: parseInt(createBackupData.retention_days),
      expires_at: new Date(Date.now() + parseInt(createBackupData.retention_days) * 86400000).toISOString(),
      restore_count: 0,
    };
    
    setBackups(prev => [newBackup, ...prev]);
    setOperations(prev => prev.map(op => 
      op.id === operation.id 
        ? { ...op, status: 'completed', progress: 100, message: 'Backup created successfully', completed_at: new Date().toISOString() }
        : op
    ));
    
    onBackupCreated?.(newBackup);
    onCreateModalClose();
    setCreateBackupData({
      backup_name: '',
      description: '',
      retention_days: '30',
      include_assets: true,
      include_settings: true,
    });
  };

  const handleRestoreBackup = async (backup: ProjectBackup) => {
    const operation: BackupOperation = {
      id: Date.now().toString(),
      type: 'restore',
      status: 'processing',
      progress: 0,
      message: 'Preparing restore...',
      started_at: new Date().toISOString(),
    };
    
    setOperations(prev => [...prev, operation]);
    
    // Simulate restore process
    for (let progress = 0; progress <= 100; progress += 15) {
      await new Promise(resolve => setTimeout(resolve, 300));
      let message = 'Preparing restore...';
      if (progress > 20) message = 'Restoring game data...';
      if (progress > 50) message = 'Restoring assets...';
      if (progress > 80) message = 'Finalizing restore...';
      
      setOperations(prev => prev.map(op => 
        op.id === operation.id ? { ...op, progress, message } : op
      ));
    }
    
    // Update backup restore count
    setBackups(prev => prev.map(b => 
      b.id === backup.id ? { ...b, restore_count: b.restore_count + 1 } : b
    ));
    
    setOperations(prev => prev.map(op => 
      op.id === operation.id 
        ? { ...op, status: 'completed', progress: 100, message: 'Restore completed successfully', completed_at: new Date().toISOString() }
        : op
    ));
    
    onBackupRestored?.(backup);
    onRestoreModalClose();
  };

  const handleDeleteBackup = async (backupId: string) => {
    setBackups(prev => prev.filter(b => b.id !== backupId));
    onBackupDeleted?.(backupId);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    const statusConfig = BACKUP_STATUSES.find(s => s.key === status);
    return statusConfig?.color || 'default';
  };

  const getStatusLabel = (status: string) => {
    const statusConfig = BACKUP_STATUSES.find(s => s.key === status);
    return statusConfig?.label || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Project Backups</h2>
          <p className="text-gray-400">Manage and restore project backups</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="bordered"
            startContent={<ServerIcon className="w-4 h-4" />}
            onClick={onSettingsModalOpen}
            className="border-gray-600 text-gray-400"
          >
            Settings
          </Button>
          <Button
            color="primary"
            startContent={<CloudArrowUpIcon className="w-4 h-4" />}
            onClick={onCreateModalOpen}
            className="bg-gradient-to-r from-purple-500 to-purple-600"
          >
            Create Backup
          </Button>
        </div>
      </div>

      {/* Active Operations */}
      <AnimatePresence>
        {operations.filter(op => op.status === 'processing').map((operation) => (
          <motion.div
            key={operation.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-gradient-to-r from-blue-900/50 to-blue-800/30 border-blue-500/30">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {operation.type === 'backup' && <CloudArrowUpIcon className="w-5 h-5 text-blue-400" />}
                    {operation.type === 'restore' && <CloudArrowDownIcon className="w-5 h-5 text-green-400" />}
                    <div>
                      <h3 className="font-semibold text-white capitalize">{operation.type} in Progress</h3>
                      <p className="text-sm text-gray-400">{operation.message}</p>
                    </div>
                  </div>
                  <Chip size="sm" color="primary">{operation.progress}%</Chip>
                </div>
                <Progress 
                  value={operation.progress} 
                  color="primary"
                  className="w-full"
                />
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search backups by name, description, or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            isClearable
            onClear={() => setSearchQuery('')}
            className="max-w-md"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            placeholder="All Types"
            className="w-40"
            selectedKeys={selectedBackupType !== 'all' ? [selectedBackupType] : []}
            onSelectionChange={(keys) => setSelectedBackupType(Array.from(keys)[0] as string || 'all')}
            items={[{ key: 'all', label: 'All Types' }, ...BACKUP_TYPES]}
          >
            {(type) => <SelectItem key={type.key}>{type.label}</SelectItem>}
          </Select>
          <Select
            placeholder="All Statuses"
            className="w-40"
            selectedKeys={selectedStatus !== 'all' ? [selectedStatus] : []}
            onSelectionChange={(keys) => setSelectedStatus(Array.from(keys)[0] as string || 'all')}
            items={[{ key: 'all', label: 'All Statuses' }, ...BACKUP_STATUSES]}
          >
            {(status) => <SelectItem key={status.key}>{status.label}</SelectItem>}
          </Select>
          <Select
            placeholder="Sort by"
            className="w-40"
            selectedKeys={[`${sortBy}_${sortDirection}`]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              const [field, direction] = selected.split('_');
              setSortBy(field as any);
              setSortDirection(direction as any);
            }}
          >
            <SelectItem key="created_at_desc">Newest First</SelectItem>
            <SelectItem key="created_at_asc">Oldest First</SelectItem>
            <SelectItem key="backup_size_desc">Largest First</SelectItem>
            <SelectItem key="backup_size_asc">Smallest First</SelectItem>
            <SelectItem key="backup_name_asc">Name A-Z</SelectItem>
            <SelectItem key="backup_name_desc">Name Z-A</SelectItem>
          </Select>
        </div>
      </div>

      {/* Backups List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" color="primary" />
          </div>
        ) : filteredAndSortedBackups.length === 0 ? (
          <div className="text-center py-12">
            <CloudArrowUpIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No backups found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || selectedBackupType !== 'all' || selectedStatus !== 'all' 
                ? "No backups match your current filters"
                : "Create your first backup to get started"
              }
            </p>
            <Button
              color="primary"
              onClick={onCreateModalOpen}
              className="bg-gradient-to-r from-purple-500 to-purple-600"
            >
              Create First Backup
            </Button>
          </div>
        ) : (
          filteredAndSortedBackups.map((backup) => (
            <motion.div
              key={backup.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              layout
            >
              <Card className="bg-gradient-to-r from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl hover:border-purple-500/40 transition-all duration-300">
                <CardBody className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{backup.backup_name}</h3>
                        <Chip
                          size="sm"
                          color={getStatusColor(backup.backup_status) as any}
                          variant="flat"
                        >
                          {getStatusLabel(backup.backup_status)}
                        </Chip>
                        <Chip
                          size="sm"
                          variant="bordered"
                          className="border-gray-600 text-gray-400"
                        >
                          {BACKUP_TYPES.find(t => t.key === backup.backup_type)?.label}
                        </Chip>
                      </div>
                      
                      {backup.description && (
                        <p className="text-gray-400 mb-3">{backup.description}</p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>{formatTimeAgo(backup.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ServerIcon className="w-4 h-4" />
                          <span>{formatFileSize(backup.backup_size)}</span>
                        </div>
                        {backup.restore_count > 0 && (
                          <div className="flex items-center gap-1">
                            <ArrowPathIcon className="w-4 h-4" />
                            <span>Restored {backup.restore_count} time{backup.restore_count !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          <span>Expires {formatTimeAgo(backup.expires_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Tooltip content="Download Backup">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-white"
                          isDisabled={backup.backup_status !== 'completed'}
                        >
                          <CloudArrowDownIcon className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Restore Backup">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          className="text-blue-400 hover:text-blue-300"
                          isDisabled={backup.backup_status !== 'completed'}
                          onClick={() => {
                            setRestoreBackup(backup);
                            onRestoreModalOpen();
                          }}
                        >
                          <ArrowPathIcon className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Duplicate Backup">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          className="text-green-400 hover:text-green-300"
                          isDisabled={backup.backup_status !== 'completed'}
                        >
                          <DocumentDuplicateIcon className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Delete Backup">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleDeleteBackup(backup.id)}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Backup Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={onCreateModalClose} size="2xl">
        <ModalContent>
          <ModalHeader>Create New Backup</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Backup Name"
                placeholder="Enter a descriptive name for this backup"
                value={createBackupData.backup_name}
                onChange={(e) => setCreateBackupData(prev => ({ ...prev, backup_name: e.target.value }))}
                isRequired
              />
              <Input
                label="Description (Optional)"
                placeholder="Describe what this backup contains"
                value={createBackupData.description}
                onChange={(e) => setCreateBackupData(prev => ({ ...prev, description: e.target.value }))}
              />
              <Select
                label="Retention Period"
                selectedKeys={[createBackupData.retention_days]}
                onSelectionChange={(keys) => setCreateBackupData(prev => ({ ...prev, retention_days: Array.from(keys)[0] as string }))}
              >
                {RETENTION_OPTIONS.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>
              <div className="space-y-2">
                <label className="text-sm font-medium">Backup Options</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={createBackupData.include_assets}
                      onChange={(e) => setCreateBackupData(prev => ({ ...prev, include_assets: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-800"
                    />
                    <span className="text-sm">Include project assets (images, sounds, etc.)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={createBackupData.include_settings}
                      onChange={(e) => setCreateBackupData(prev => ({ ...prev, include_settings: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-800"
                    />
                    <span className="text-sm">Include project settings and configurations</span>
                  </label>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onCreateModalClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleCreateBackup}
              isDisabled={!createBackupData.backup_name.trim()}
              className="bg-gradient-to-r from-purple-500 to-purple-600"
            >
              Create Backup
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Restore Modal */}
      <Modal isOpen={isRestoreModalOpen} onClose={onRestoreModalClose} size="lg">
        <ModalContent>
          <ModalHeader>Restore Backup</ModalHeader>
          <ModalBody>
            {restoreBackup && (
              <div className="space-y-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium text-yellow-500">Warning</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    Restoring this backup will replace your current project data. This action cannot be undone.
                  </p>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Backup Details:</h4>
                  <div className="space-y-1 text-sm text-gray-400">
                    <p><strong>Name:</strong> {restoreBackup.backup_name}</p>
                    <p><strong>Created:</strong> {formatTimeAgo(restoreBackup.created_at)}</p>
                    <p><strong>Size:</strong> {formatFileSize(restoreBackup.backup_size)}</p>
                    <p><strong>Version:</strong> {restoreBackup.backup_data.version}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Restore Options</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={restoreOptions.create_new_project}
                        onChange={(e) => setRestoreOptions(prev => ({ ...prev, create_new_project: e.target.checked }))}
                        className="rounded border-gray-600 bg-gray-800"
                      />
                      <span className="text-sm">Create new project instead of overwriting current</span>
                    </label>
                    {restoreOptions.create_new_project && (
                      <Input
                        placeholder="New project name"
                        value={restoreOptions.new_project_name}
                        onChange={(e) => setRestoreOptions(prev => ({ ...prev, new_project_name: e.target.value }))}
                        className="ml-6"
                      />
                    )}
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={restoreOptions.restore_assets}
                        onChange={(e) => setRestoreOptions(prev => ({ ...prev, restore_assets: e.target.checked }))}
                        className="rounded border-gray-600 bg-gray-800"
                      />
                      <span className="text-sm">Restore project assets</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={restoreOptions.restore_settings}
                        onChange={(e) => setRestoreOptions(prev => ({ ...prev, restore_settings: e.target.checked }))}
                        className="rounded border-gray-600 bg-gray-800"
                      />
                      <span className="text-sm">Restore project settings</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onRestoreModalClose}>
              Cancel
            </Button>
            <Button
              color="warning"
              onClick={() => restoreBackup && handleRestoreBackup(restoreBackup)}
              isDisabled={restoreOptions.create_new_project && !restoreOptions.new_project_name.trim()}
            >
              Restore Backup
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsModalOpen} onClose={onSettingsModalClose} size="lg">
        <ModalContent>
          <ModalHeader>Backup Settings</ModalHeader>
          <ModalBody>
            <div className="w-full">
              {/* Custom Tab Navigation */}
              <div className="flex border-b border-gray-700 mb-4">
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    settingsTab === 'general' 
                      ? 'border-purple-500 text-purple-400' 
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                  onClick={() => setSettingsTab('general')}
                >
                  General
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    settingsTab === 'retention' 
                      ? 'border-purple-500 text-purple-400' 
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                  onClick={() => setSettingsTab('retention')}
                >
                  Retention
                </button>
              </div>

              {/* Tab Content */}
              {settingsTab === 'general' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Automatic Backups</h4>
                      <p className="text-sm text-gray-400">Create backups automatically on project changes</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={backupSettings.auto_backup_enabled}
                      onChange={(e) => setBackupSettings(prev => ({ ...prev, auto_backup_enabled: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-800"
                    />
                  </div>
                  
                  {backupSettings.auto_backup_enabled && (
                    <Select
                      label="Backup Frequency"
                      selectedKeys={[backupSettings.auto_backup_frequency]}
                      onSelectionChange={(keys) => setBackupSettings(prev => ({ ...prev, auto_backup_frequency: Array.from(keys)[0] as string }))}
                    >
                      <SelectItem key="hourly">Every Hour</SelectItem>
                      <SelectItem key="daily">Daily</SelectItem>
                      <SelectItem key="weekly">Weekly</SelectItem>
                    </Select>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Compress Backups</h4>
                      <p className="text-sm text-gray-400">Reduce backup file size</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={backupSettings.compress_backups}
                      onChange={(e) => setBackupSettings(prev => ({ ...prev, compress_backups: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-800"
                    />
                  </div>
                </div>
              )}

              {settingsTab === 'retention' && (
                <div className="space-y-4">
                  <Input
                    type="number"
                    label="Maximum Backups Per Project"
                    value={backupSettings.max_backups_per_project.toString()}
                    onChange={(e) => setBackupSettings(prev => ({ ...prev, max_backups_per_project: parseInt(e.target.value) || 10 }))}
                    min={1}
                    max={100}
                  />
                  <Select
                    label="Default Retention Period"
                    selectedKeys={[backupSettings.default_retention_days.toString()]}
                    onSelectionChange={(keys) => setBackupSettings(prev => ({ ...prev, default_retention_days: parseInt(Array.from(keys)[0] as string) }))}
                  >
                    {RETENTION_OPTIONS.map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onSettingsModalClose}>
              Cancel
            </Button>
            <Button color="primary" onClick={onSettingsModalClose}>
              Save Settings
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}