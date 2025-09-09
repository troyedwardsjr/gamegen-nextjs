import React from 'react';
import DashboardServer from './dashboard-server';

interface DashboardPageProps {
  searchParams: Promise<{
    tab?: string;
    page?: string;
    search?: string;
    filters?: string;
    sort?: string;
  }>;
}

// Main dashboard page using server-side rendering
export default function DashboardPage({ searchParams }: DashboardPageProps) {
  return <DashboardServer searchParams={searchParams} />;
}