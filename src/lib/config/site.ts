export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "GameGen",
  description:
    "AI-powered pixel art game creation platform. Create games with vibe coding, pixel art assets, and no-code development.",
  url: "https://gamegen.app",
  ogImage: "https://gamegen.app/og.jpg",
  author: {
    name: "GameGen Team",
    url: "https://gamegen.app",
  },
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Explore",
      href: "/explore",
    },
    {
      label: "Create",
      href: "/create",
      requiresAuth: true,
    },
    {
      label: "Templates",
      href: "/templates",
    },
    {
      label: "Pricing",
      href: "/pricing",
    },
    {
      label: "Blog",
      href: "/blog",
    },
  ],
  navMenuItems: [
    {
      label: "Dashboard",
      href: "/dashboard",
      requiresAuth: true,
    },
    {
      label: "Projects",
      href: "/projects",
      requiresAuth: true,
    },
    {
      label: "Games",
      href: "/games",
      requiresAuth: true,
    },
    {
      label: "Assets",
      href: "/assets",
      requiresAuth: true,
    },
    {
      label: "Templates",
      href: "/templates",
    },
    {
      label: "Profile",
      href: "/profile",
      requiresAuth: true,
    },
    {
      label: "Settings",
      href: "/settings",
      requiresAuth: true,
    },
    {
      label: "Billing",
      href: "/billing",
      requiresAuth: true,
    },
    {
      label: "Help & Support",
      href: "/support",
    },
    {
      label: "Logout",
      href: "/logout",
      requiresAuth: true,
    },
  ],
  links: {
    github: "https://github.com/gamegen-app",
    twitter: "https://twitter.com/gamegen_app",
    discord: "https://discord.gg/gamegen",
    docs: "https://docs.gamegen.app",
    support: "https://support.gamegen.app",
    sponsor: "https://github.com/sponsors/gamegen-app",
  },
  gameTypes: [
    {
      id: "bullet-hell",
      name: "Bullet Hell",
      description: "Fast-paced action games with intense shooting mechanics",
      icon: "🎯",
    },
    {
      id: "rpg",
      name: "RPG",
      description:
        "Role-playing games with character progression and storytelling",
      icon: "⚔️",
    },
    {
      id: "action-adventure",
      name: "Action Adventure",
      description: "Exploration-based games with action elements",
      icon: "🏃‍♂️",
    },
    {
      id: "team-deathmatch",
      name: "Team Deathmatch",
      description: "Multiplayer competitive shooting games",
      icon: "💥",
    },
    {
      id: "platformer",
      name: "Platformer",
      description: "Jump-based games with level progression",
      icon: "🦘",
    },
    {
      id: "puzzle",
      name: "Puzzle",
      description: "Logic-based games that challenge problem-solving skills",
      icon: "🧩",
    },
  ],
  subscriptionTiers: [
    {
      id: "free",
      name: "Free",
      description: "Get started with basic game creation",
      features: [
        "2 games maximum",
        "Platform publishing only",
        "GameGen splash screen",
        "Community templates",
        "Basic asset library",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      description: "For serious game creators",
      price: "$19/month",
      features: [
        "Unlimited games",
        "Export to desktop/mobile",
        "No splash screen",
        "Premium templates",
        "Advanced asset library",
        "AI-powered suggestions",
      ],
    },
    {
      id: "max",
      name: "Max",
      description: "For professional game studios",
      price: "$49/month",
      features: [
        "Everything in Pro",
        "White-label publishing",
        "Advanced analytics",
        "Team collaboration",
        "Priority support",
        "Custom integrations",
      ],
    },
  ],
  features: {
    vibeCoding: {
      name: "Vibe Coding Chat",
      description:
        "Describe your game ideas in natural language and watch them come to life",
      icon: "💭",
    },
    pixelArt: {
      name: "Pixel Art Assets",
      description:
        "Extensive library of pixel art sprites, tiles, and animations",
      icon: "🎨",
    },
    gameEngine: {
      name: "Toxoid Game Engine",
      description:
        "Powerful Rust-based WASM game engine with JavaScript scripting",
      icon: "⚡",
    },
    aiAssistant: {
      name: "AI Game Assistant",
      description: "Claude-powered assistance for game design and development",
      icon: "🤖",
    },
    crossPlatform: {
      name: "Cross-Platform Export",
      description: "Publish to web, desktop, and mobile platforms",
      icon: "📱",
    },
    noCode: {
      name: "No-Code Development",
      description: "Create games without traditional programming knowledge",
      icon: "🚀",
    },
  },
  footer: {
    sections: [
      {
        title: "Product",
        links: [
          { name: "Features", href: "/features" },
          { name: "Pricing", href: "/pricing" },
          { name: "Templates", href: "/templates" },
          { name: "Examples", href: "/examples" },
        ],
      },
      {
        title: "Resources",
        links: [
          { name: "Documentation", href: "/docs" },
          { name: "Tutorials", href: "/tutorials" },
          { name: "Blog", href: "/blog" },
          { name: "Community", href: "/community" },
        ],
      },
      {
        title: "Company",
        links: [
          { name: "About", href: "/about" },
          { name: "Careers", href: "/careers" },
          { name: "Press", href: "/press" },
          { name: "Contact", href: "/contact" },
        ],
      },
      {
        title: "Legal",
        links: [
          { name: "Privacy Policy", href: "/privacy" },
          { name: "Terms of Service", href: "/terms" },
          { name: "Cookie Policy", href: "/cookies" },
        ],
      },
    ],
  },
};
