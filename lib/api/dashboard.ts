// Dashboard API functions for server-side data fetching

import type { DashboardStats } from '@/types/dashboard';

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // In a real implementation, this would fetch from Supabase
    // For now, return mock data with realistic delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      gamesCreated: 15,
      totalPlays: 12847,
      communityFollowers: 142,
      achievementsUnlocked: 12,
      totalAssets: 45,
      totalCollaborations: 8,
      creditsUsed: 1200,
      creditsRemaining: 5800,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw new Error('Failed to fetch dashboard statistics');
  }
}

export default {
  getDashboardStats,
};