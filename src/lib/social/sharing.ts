/**
 * Social Sharing Utilities
 * 
 * Utilities for sharing games, achievements, and activities to external
 * social platforms like Twitter, Discord, and other social networks.
 */

import { Game, Achievement, Challenge } from '@/types/social';

// Social platform configurations
const SOCIAL_PLATFORMS = {
  twitter: {
    name: 'Twitter',
    color: '#1DA1F2',
    icon: '𝕏',
    shareUrl: 'https://twitter.com/intent/tweet',
    maxLength: 280
  },
  discord: {
    name: 'Discord',
    color: '#5865F2',
    icon: '🎮',
    webhookSupport: true
  },
  facebook: {
    name: 'Facebook',
    color: '#1877F2',
    icon: '📘',
    shareUrl: 'https://www.facebook.com/sharer/sharer.php',
    maxLength: 63206
  },
  reddit: {
    name: 'Reddit',
    color: '#FF4500',
    icon: '🔴',
    shareUrl: 'https://reddit.com/submit',
    maxLength: 300
  },
  linkedin: {
    name: 'LinkedIn',
    color: '#0A66C2',
    icon: '💼',
    shareUrl: 'https://www.linkedin.com/sharing/share-offsite/',
    maxLength: 1300
  }
} as const;

export type SocialPlatform = keyof typeof SOCIAL_PLATFORMS;

// Base interface for shareable content
interface ShareableContent {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  hashtags?: string[];
}

// Game sharing utilities
export class GameSharing {
  static generateGameShareContent(game: Game, creator: { username: string; display_name: string }): ShareableContent {
    const gameUrl = `${process.env.NEXT_PUBLIC_APP_URL}/games/${game.id}`;
    
    return {
      title: `Check out "${game.title}" by ${creator.display_name || creator.username}`,
      description: game.description || 'An amazing pixel art game created with GameGen!',
      url: gameUrl,
      imageUrl: game.thumbnail_url || game.cover_image_url || undefined,
      hashtags: ['GameGen', 'PixelArt', 'IndieGame', ...(game.tags || [])]
    };
  }

  static shareToTwitter(content: ShareableContent): string {
    const text = this.truncateText(
      `${content.title}\n\n${content.description}`,
      SOCIAL_PLATFORMS.twitter.maxLength - content.url.length - 20 // Reserve space for hashtags
    );
    
    const hashtags = content.hashtags?.slice(0, 3).join(' ') || '';
    const tweet = `${text}\n\n${content.url}\n\n${hashtags}`;
    
    return `${SOCIAL_PLATFORMS.twitter.shareUrl}?text=${encodeURIComponent(tweet)}`;
  }

  static shareToFacebook(content: ShareableContent): string {
    const params = new URLSearchParams({
      u: content.url,
      quote: `${content.title} - ${content.description}`
    });
    
    return `${SOCIAL_PLATFORMS.facebook.shareUrl}?${params.toString()}`;
  }

  static shareToReddit(content: ShareableContent): string {
    const params = new URLSearchParams({
      url: content.url,
      title: content.title
    });
    
    return `${SOCIAL_PLATFORMS.reddit.shareUrl}?${params.toString()}`;
  }

  static shareToLinkedIn(content: ShareableContent): string {
    const params = new URLSearchParams({
      url: content.url
    });
    
    return `${SOCIAL_PLATFORMS.linkedin.shareUrl}?${params.toString()}`;
  }

  static generateDiscordWebhookPayload(content: ShareableContent) {
    return {
      embeds: [{
        title: content.title,
        description: content.description,
        url: content.url,
        color: 0x3B82F6, // GameGen brand color
        image: content.imageUrl ? { url: content.imageUrl } : undefined,
        footer: {
          text: 'Created with GameGen',
          icon_url: `${process.env.NEXT_PUBLIC_APP_URL}/icon.png`
        },
        timestamp: new Date().toISOString()
      }]
    };
  }

  private static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}

// Achievement sharing utilities
export class AchievementSharing {
  static generateAchievementShareContent(
    achievement: Achievement,
    user: { username: string; display_name: string }
  ): ShareableContent {
    const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/profile/${user.username}`;
    
    return {
      title: `🏆 Achievement Unlocked!`,
      description: `${user.display_name || user.username} just earned "${achievement.name}" on GameGen! ${achievement.description}`,
      url: profileUrl,
      imageUrl: achievement.icon_url || undefined,
      hashtags: ['GameGen', 'Achievement', 'Gaming', 'PixelArt']
    };
  }

  static shareAchievementToTwitter(achievement: Achievement, user: { username: string; display_name: string }): string {
    const content = this.generateAchievementShareContent(achievement, user);
    return GameSharing.shareToTwitter(content);
  }

  static generateAchievementDiscordPayload(
    achievement: Achievement,
    user: { username: string; display_name: string; avatar_url?: string }
  ) {
    const rarityColors = {
      common: 0x6B7280,
      rare: 0x3B82F6,
      epic: 0x8B5CF6,
      legendary: 0xF59E0B
    };

    return {
      embeds: [{
        title: '🏆 Achievement Unlocked!',
        description: `**${achievement.name}**\n${achievement.description}`,
        color: rarityColors[achievement.rarity],
        author: {
          name: user.display_name || user.username,
          icon_url: user.avatar_url
        },
        thumbnail: achievement.icon_url ? { url: achievement.icon_url } : undefined,
        fields: [
          {
            name: 'Points Earned',
            value: achievement.points.toString(),
            inline: true
          },
          {
            name: 'Rarity',
            value: achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1),
            inline: true
          }
        ],
        footer: {
          text: 'GameGen Achievement System',
          icon_url: `${process.env.NEXT_PUBLIC_APP_URL}/icon.png`
        },
        timestamp: new Date().toISOString()
      }]
    };
  }
}

// Challenge sharing utilities
export class ChallengeSharing {
  static generateChallengeShareContent(challenge: Challenge): ShareableContent {
    const challengeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/challenges/${challenge.id}`;
    
    return {
      title: `🎯 Join the "${challenge.title}" Challenge!`,
      description: challenge.short_description || challenge.description.substring(0, 200) + '...',
      url: challengeUrl,
      imageUrl: challenge.banner_url || challenge.thumbnail_url || undefined,
      hashtags: ['GameGen', 'Challenge', 'GameJam', ...(challenge.tags || [])]
    };
  }

  static shareChallengeToTwitter(challenge: Challenge): string {
    const content = this.generateChallengeShareContent(challenge);
    return GameSharing.shareToTwitter(content);
  }

  static generateChallengeDiscordPayload(challenge: Challenge) {
    const statusColors = {
      draft: 0x6B7280,
      upcoming: 0x3B82F6,
      active: 0x10B981,
      voting: 0xF59E0B,
      completed: 0x8B5CF6,
      cancelled: 0xEF4444
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return {
      embeds: [{
        title: `🎯 ${challenge.title}`,
        description: challenge.short_description || challenge.description.substring(0, 300) + '...',
        color: statusColors[challenge.status],
        url: `${process.env.NEXT_PUBLIC_APP_URL}/challenges/${challenge.id}`,
        image: challenge.banner_url ? { url: challenge.banner_url } : undefined,
        thumbnail: challenge.thumbnail_url ? { url: challenge.thumbnail_url } : undefined,
        fields: [
          {
            name: 'Type',
            value: challenge.challenge_type.replace('_', ' ').toUpperCase(),
            inline: true
          },
          {
            name: 'Difficulty',
            value: challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1),
            inline: true
          },
          {
            name: 'Status',
            value: challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1),
            inline: true
          },
          {
            name: 'Starts',
            value: formatDate(challenge.starts_at),
            inline: true
          },
          {
            name: 'Ends',
            value: formatDate(challenge.ends_at),
            inline: true
          },
          {
            name: 'Participants',
            value: challenge.participant_count.toString(),
            inline: true
          }
        ],
        footer: {
          text: 'GameGen Challenge System',
          icon_url: `${process.env.NEXT_PUBLIC_APP_URL}/icon.png`
        }
      }]
    };
  }
}

// Generic social sharing utility
export class SocialSharing {
  static async copyToClipboard(content: ShareableContent): Promise<boolean> {
    try {
      const shareText = `${content.title}\n\n${content.description}\n\n${content.url}`;
      await navigator.clipboard.writeText(shareText);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  static async shareViaWebAPI(content: ShareableContent): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: content.description,
          url: content.url
        });
        return true;
      } catch (error) {
        console.error('Failed to share via Web API:', error);
        return false;
      }
    }
    return false;
  }

  static generateMetaTags(content: ShareableContent) {
    return {
      title: content.title,
      description: content.description,
      'og:title': content.title,
      'og:description': content.description,
      'og:url': content.url,
      'og:image': content.imageUrl || `${process.env.NEXT_PUBLIC_APP_URL}/og-default.png`,
      'og:type': 'website',
      'twitter:card': 'summary_large_image',
      'twitter:title': content.title,
      'twitter:description': content.description,
      'twitter:image': content.imageUrl || `${process.env.NEXT_PUBLIC_APP_URL}/og-default.png`
    };
  }

  static async sendDiscordWebhook(webhookUrl: string, payload: any): Promise<boolean> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send Discord webhook:', error);
      return false;
    }
  }

  static getPlatformInfo(platform: SocialPlatform) {
    return SOCIAL_PLATFORMS[platform];
  }

  static getAllPlatforms() {
    return Object.keys(SOCIAL_PLATFORMS) as SocialPlatform[];
  }
}

// Export individual sharing classes and main utility
export { SOCIAL_PLATFORMS };
export type { ShareableContent };