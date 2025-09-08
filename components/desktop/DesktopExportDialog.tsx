'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/modal';
import { Button } from '@heroui/button';
import { Select, SelectItem } from '@heroui/select';
import { Switch } from '@heroui/switch';
import { Input } from '@heroui/input';
import { Card, CardBody } from '@heroui/card';
import { Progress } from '@heroui/progress';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';
import { Download, FolderOpen, Settings, Package, Zap } from 'lucide-react';
import { useDesktop, useDesktopExport } from '@/hooks/useDesktop';
import type { ExportOptions } from '@/lib/desktop/api';

interface DesktopExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: any;
  onExportComplete?: (exportPath: string) => void;
}

const EXPORT_FORMATS = [
  {
    value: 'html5',
    label: 'HTML5 Game',
    description: 'Web-ready HTML5 game with JavaScript',
    icon: '🌐',
  },
  {
    value: 'webgl',
    label: 'WebGL Game',
    description: 'High-performance WebGL with hardware acceleration',
    icon: '⚡',
  },
  {
    value: 'pwa',
    label: 'Progressive Web App',
    description: 'Installable PWA with offline support',
    icon: '📱',
  },
  {
    value: 'executable',
    label: 'Desktop Executable',
    description: 'Standalone desktop application',
    icon: '💻',
  },
];

const OPTIMIZATION_LEVELS = [
  { value: 'none', label: 'None', description: 'Fastest build time' },
  { value: 'basic', label: 'Basic', description: 'Balanced optimization' },
  { value: 'aggressive', label: 'Aggressive', description: 'Smallest file size' },
];

const PLATFORM_TARGETS = [
  { value: 'web', label: 'Web (All Browsers)', icon: '🌐' },
  { value: 'desktop', label: 'Desktop (Current OS)', icon: '💻' },
  { value: 'windows', label: 'Windows', icon: '🪟' },
  { value: 'macos', label: 'macOS', icon: '🍎' },
  { value: 'linux', label: 'Linux', icon: '🐧' },
];

export const DesktopExportDialog: React.FC<DesktopExportDialogProps> = ({
  isOpen,
  onClose,
  projectData,
  onExportComplete,
}) => {
  const { isDesktop, showInFolder, showNotification } = useDesktop();
  const { exportFormats, isExporting, exportProgress, exportGame } = useDesktopExport();

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'html5',
    target_platform: 'web',
    optimization_level: 'basic',
    include_assets: true,
    compress_assets: false,
    output_path: undefined,
  });

  const [selectedFormat, setSelectedFormat] = useState('html5');
  const [customOutputPath, setCustomOutputPath] = useState('');
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [exportId, setExportId] = useState<string | null>(null);

  // Calculate estimated export size based on options
  useEffect(() => {
    const calculateSize = () => {
      let baseSize = 2; // Base size in MB
      
      if (exportOptions.include_assets) {
        baseSize += 10; // Add estimated asset size
      }
      
      if (exportOptions.format === 'executable') {
        baseSize += 20; // Executable wrapper overhead
      }
      
      if (exportOptions.compress_assets) {
        baseSize *= 0.6; // Compression reduces size by ~40%
      }
      
      return Math.max(1, baseSize);
    };

    setEstimatedSize(calculateSize());
  }, [exportOptions]);

  const handleFormatChange = (format: string) => {
    setSelectedFormat(format);
    setExportOptions(prev => ({
      ...prev,
      format,
      target_platform: format === 'executable' ? 'desktop' : 'web',
    }));
  };

  const handleExport = async () => {
    try {
      const finalOptions = {
        ...exportOptions,
        output_path: customOutputPath || undefined,
      };

      const result = await exportGame(projectData, finalOptions);
      
      if (result) {
        setExportId(result);
        
        // Show success notification when export completes
        setTimeout(async () => {
          if (!isExporting && exportProgress === 100) {
            await showNotification(
              'Export Complete',
              `Your ${exportOptions.format.toUpperCase()} game has been exported successfully!`
            );
            
            if (onExportComplete) {
              onExportComplete(result);
            }
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Export failed:', error);
      await showNotification(
        'Export Failed',
        'An error occurred during game export. Please try again.'
      );
    }
  };

  const handleBrowseOutputPath = async () => {
    // This would open a folder selection dialog in desktop environment
    // For now, we'll use a placeholder
    if (isDesktop) {
      // In real implementation, this would use Tauri's file dialog
      console.log('Browse for output path');
    }
  };

  const handleShowExportFolder = async () => {
    if (customOutputPath) {
      await showInFolder(customOutputPath);
    }
  };

  const selectedFormatInfo = EXPORT_FORMATS.find(f => f.value === selectedFormat);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        base: 'max-h-[90vh]',
        body: 'py-6',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <span>Export Game</span>
          </div>
          <p className="text-sm text-default-500 font-normal">
            Export your game to various formats for distribution
          </p>
        </ModalHeader>
        
        <ModalBody>
          {isExporting ? (
            // Export Progress View
            <div className="space-y-6">
              <Card>
                <CardBody className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-medium mb-2">
                    Exporting {selectedFormatInfo?.label}
                  </h3>
                  <p className="text-default-500 mb-6">
                    Please wait while your game is being packaged...
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Export Progress</span>
                      <span>{exportProgress.toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={exportProgress} 
                      color="primary"
                      size="md"
                      className="max-w-md mx-auto"
                    />
                  </div>
                  
                  {exportProgress === 100 && (
                    <div className="mt-6">
                      <Chip color="success" variant="flat" size="lg">
                        Export Complete!
                      </Chip>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          ) : (
            // Export Configuration View
            <div className="space-y-6">
              {/* Format Selection */}
              <div>
                <h3 className="text-lg font-medium mb-3">Export Format</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {EXPORT_FORMATS.map((format) => (
                    <Card
                      key={format.value}
                      isPressable
                      isHoverable
                      className={`cursor-pointer transition-all ${
                        selectedFormat === format.value
                          ? 'border-2 border-primary bg-primary-50'
                          : 'border border-default-200'
                      }`}
                      onPress={() => handleFormatChange(format.value)}
                    >
                      <CardBody className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{format.icon}</span>
                          <div className="flex-1">
                            <h4 className="font-medium">{format.label}</h4>
                            <p className="text-sm text-default-500 mt-1">
                              {format.description}
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>

              <Divider />

              {/* Platform Target */}
              <div>
                <h3 className="text-lg font-medium mb-3">Target Platform</h3>
                <Select
                  selectedKeys={[exportOptions.target_platform]}
                  onSelectionChange={(keys) => {
                    const platform = Array.from(keys)[0] as string;
                    setExportOptions(prev => ({ ...prev, target_platform: platform }));
                  }}
                  placeholder="Select target platform"
                >
                  {PLATFORM_TARGETS.map((platform) => (
                    <SelectItem
                      key={platform.value}
                      startContent={<span className="text-lg">{platform.icon}</span>}
                    >
                      {platform.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Optimization Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Optimization</h3>
                  <Select
                    selectedKeys={[exportOptions.optimization_level]}
                    onSelectionChange={(keys) => {
                      const level = Array.from(keys)[0] as string;
                      setExportOptions(prev => ({ ...prev, optimization_level: level }));
                    }}
                    placeholder="Select optimization level"
                  >
                    {OPTIMIZATION_LEVELS.map((level) => (
                      <SelectItem key={level.value}>
                        <div>
                          <div className="font-medium">{level.label}</div>
                          <div className="text-sm text-default-500">{level.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Asset Options</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Include Assets</span>
                      <Switch
                        isSelected={exportOptions.include_assets}
                        onValueChange={(value) =>
                          setExportOptions(prev => ({ ...prev, include_assets: value }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Compress Assets</span>
                      <Switch
                        isSelected={exportOptions.compress_assets}
                        onValueChange={(value) =>
                          setExportOptions(prev => ({ ...prev, compress_assets: value }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Output Path */}
              {isDesktop && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Output Location</h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Use default export location"
                      value={customOutputPath}
                      onValueChange={setCustomOutputPath}
                      className="flex-1"
                    />
                    <Button
                      variant="flat"
                      isIconOnly
                      onPress={handleBrowseOutputPath}
                    >
                      <FolderOpen className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Export Summary */}
              <Card>
                <CardBody>
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="w-4 h-4" />
                    <h3 className="font-medium">Export Summary</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-default-500">Format:</span>
                      <p className="font-medium">{selectedFormatInfo?.label}</p>
                    </div>
                    <div>
                      <span className="text-default-500">Platform:</span>
                      <p className="font-medium capitalize">{exportOptions.target_platform}</p>
                    </div>
                    <div>
                      <span className="text-default-500">Optimization:</span>
                      <p className="font-medium capitalize">{exportOptions.optimization_level}</p>
                    </div>
                    <div>
                      <span className="text-default-500">Estimated Size:</span>
                      <p className="font-medium">~{estimatedSize?.toFixed(1)} MB</p>
                    </div>
                  </div>

                  {exportOptions.include_assets && (
                    <div className="mt-3 p-2 bg-default-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4 text-warning" />
                        <span className="text-warning">
                          Assets will be {exportOptions.compress_assets ? 'compressed and ' : ''}included
                        </span>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          )}
        </ModalBody>
        
        <ModalFooter>
          <div className="flex gap-2 w-full">
            {isExporting ? (
              <>
                <Button variant="flat" onPress={onClose} className="flex-1">
                  Run in Background
                </Button>
                {exportProgress === 100 && customOutputPath && (
                  <Button
                    color="primary"
                    onPress={handleShowExportFolder}
                    startContent={<FolderOpen className="w-4 h-4" />}
                  >
                    Show in Folder
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={handleExport}
                  startContent={<Download className="w-4 h-4" />}
                >
                  Export Game
                </Button>
              </>
            )}
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DesktopExportDialog;