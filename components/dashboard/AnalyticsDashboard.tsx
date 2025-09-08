"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Select, SelectItem } from '@heroui/select';
import { Tabs, Tab } from '@heroui/tabs';
import { Progress } from '@heroui/progress';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';
import { Spinner } from '@heroui/spinner';
import Link from 'next/link';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import {
  ChartBarIcon,
  PlayIcon,
  HeartIcon,
  EyeIcon,
  UserGroupIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ClockIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@/components/icons';

import type { DashboardAnalytics, ProjectAnalytics } from '@/types/dashboard';

interface AnalyticsDashboardProps {
  dashboardAnalytics: DashboardAnalytics;
  projectAnalytics?: ProjectAnalytics[];
  loading?: boolean;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange?: (range: '7d' | '30d' | '90d' | '1y') => void;
}

const COLORS = {
  primary: '#8b5cf6',
  secondary: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  blue: '#3b82f6',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
  pink: '#ec4899',
  indigo: '#6366f1',
};

const PIE_COLORS = [COLORS.purple, COLORS.blue, COLORS.green, COLORS.yellow, COLORS.red, COLORS.pink];

export default function AnalyticsDashboard({
  dashboardAnalytics,
  projectAnalytics = [],
  loading = false,
  timeRange = '30d',
  onTimeRangeChange,
}: AnalyticsDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const timeRangeOptions = [
    { key: '7d', label: 'Last 7 days' },
    { key: '30d', label: 'Last 30 days' },
    { key: '90d', label: 'Last 90 days' },
    { key: '1y', label: 'Last year' },
  ];

  // Calculate growth percentages
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Mock data for demonstration - in real app, this would come from props
  const mockTrendData = useMemo(() => {
    const data = [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        plays: Math.floor(Math.random() * 100) + 20,
        uniquePlayers: Math.floor(Math.random() * 80) + 15,
        projects: Math.floor(Math.random() * 5) + 1,
      });
    }
    
    return data;
  }, [timeRange]);

  const deviceData = [
    { name: 'Desktop', value: 65, color: COLORS.purple },
    { name: 'Mobile', value: 25, color: COLORS.blue },
    { name: 'Tablet', value: 10, color: COLORS.green },
  ];

  const countryData = [
    { name: 'United States', value: 35, color: COLORS.purple },
    { name: 'United Kingdom', value: 20, color: COLORS.blue },
    { name: 'Germany', value: 15, color: COLORS.green },
    { name: 'Canada', value: 12, color: COLORS.yellow },
    { name: 'Others', value: 18, color: COLORS.red },
  ];

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/20">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm font-medium">Total Projects</p>
                <p className="text-3xl font-bold text-white">
                  {dashboardAnalytics.overview.totalProjects}
                </p>
                <div className="flex items-center mt-1">
                  <ArrowUpIcon className="w-3 h-3 text-green-400 mr-1" />
                  <span className="text-xs text-green-400">+12% from last month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/20">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium">Total Plays</p>
                <p className="text-3xl font-bold text-white">
                  {formatNumber(dashboardAnalytics.overview.totalPlays)}
                </p>
                <div className="flex items-center mt-1">
                  <ArrowUpIcon className="w-3 h-3 text-green-400 mr-1" />
                  <span className="text-xs text-green-400">+23% from last month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <PlayIcon className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/20">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium">Total Likes</p>
                <p className="text-3xl font-bold text-white">
                  {formatNumber(dashboardAnalytics.overview.totalLikes)}
                </p>
                <div className="flex items-center mt-1">
                  <ArrowUpIcon className="w-3 h-3 text-green-400 mr-1" />
                  <span className="text-xs text-green-400">+8% from last month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <HeartIcon className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-500/20">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400 text-sm font-medium">Followers</p>
                <p className="text-3xl font-bold text-white">
                  {formatNumber(dashboardAnalytics.overview.followerCount)}
                </p>
                <div className="flex items-center mt-1">
                  <ArrowUpIcon className="w-3 h-3 text-green-400 mr-1" />
                  <span className="text-xs text-green-400">+15% from last month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Trends Chart */}
      <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <h4 className="text-lg font-semibold text-white">Activity Trends</h4>
            <Select
              size="sm"
              selectedKeys={[timeRange]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                onTimeRangeChange?.(selected as any);
              }}
              className="w-32"
            >
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardHeader>
        <CardBody>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="plays"
                  stackId="1"
                  stroke={COLORS.purple}
                  fill={COLORS.purple}
                  fillOpacity={0.6}
                  name="Plays"
                />
                <Area
                  type="monotone"
                  dataKey="uniquePlayers"
                  stackId="2"
                  stroke={COLORS.blue}
                  fill={COLORS.blue}
                  fillOpacity={0.6}
                  name="Unique Players"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      {/* Top Projects and Audience */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Projects */}
        <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20">
          <CardHeader>
            <h4 className="text-lg font-semibold text-white">Top Performing Projects</h4>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {dashboardAnalytics.projectPerformance.topProjects.map((project, index) => (
                <div key={project.projectId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <Link 
                        href={`/creator/${project.projectId}`}
                        className="font-medium text-white hover:text-purple-400 transition-colors"
                      >
                        {project.title}
                      </Link>
                      <p className="text-sm text-gray-400">
                        {formatNumber(project.plays)} plays
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center ${
                      project.growth >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {project.growth >= 0 ? (
                        <TrendingUpIcon className="w-4 h-4 mr-1" />
                      ) : (
                        <TrendingDownIcon className="w-4 h-4 mr-1" />
                      )}
                      <span className="text-sm font-medium">
                        {Math.abs(project.growth).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Audience Demographics */}
        <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20">
          <CardHeader>
            <h4 className="text-lg font-semibold text-white">Audience Overview</h4>
          </CardHeader>
          <CardBody>
            <Tabs selectedKey={selectedTab} onSelectionChange={setSelectedTab as any}>
              <Tab key="devices" title="Devices">
                <div className="space-y-4">
                  {deviceData.map((device) => (
                    <div key={device.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {device.name === 'Desktop' && <ComputerDesktopIcon className="w-5 h-5 text-gray-400" />}
                        {device.name === 'Mobile' && <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400" />}
                        {device.name === 'Tablet' && <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400" />}
                        <span className="text-white">{device.name}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Progress
                          value={device.value}
                          className="w-20"
                          color="primary"
                          size="sm"
                        />
                        <span className="text-sm text-gray-400 w-8">{device.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Tab>
              <Tab key="countries" title="Countries">
                <div className="space-y-4">
                  {countryData.map((country) => (
                    <div key={country.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-white">{country.name}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Progress
                          value={country.value}
                          className="w-20"
                          color="primary"
                          size="sm"
                        />
                        <span className="text-sm text-gray-400 w-8">{country.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </div>
    </div>
  );

  const ProjectsTab = () => (
    <div className="space-y-6">
      {/* Project Selector */}
      <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20">
        <CardBody className="p-4">
          <div className="flex items-center space-x-4">
            <Select
              placeholder="Select a project"
              selectedKeys={[selectedProject]}
              onSelectionChange={(keys) => setSelectedProject(Array.from(keys)[0] as string)}
              className="flex-1 max-w-md"
            >
              {[
                { id: 'all', title: 'All Projects' },
                ...dashboardAnalytics.projectPerformance.topProjects.map(p => ({ id: p.projectId, title: p.title }))
              ].map((project) => (
                <SelectItem key={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Project Analytics Grid */}
      {selectedProject !== 'all' && projectAnalytics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/20">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-400 text-sm font-medium">Total Plays</p>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(projectAnalytics[0]?.overview.totalPlays || 0)}
                  </p>
                </div>
                <PlayIcon className="w-8 h-8 text-purple-400" />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/20">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-400 text-sm font-medium">Unique Players</p>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(projectAnalytics[0]?.overview.uniquePlayers || 0)}
                  </p>
                </div>
                <UserGroupIcon className="w-8 h-8 text-blue-400" />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/20">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 text-sm font-medium">Avg. Play Time</p>
                  <p className="text-2xl font-bold text-white">
                    {Math.floor((projectAnalytics[0]?.overview.averagePlayTime || 0) / 60)}m
                  </p>
                </div>
                <ClockIcon className="w-8 h-8 text-green-400" />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-500/20">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-400 text-sm font-medium">Completion Rate</p>
                  <p className="text-2xl font-bold text-white">
                    {Math.round((projectAnalytics[0]?.overview.completionRate || 0) * 100)}%
                  </p>
                </div>
                <TrendingUpIcon className="w-8 h-8 text-yellow-400" />
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Projects Performance Comparison */}
      <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20">
        <CardHeader>
          <h4 className="text-lg font-semibold text-white">Projects Performance Comparison</h4>
        </CardHeader>
        <CardBody>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardAnalytics.projectPerformance.topProjects.map(p => ({
                  name: p.title.length > 15 ? p.title.substring(0, 15) + '...' : p.title,
                  plays: p.plays,
                  growth: p.growth,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Bar dataKey="plays" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-purple-400" />
            Analytics Dashboard
          </h3>
        </div>
      </CardHeader>
      <CardBody>
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={setSelectedTab as any}
          variant="bordered"
          color="primary"
        >
          <Tab key="overview" title="Overview">
            <OverviewTab />
          </Tab>
          <Tab key="projects" title="Projects">
            <ProjectsTab />
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
}