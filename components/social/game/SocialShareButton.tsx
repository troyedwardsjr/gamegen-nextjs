"use client";

import React from "react";
import { Button } from "@heroui/button";
import { 
  Share2, 
  Twitter, 
  Facebook, 
  MessageCircle,
  Copy,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

type SocialPlatform = "twitter" | "facebook" | "discord" | "linkedin" | "reddit" | "copy";

interface SocialShareData {
  url: string;
  title: string;
  text?: string;
  hashtags?: string[];
  via?: string;
}

interface SocialShareButtonProps {
  platform: SocialPlatform;
  game?: {
    id: string;
    title: string;
    description?: string | null;
    tags?: string[] | null;
  };
  shareData?: SocialShareData;
  variant?: "default" | "flat" | "ghost" | "solid";
  size?: "sm" | "md" | "lg";
  isIconOnly?: boolean;
  className?: string;
}

const PLATFORM_CONFIG = {
  twitter: {
    name: "Twitter",
    icon: Twitter,
    color: "#1DA1F2",
    baseUrl: "https://twitter.com/intent/tweet",
  },
  facebook: {
    name: "Facebook", 
    icon: Facebook,
    color: "#1877F2",
    baseUrl: "https://www.facebook.com/sharer/sharer.php",
  },
  discord: {
    name: "Discord",
    icon: MessageCircle,
    color: "#5865F2",
    baseUrl: null, // Custom handling for Discord
  },
  linkedin: {
    name: "LinkedIn",
    icon: ExternalLink,
    color: "#0A66C2",
    baseUrl: "https://www.linkedin.com/sharing/share-offsite/",
  },
  reddit: {
    name: "Reddit",
    icon: ExternalLink,
    color: "#FF4500",
    baseUrl: "https://reddit.com/submit",
  },
  copy: {
    name: "Copy Link",
    icon: Copy,
    color: "#6B7280",
    baseUrl: null,
  },
};

export function SocialShareButton({
  platform,
  game,
  shareData,
  variant = "flat",
  size = "md",
  isIconOnly = false,
  className,
}: SocialShareButtonProps) {
  const config = PLATFORM_CONFIG[platform];
  const IconComponent = config.icon;

  // Generate share data from game if not provided
  const getShareData = (): SocialShareData => {
    if (shareData) return shareData;
    
    if (game) {
      return {
        url: `${window.location.origin}/games/${game.id}`,
        title: game.title,
        text: game.description || `Check out "${game.title}" - a game I created on GameGen!`,
        hashtags: game.tags || ["GameGen", "IndieGame", "GameDev"],
      };
    }

    return {
      url: window.location.href,
      title: "GameGen - Create Amazing Games",
      text: "Create and share amazing games with GameGen!",
      hashtags: ["GameGen", "GameDev"],
    };
  };

  const buildShareUrl = (data: SocialShareData): string => {
    switch (platform) {
      case "twitter":
        const twitterParams = new URLSearchParams({
          url: data.url,
          text: `${data.text}\n\n${data.title}`,
          hashtags: data.hashtags?.join(",") || "",
          via: data.via || "GameGenApp",
        });
        return `${config.baseUrl}?${twitterParams}`;

      case "facebook":
        const facebookParams = new URLSearchParams({
          u: data.url,
          quote: `${data.title}\n\n${data.text}`,
        });
        return `${config.baseUrl}?${facebookParams}`;

      case "linkedin":
        const linkedinParams = new URLSearchParams({
          url: data.url,
          title: data.title,
          summary: data.text || "",
        });
        return `${config.baseUrl}?${linkedinParams}`;

      case "reddit":
        const redditParams = new URLSearchParams({
          url: data.url,
          title: data.title,
        });
        return `${config.baseUrl}?${redditParams}`;

      default:
        return data.url;
    }
  };

  const handleShare = async () => {
    const data = getShareData();

    if (platform === "copy") {
      try {
        await navigator.clipboard.writeText(data.url);
        toast.success("Link copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy link");
      }
      return;
    }

    if (platform === "discord") {
      // For Discord, we'll copy a formatted message
      const discordMessage = `🎮 **${data.title}**\n\n${data.text}\n\n${data.url}`;
      try {
        await navigator.clipboard.writeText(discordMessage);
        toast.success("Discord message copied! Paste it in your server.");
      } catch (error) {
        toast.error("Failed to copy Discord message");
      }
      return;
    }

    // For other platforms, open in new window
    const shareUrl = buildShareUrl(data);
    const popup = window.open(
      shareUrl,
      "share",
      "width=600,height=400,scrollbars=yes,resizable=yes"
    );

    if (!popup) {
      toast.error("Popup blocked. Please allow popups for sharing.");
      return;
    }

    // Track sharing (could be enhanced with analytics)
    if (game) {
      console.log(`Shared game ${game.id} on ${platform}`);
    }
  };

  // Use native Web Share API if available and on mobile
  const useNativeShare = typeof navigator !== "undefined" && 
    navigator.share && 
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleNativeShare = async () => {
    if (!useNativeShare) return handleShare();

    const data = getShareData();
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      });
    } catch (error) {
      // Fallback to regular sharing if native sharing fails
      handleShare();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      color="default"
      className={`hover:scale-105 transition-transform ${className}`}
      startContent={!isIconOnly ? <IconComponent size={18} /> : undefined}
      isIconOnly={isIconOnly}
      onPress={useNativeShare ? handleNativeShare : handleShare}
      style={{
        borderColor: config.color + "40",
        color: variant === "solid" ? "white" : config.color,
        backgroundColor: variant === "solid" ? config.color : "transparent",
      }}
    >
      {isIconOnly ? <IconComponent size={18} /> : config.name}
    </Button>
  );
}

// Static method for programmatic sharing
SocialShareButton.share = (
  platform: SocialPlatform,
  data: SocialShareData
): void => {
  const config = PLATFORM_CONFIG[platform];
  
  if (platform === "copy") {
    navigator.clipboard.writeText(data.url).then(
      () => toast.success("Link copied to clipboard!"),
      () => toast.error("Failed to copy link")
    );
    return;
  }

  if (platform === "discord") {
    const message = `🎮 **${data.title}**\n\n${data.text}\n\n${data.url}`;
    navigator.clipboard.writeText(message).then(
      () => toast.success("Discord message copied!"),
      () => toast.error("Failed to copy Discord message")
    );
    return;
  }

  // Build share URL based on platform
  let shareUrl = "";
  switch (platform) {
    case "twitter":
      const twitterParams = new URLSearchParams({
        url: data.url,
        text: `${data.text}\n\n${data.title}`,
        hashtags: data.hashtags?.join(",") || "",
        via: data.via || "GameGenApp",
      });
      shareUrl = `${config.baseUrl}?${twitterParams}`;
      break;

    case "facebook":
      const facebookParams = new URLSearchParams({
        u: data.url,
        quote: `${data.title}\n\n${data.text}`,
      });
      shareUrl = `${config.baseUrl}?${facebookParams}`;
      break;

    case "linkedin":
      const linkedinParams = new URLSearchParams({
        url: data.url,
        title: data.title,
        summary: data.text || "",
      });
      shareUrl = `${config.baseUrl}?${linkedinParams}`;
      break;

    case "reddit":
      const redditParams = new URLSearchParams({
        url: data.url,
        title: data.title,
      });
      shareUrl = `${config.baseUrl}?${redditParams}`;
      break;
  }

  if (shareUrl) {
    window.open(shareUrl, "share", "width=600,height=400,scrollbars=yes,resizable=yes");
  }
};

export default SocialShareButton;