"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader } from '@heroui/card';
// Simple Skeleton component since HeroUI doesn't have one
const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse ${className}`} />
);

interface DashboardLoadingSkeletonProps {
  tab?: string;
}

export default function DashboardLoadingSkeleton({ tab = 'overview' }: DashboardLoadingSkeletonProps) {
  const pulseVariants = {
    initial: { opacity: 0.6 },
    animate: { 
      opacity: [0.6, 0.8, 0.6],
      transition: { 
        duration: 1.5, 
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">
        {/* Header Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="w-80 h-10 rounded-lg mb-2 bg-gray-700/50" />
              <Skeleton className="w-64 h-6 rounded-lg bg-gray-700/30" />
            </div>
            <Skeleton className="w-48 h-12 rounded-lg bg-purple-900/30" />
          </div>
        </motion.div>

        {/* Tabs Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex space-x-4 bg-gray-900/50 backdrop-blur-xl border border-purple-500/20 rounded-lg p-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="w-32 h-12 rounded-md bg-gray-700/30" />
            ))}
          </div>
        </motion.div>

        {/* Content Skeleton based on tab */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {tab === 'overview' && <OverviewSkeleton />}
          {tab === 'projects' && <ProjectsSkeleton />}
          {tab === 'analytics' && <AnalyticsSkeleton />}
          {tab === 'templates' && <TemplatesSkeleton />}
          {tab === 'collaborations' && <CollaborationsSkeleton />}
          {tab === 'billing' && <BillingSkeleton />}
          {tab === 'notifications' && <NotificationsSkeleton />}
        </motion.div>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-8">
      {/* Quick Actions Skeleton */}
      <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
        <CardBody className="p-6">
          <Skeleton className="w-48 h-8 rounded-lg mb-6 bg-gray-700/50" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                variants={{
                  initial: { opacity: 0, scale: 0.9 },
                  animate: { opacity: 1, scale: 1 }
                }}
                initial="initial"
                animate="animate"
                transition={{ delay: i * 0.1 }}
              >
                <Skeleton className="w-full h-32 rounded-xl bg-gradient-to-br from-purple-900/30 to-purple-800/20" />
              </motion.div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            variants={{
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 }
            }}
            initial="initial"
            animate="animate"
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/20 backdrop-blur-xl">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="w-24 h-4 rounded mb-2 bg-purple-400/30" />
                    <Skeleton className="w-16 h-8 rounded bg-gray-300/50" />
                  </div>
                  <Skeleton className="w-12 h-12 rounded-xl bg-purple-500/20" />
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Dashboard Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Projects Skeleton */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between w-full">
                <Skeleton className="w-40 h-6 rounded bg-gray-300/50" />
                <Skeleton className="w-20 h-8 rounded bg-purple-500/30" />
              </div>
            </CardHeader>
            <CardBody className="p-6 pt-0">
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <motion.div
                    key={i}
                    variants={{
                      initial: { opacity: 0, x: -20 },
                      animate: { opacity: 1, x: 0 }
                    }}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: i * 0.1 }}
                    className="p-4 bg-gradient-to-r from-purple-900/20 to-transparent rounded-xl border border-purple-500/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500/30 to-purple-600/30" />
                        <div>
                          <Skeleton className="w-32 h-5 rounded mb-2 bg-gray-300/50" />
                          <Skeleton className="w-20 h-4 rounded bg-gray-400/30" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-16 h-6 rounded-full bg-green-500/20" />
                        <Skeleton className="w-12 h-8 rounded bg-purple-500/30" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6">
                <Skeleton className="w-full h-10 rounded bg-purple-500/20" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Activity & Progress Skeleton */}
        <div className="space-y-6">
          {/* Progress Card Skeleton */}
          <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <Skeleton className="w-36 h-6 rounded bg-gray-300/50" />
            </CardHeader>
            <CardBody className="p-6 pt-0">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <Skeleton className="w-24 h-4 rounded bg-gray-300/30" />
                    <Skeleton className="w-20 h-4 rounded bg-purple-400/30" />
                  </div>
                  <Skeleton className="w-full h-2 rounded-full bg-gray-700/50" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <Skeleton className="w-28 h-4 rounded bg-gray-300/30" />
                    <Skeleton className="w-16 h-4 rounded bg-blue-400/30" />
                  </div>
                  <Skeleton className="w-full h-2 rounded-full bg-gray-700/50" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Quick Links Skeleton */}
          <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
            <CardBody className="p-6">
              <Skeleton className="w-24 h-6 rounded mb-4 bg-gray-300/50" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="w-full h-10 rounded bg-gray-700/30" />
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Activity Feed Skeleton */}
      <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
        <CardHeader>
          <Skeleton className="w-32 h-6 rounded bg-gray-300/50" />
        </CardHeader>
        <CardBody className="p-6 pt-0">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                variants={{
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 }
                }}
                initial="initial"
                animate="animate"
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-900/10 to-transparent rounded-lg"
              >
                <Skeleton className="w-10 h-10 rounded-full bg-purple-500/30 flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="w-48 h-4 rounded mb-2 bg-gray-300/50" />
                  <Skeleton className="w-full h-3 rounded mb-1 bg-gray-400/30" />
                  <Skeleton className="w-3/4 h-3 rounded bg-gray-400/30" />
                  <Skeleton className="w-20 h-3 rounded mt-2 bg-gray-500/30" />
                </div>
              </motion.div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filters and Search Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-64 h-10 rounded bg-gray-700/50" />
          <Skeleton className="w-24 h-10 rounded bg-purple-500/30" />
          <Skeleton className="w-20 h-10 rounded bg-blue-500/30" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-24 h-10 rounded bg-green-500/30" />
          <Skeleton className="w-28 h-10 rounded bg-orange-500/30" />
        </div>
      </div>

      {/* Projects Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            variants={{
              initial: { opacity: 0, scale: 0.9 },
              animate: { opacity: 1, scale: 1 }
            }}
            initial="initial"
            animate="animate"
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
              <CardBody className="p-0">
                <Skeleton className="w-full h-48 rounded-t-lg bg-gradient-to-br from-purple-900/30 to-blue-900/30" />
                <div className="p-4">
                  <Skeleton className="w-3/4 h-6 rounded mb-2 bg-gray-300/50" />
                  <Skeleton className="w-full h-4 rounded mb-1 bg-gray-400/30" />
                  <Skeleton className="w-2/3 h-4 rounded mb-4 bg-gray-400/30" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="w-16 h-6 rounded-full bg-green-500/20" />
                    <Skeleton className="w-20 h-4 rounded bg-gray-500/30" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded bg-gray-700/50" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-8 h-8 rounded bg-purple-500/30" />
          ))}
          <Skeleton className="w-8 h-8 rounded bg-gray-700/50" />
        </div>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Time Range Selector Skeleton */}
      <div className="flex justify-end">
        <Skeleton className="w-32 h-10 rounded bg-purple-500/30" />
      </div>

      {/* Overview Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            variants={{
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 }
            }}
            initial="initial"
            animate="animate"
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20">
              <CardBody className="p-6">
                <Skeleton className="w-24 h-4 rounded mb-2 bg-gray-400/30" />
                <Skeleton className="w-16 h-8 rounded mb-2 bg-gray-300/50" />
                <Skeleton className="w-20 h-3 rounded bg-green-400/30" />
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20">
          <CardHeader>
            <Skeleton className="w-32 h-6 rounded bg-gray-300/50" />
          </CardHeader>
          <CardBody>
            <Skeleton className="w-full h-64 rounded bg-gradient-to-br from-purple-900/20 to-blue-900/20" />
          </CardBody>
        </Card>
        
        <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20">
          <CardHeader>
            <Skeleton className="w-40 h-6 rounded bg-gray-300/50" />
          </CardHeader>
          <CardBody>
            <Skeleton className="w-full h-64 rounded bg-gradient-to-br from-green-900/20 to-blue-900/20" />
          </CardBody>
        </Card>
      </div>

      {/* Performance Table Skeleton */}
      <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20">
        <CardHeader>
          <Skeleton className="w-48 h-6 rounded bg-gray-300/50" />
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-700/30">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded bg-purple-500/30" />
                  <div>
                    <Skeleton className="w-32 h-5 rounded mb-1 bg-gray-300/50" />
                    <Skeleton className="w-20 h-4 rounded bg-gray-400/30" />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <Skeleton className="w-16 h-5 rounded bg-gray-300/50" />
                  <Skeleton className="w-16 h-5 rounded bg-green-400/30" />
                  <Skeleton className="w-20 h-5 rounded bg-blue-400/30" />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function TemplatesSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header and Filters Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Skeleton className="w-48 h-8 rounded mb-2 bg-gray-300/50" />
          <Skeleton className="w-64 h-5 rounded bg-gray-400/30" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="w-32 h-10 rounded bg-purple-500/30" />
          <Skeleton className="w-24 h-10 rounded bg-blue-500/30" />
        </div>
      </div>

      {/* Categories Skeleton */}
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="w-20 h-8 rounded-full bg-purple-500/20" />
        ))}
      </div>

      {/* Templates Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.div
            key={i}
            variants={{
              initial: { opacity: 0, scale: 0.9 },
              animate: { opacity: 1, scale: 1 }
            }}
            initial="initial"
            animate="animate"
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20">
              <CardBody className="p-0">
                <Skeleton className="w-full h-48 rounded-t-lg bg-gradient-to-br from-purple-900/30 to-blue-900/30" />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Skeleton className="w-32 h-6 rounded mb-2 bg-gray-300/50" />
                      <Skeleton className="w-20 h-4 rounded bg-purple-400/30" />
                    </div>
                    <Skeleton className="w-12 h-6 rounded bg-yellow-400/30" />
                  </div>
                  <Skeleton className="w-full h-4 rounded mb-1 bg-gray-400/30" />
                  <Skeleton className="w-3/4 h-4 rounded mb-4 bg-gray-400/30" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="w-24 h-6 rounded bg-green-500/20" />
                    <Skeleton className="w-16 h-8 rounded bg-purple-500/30" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CollaborationsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Skeleton className="w-56 h-8 rounded mb-2 bg-gray-300/50" />
          <Skeleton className="w-80 h-5 rounded bg-gray-400/30" />
        </div>
        <Skeleton className="w-32 h-10 rounded bg-blue-500/30" />
      </div>

      {/* Status Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-blue-500/20">
            <CardBody className="p-6 text-center">
              <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4 bg-blue-500/30" />
              <Skeleton className="w-24 h-6 rounded mb-2 mx-auto bg-gray-300/50" />
              <Skeleton className="w-16 h-8 rounded mx-auto bg-blue-400/40" />
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Collaborations List Skeleton */}
      <div className="space-y-4">
        <Skeleton className="w-40 h-6 rounded bg-gray-300/50" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full bg-purple-500/30" />
                  <div>
                    <Skeleton className="w-48 h-5 rounded mb-2 bg-gray-300/50" />
                    <Skeleton className="w-32 h-4 rounded bg-gray-400/30" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="w-20 h-6 rounded-full bg-green-500/20" />
                  <Skeleton className="w-16 h-8 rounded bg-blue-500/30" />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BillingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="text-center">
        <Skeleton className="w-48 h-8 rounded mx-auto mb-2 bg-gray-300/50" />
        <Skeleton className="w-80 h-5 rounded mx-auto bg-gray-400/30" />
      </div>

      {/* Usage Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/20">
            <CardBody className="p-6 text-center">
              <Skeleton className="w-32 h-5 rounded mb-2 mx-auto bg-gray-300/50" />
              <Skeleton className="w-20 h-8 rounded mx-auto bg-green-400/40" />
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Usage Chart Skeleton */}
      <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20">
        <CardHeader>
          <Skeleton className="w-40 h-6 rounded bg-gray-300/50" />
        </CardHeader>
        <CardBody>
          <Skeleton className="w-full h-64 rounded bg-gradient-to-br from-green-900/20 to-blue-900/20" />
        </CardBody>
      </Card>

      {/* Invoice History Skeleton */}
      <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20">
        <CardHeader>
          <Skeleton className="w-32 h-6 rounded bg-gray-300/50" />
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-700/30">
                <div>
                  <Skeleton className="w-32 h-5 rounded mb-1 bg-gray-300/50" />
                  <Skeleton className="w-20 h-4 rounded bg-gray-400/30" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="w-16 h-5 rounded bg-green-400/30" />
                  <Skeleton className="w-20 h-8 rounded bg-purple-500/30" />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header and Settings Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Skeleton className="w-40 h-8 rounded mb-2 bg-gray-300/50" />
          <Skeleton className="w-64 h-5 rounded bg-gray-400/30" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-28 h-10 rounded bg-blue-500/30" />
          <Skeleton className="w-24 h-10 rounded bg-purple-500/30" />
        </div>
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="flex space-x-2 bg-gray-900/50 p-1 rounded-lg">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="w-20 h-8 rounded bg-purple-500/30" />
        ))}
      </div>

      {/* Notifications List Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            variants={{
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 }
            }}
            initial="initial"
            animate="animate"
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20">
              <CardBody className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-10 h-10 rounded-full bg-purple-500/30 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Skeleton className="w-48 h-5 rounded mb-2 bg-gray-300/50" />
                        <Skeleton className="w-full h-4 rounded mb-1 bg-gray-400/30" />
                        <Skeleton className="w-3/4 h-4 rounded mb-2 bg-gray-400/30" />
                        <Skeleton className="w-24 h-3 rounded bg-gray-500/30" />
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Skeleton className="w-8 h-8 rounded bg-blue-500/30" />
                        <Skeleton className="w-8 h-8 rounded bg-red-500/30" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Load More Button Skeleton */}
      <div className="text-center">
        <Skeleton className="w-32 h-10 rounded mx-auto bg-purple-500/30" />
      </div>
    </div>
  );
}