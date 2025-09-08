'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Switch,
  Button,
  Divider,
  Progress,
  Badge,
} from '@heroui/react';
import { Settings, Download, Shield, Keyboard, FolderOpen, ExternalLink } from 'lucide-react';
import { useDesktop, useDesktopUpdater } from '@/hooks/useDesktop';
import { DesktopAPI } from '@/lib/desktop/api';

interface DesktopSettingsProps {
  className?: string;
}

export const DesktopSettings: React.FC<DesktopSettingsProps> = ({ className }) => {
  const {
    isDesktop,
    systemInfo,
    setWindowAlwaysOnTop,
    createDesktopShortcut,
    setAutoLaunch,
    showNotification,
  } = useDesktop();
  
  const {
    updateAvailable,
    updateInfo,
    isUpdating,
    updateProgress,
    checkForUpdates,
    installUpdate,
  } = useDesktopUpdater();

  const [settings, setSettings] = useState({
    alwaysOnTop: false,
    autoLaunch: false,
    notifications: true,
    autoUpdate: true,
    backgroundMode: true,
    globalShortcuts: true,
  });

  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  // Load settings from desktop storage
  useEffect(() => {
    if (!isDesktop) return;

    const loadSettings = async () => {
      try {
        const appDataPath = await DesktopAPI.system.getAppDataPath();
        // Load settings from local storage or config file
        const savedSettings = localStorage.getItem('desktop-settings');
        if (savedSettings) {
          setSettings({ ...settings, ...JSON.parse(savedSettings) });
        }
      } catch (error) {
        console.error('Failed to load desktop settings:', error);
      }
    };

    loadSettings();
  }, [isDesktop]);

  // Save settings to desktop storage
  const saveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    localStorage.setItem('desktop-settings', JSON.stringify(newSettings));
  };

  const handleSettingChange = async (key: keyof typeof settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);

    // Apply setting immediately
    try {
      switch (key) {
        case 'alwaysOnTop':
          await setWindowAlwaysOnTop(value);
          break;
        case 'autoLaunch':
          await setAutoLaunch(value);
          break;
        case 'notifications':
          if (value) {
            await showNotification(
              'Notifications Enabled',
              'You will now receive desktop notifications from GameGen'
            );
          }
          break;
        case 'globalShortcuts':
          if (value) {
            await DesktopAPI.features.registerGlobalShortcut('CmdOrCtrl+Shift+G', 'show_hide');
            await DesktopAPI.features.registerGlobalShortcut('CmdOrCtrl+Shift+N', 'new_project');
          } else {
            await DesktopAPI.features.unregisterGlobalShortcut('CmdOrCtrl+Shift+G');
            await DesktopAPI.features.unregisterGlobalShortcut('CmdOrCtrl+Shift+N');
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to apply setting ${key}:`, error);
      // Revert setting if application failed
      setSettings(settings);
    }
  };

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdates(true);
    try {
      await checkForUpdates();
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleCreateShortcut = async () => {
    try {
      await createDesktopShortcut();
      await showNotification(
        'Desktop Shortcut Created',
        'GameGen shortcut has been added to your desktop'
      );
    } catch (error) {
      console.error('Failed to create desktop shortcut:', error);
    }
  };

  if (!isDesktop) {
    return (
      <Card className={className}>
        <CardBody className="text-center p-8">
          <Settings className="w-12 h-12 mx-auto mb-4 text-default-400" />
          <h3 className="text-lg font-medium mb-2">Desktop Settings</h3>
          <p className="text-default-500">
            Desktop settings are only available in the desktop application.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* System Information */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5" />
            <h3 className="text-lg font-medium">System Information</h3>
          </div>
          
          {systemInfo && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-default-500">Platform:</span>
                <p className="font-medium capitalize">{systemInfo.platform}</p>
              </div>
              <div>
                <span className="text-default-500">Architecture:</span>
                <p className="font-medium">{systemInfo.arch}</p>
              </div>
              <div>
                <span className="text-default-500">Version:</span>
                <p className="font-medium">{systemInfo.version}</p>
              </div>
              <div>
                <span className="text-default-500">Type:</span>
                <p className="font-medium">{systemInfo.type}</p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Window Settings */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-3 mb-4">
            <ExternalLink className="w-5 h-5" />
            <h3 className="text-lg font-medium">Window Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Always on Top</p>
                <p className="text-sm text-default-500">
                  Keep GameGen window above all other windows
                </p>
              </div>
              <Switch
                isSelected={settings.alwaysOnTop}
                onValueChange={(value) => handleSettingChange('alwaysOnTop', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Background Mode</p>
                <p className="text-sm text-default-500">
                  Keep GameGen running in system tray when closed
                </p>
              </div>
              <Switch
                isSelected={settings.backgroundMode}
                onValueChange={(value) => handleSettingChange('backgroundMode', value)}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* System Integration */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-3 mb-4">
            <FolderOpen className="w-5 h-5" />
            <h3 className="text-lg font-medium">System Integration</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto Launch</p>
                <p className="text-sm text-default-500">
                  Start GameGen automatically when you log in
                </p>
              </div>
              <Switch
                isSelected={settings.autoLaunch}
                onValueChange={(value) => handleSettingChange('autoLaunch', value)}
              />
            </div>

            <Divider />

            <Button
              variant="flat"
              onPress={handleCreateShortcut}
              startContent={<FolderOpen className="w-4 h-4" />}
            >
              Create Desktop Shortcut
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Notifications & Shortcuts */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-3 mb-4">
            <Keyboard className="w-5 h-5" />
            <h3 className="text-lg font-medium">Notifications & Shortcuts</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Desktop Notifications</p>
                <p className="text-sm text-default-500">
                  Show system notifications for exports and updates
                </p>
              </div>
              <Switch
                isSelected={settings.notifications}
                onValueChange={(value) => handleSettingChange('notifications', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Global Shortcuts</p>
                <p className="text-sm text-default-500">
                  Enable system-wide keyboard shortcuts
                </p>
              </div>
              <Switch
                isSelected={settings.globalShortcuts}
                onValueChange={(value) => handleSettingChange('globalShortcuts', value)}
              />
            </div>

            {settings.globalShortcuts && (
              <div className="mt-4 p-3 bg-default-50 rounded-lg">
                <p className="text-sm font-medium mb-2">Active Shortcuts:</p>
                <div className="space-y-1 text-sm text-default-600">
                  <div>
                    <kbd className="px-2 py-1 text-xs bg-white border rounded">
                      Cmd/Ctrl + Shift + G
                    </kbd>
                    <span className="ml-2">Show/Hide GameGen</span>
                  </div>
                  <div>
                    <kbd className="px-2 py-1 text-xs bg-white border rounded">
                      Cmd/Ctrl + Shift + N
                    </kbd>
                    <span className="ml-2">New Project</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Auto-Updater */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-5 h-5" />
            <h3 className="text-lg font-medium">Auto-Updater</h3>
            {updateAvailable && (
              <Badge color="success" variant="flat">
                Update Available
              </Badge>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Automatic Updates</p>
                <p className="text-sm text-default-500">
                  Check for and install updates automatically
                </p>
              </div>
              <Switch
                isSelected={settings.autoUpdate}
                onValueChange={(value) => handleSettingChange('autoUpdate', value)}
              />
            </div>

            <Divider />

            {updateAvailable && updateInfo && (
              <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-success-800">
                    Version {updateInfo.version} Available
                  </h4>
                  <Badge color="success" size="sm">
                    {(updateInfo.size / 1024 / 1024).toFixed(1)} MB
                  </Badge>
                </div>
                <p className="text-sm text-success-600 mb-3">
                  {updateInfo.release_notes.substring(0, 120)}...
                </p>
                
                {isUpdating ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Installing update...</span>
                      <span>{updateProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={updateProgress} color="success" size="sm" />
                  </div>
                ) : (
                  <Button
                    color="success"
                    size="sm"
                    onPress={installUpdate}
                    startContent={<Download className="w-4 h-4" />}
                  >
                    Install Update
                  </Button>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="flat"
                onPress={handleCheckForUpdates}
                isLoading={isCheckingUpdates}
                startContent={!isCheckingUpdates && <Shield className="w-4 h-4" />}
              >
                Check for Updates
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default DesktopSettings;