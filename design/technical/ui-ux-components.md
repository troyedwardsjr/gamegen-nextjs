# GameGen Platform: UI/UX Technical Specifications

**Version**: 1.0  
**Date**: 2025-09-05  
**Design System**: HeroUI with glassmorphic theme  
**Framework**: NextJS App Router + React 18.3+  
**Styling**: TailwindCSS 4.1+ with custom design tokens  

## Design System Overview

GameGen's interface embodies a glassmorphic design philosophy that feels both modern and approachable, making advanced game creation tools accessible to users of all skill levels. The design system balances visual polish with functional clarity, ensuring creative workflows remain uninterrupted.

### Design Principles
- **Clarity Over Complexity**: Every interface element serves a clear purpose
- **Progressive Disclosure**: Advanced features appear when needed
- **Contextual Assistance**: AI-powered help integrated throughout
- **Responsive First**: Seamless experience across all devices
- **Accessibility**: WCAG 2.1 AA compliance as minimum standard

### Visual Language

#### Glassmorphic Design System
```typescript
// Design tokens for glassmorphic UI
const glassmorphicTokens = {
  // Glass surface effects
  surfaces: {
    primary: 'backdrop-blur-md bg-white/10 border border-white/20',
    secondary: 'backdrop-blur-sm bg-white/5 border border-white/10',
    elevated: 'backdrop-blur-lg bg-white/15 border border-white/25 shadow-2xl',
    input: 'backdrop-blur-sm bg-white/8 border border-white/15 focus:bg-white/12'
  },
  
  // Color palette with transparency support
  colors: {
    primary: {
      50: 'rgba(147, 51, 234, 0.05)',
      100: 'rgba(147, 51, 234, 0.1)',
      500: 'rgba(147, 51, 234, 0.8)',
      600: 'rgba(147, 51, 234, 0.9)',
      900: 'rgba(147, 51, 234, 1)'
    },
    glass: {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.15)',
      strong: 'rgba(255, 255, 255, 0.25)'
    }
  },
  
  // Animation presets
  animations: {
    glassHover: 'transition-all duration-300 hover:backdrop-blur-lg hover:bg-white/20',
    smoothTransform: 'transition-transform duration-200 ease-out',
    fadeIn: 'animate-in fade-in-0 duration-300'
  }
};
```

#### Typography Scale
```css
/* Custom font scale for game creation context */
.font-display {
  @apply font-bold tracking-tight;
  font-size: clamp(1.5rem, 4vw, 3rem);
}

.font-game-title {
  @apply font-mono font-bold text-lg tracking-wide;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.font-code {
  @apply font-mono text-sm leading-relaxed;
  background: rgba(0, 0, 0, 0.1);
}

.font-chat {
  @apply text-sm leading-relaxed text-gray-700 dark:text-gray-300;
}
```

## Component Architecture

### Core Component Hierarchy

```
GameGenApp
├── GlobalProviders
│   ├── ThemeProvider (next-themes)
│   ├── SupabaseProvider
│   ├── UserProvider
│   └── ToastProvider
├── AppLayout
│   ├── Navigation
│   │   ├── MainNavbar
│   │   ├── UserMenu
│   │   └── MobileMenu
│   ├── Sidebar (conditional)
│   └── MainContent
├── Page Components
│   ├── LandingPage
│   ├── Dashboard
│   ├── GameCreator
│   ├── GameGallery
│   └── UserProfile
└── Global UI Components
    ├── Modal System
    ├── Toast Notifications
    ├── Loading States
    └── Error Boundaries
```

### Layout System Implementation

#### Responsive Grid System
```typescript
// components/layout/ResponsiveGrid.tsx
interface ResponsiveGridProps {
  children: React.ReactNode;
  variant: 'landing' | 'dashboard' | 'creator' | 'gallery';
  className?: string;
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({ 
  children, 
  variant, 
  className 
}) => {
  const gridClasses = {
    landing: 'grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto px-4',
    dashboard: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6',
    creator: 'grid grid-cols-1 lg:grid-cols-[300px_1fr_280px] gap-4 h-full',
    gallery: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
  };

  return (
    <div className={cn(gridClasses[variant], className)}>
      {children}
    </div>
  );
};
```

#### Glassmorphic Container Component
```typescript
// components/ui/GlassContainer.tsx
interface GlassContainerProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'elevated';
  rounded?: 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}

const GlassContainer: React.FC<GlassContainerProps> = ({
  children,
  variant = 'primary',
  rounded = 'lg',
  padding = 'md',
  className
}) => {
  const variants = {
    primary: 'backdrop-blur-md bg-white/10 border border-white/20',
    secondary: 'backdrop-blur-sm bg-white/5 border border-white/10',
    elevated: 'backdrop-blur-lg bg-white/15 border border-white/25 shadow-2xl'
  };

  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl'
  };

  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <div className={cn(
      variants[variant],
      roundedClasses[rounded],
      paddingClasses[padding],
      'transition-all duration-300',
      className
    )}>
      {children}
    </div>
  );
};
```

## Game Creator Interface

### Three-Panel Layout System
```typescript
// components/creator/GameCreatorLayout.tsx
const GameCreatorLayout: React.FC = () => {
  const [leftPanelWidth, setLeftPanelWidth] = useState(300);
  const [rightPanelWidth, setRightPanelWidth] = useState(280);
  
  return (
    <div className="h-screen flex bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Left Panel - Chat Interface */}
      <ResizablePanel
        initialWidth={leftPanelWidth}
        minWidth={250}
        maxWidth={400}
        onResize={setLeftPanelWidth}
      >
        <ChatInterface />
      </ResizablePanel>
      
      {/* Center Panel - Editor Tabs */}
      <div className="flex-1 flex flex-col">
        <EditorTabBar />
        <EditorContent />
      </div>
      
      {/* Right Panel - Asset Library */}
      <ResizablePanel
        initialWidth={rightPanelWidth}
        minWidth={240}
        maxWidth={400}
        position="right"
        onResize={setRightPanelWidth}
      >
        <AssetLibrary />
      </ResizablePanel>
    </div>
  );
};
```

### Chat Interface Component
```typescript
// components/creator/ChatInterface.tsx
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'game_generation' | 'asset_request' | 'code_suggestion';
  metadata?: {
    credits_used?: number;
    generation_id?: string;
    attachments?: string[];
  };
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [credits, setCredits] = useState(85);

  return (
    <GlassContainer className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 pb-3 mb-4">
        <h2 className="font-semibold text-white/90">Vibe Coding Chat</h2>
        <div className="flex items-center gap-2 mt-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-white/70">{credits} credits</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 mb-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isGenerating && <GeneratingIndicator />}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="space-y-3">
        <SuggestionPills onSelect={(suggestion) => setInput(suggestion)} />
        <div className="relative">
          <Textarea
            placeholder="Describe your game idea..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[100px] backdrop-blur-sm bg-white/8 border-white/15 resize-none"
            onKeyDown={handleKeyDown}
          />
          <Button
            className="absolute bottom-2 right-2"
            size="sm"
            onClick={handleSendMessage}
            disabled={!input.trim() || isGenerating}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </GlassContainer>
  );
};
```

### Editor Tab System
```typescript
// components/creator/EditorTabs.tsx
type EditorTab = 'play' | 'map' | 'code' | 'settings';

interface EditorTabsProps {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  gameLoaded: boolean;
}

const EditorTabs: React.FC<EditorTabsProps> = ({
  activeTab,
  onTabChange,
  gameLoaded
}) => {
  const tabs = [
    { id: 'play', label: 'Live Play', icon: Play, disabled: !gameLoaded },
    { id: 'map', label: 'Map Editor', icon: Grid, disabled: !gameLoaded },
    { id: 'code', label: 'Code Editor', icon: Code, disabled: !gameLoaded },
    { id: 'settings', label: 'Settings', icon: Settings, disabled: false }
  ] as const;

  return (
    <div className="flex border-b border-white/10 bg-black/20">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => !tab.disabled && onTabChange(tab.id as EditorTab)}
          disabled={tab.disabled}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all',
            'hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed',
            activeTab === tab.id
              ? 'text-white border-b-2 border-purple-400 bg-white/5'
              : 'text-white/70'
          )}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );
};
```

### Asset Library Component
```typescript
// components/creator/AssetLibrary.tsx
const AssetLibrary: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('all');
  const [assets, setAssets] = useState<Asset[]>([]);
  
  const categories = [
    { id: 'all', label: 'All Assets', icon: Grid3X3 },
    { id: 'sprites', label: 'Sprites', icon: User },
    { id: 'backgrounds', label: 'Backgrounds', icon: Image },
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'effects', label: 'Effects', icon: Sparkles }
  ];

  return (
    <GlassContainer className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 pb-3 mb-4">
        <h2 className="font-semibold text-white/90 mb-3">Asset Library</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 backdrop-blur-sm bg-white/8 border-white/15"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="mb-4">
        <ScrollArea orientation="horizontal" className="w-full whitespace-nowrap">
          <div className="flex gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(category.id as AssetCategory)}
                className="shrink-0"
              >
                <category.icon className="w-4 h-4 mr-2" />
                {category.label}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Asset Grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-2 gap-3">
          {assets.map((asset) => (
            <AssetCard 
              key={asset.id} 
              asset={asset} 
              onUse={handleUseAsset}
              onPreview={handlePreviewAsset}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Generate Button */}
      <div className="border-t border-white/10 pt-4 mt-4">
        <Button className="w-full" onClick={handleGenerateAsset}>
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Asset
        </Button>
      </div>
    </GlassContainer>
  );
};
```

## Landing Page Components

### Hero Section
```typescript
// components/landing/HeroSection.tsx
const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <PixelArtBackground />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="font-display text-white mb-6">
            Create Games with
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Natural Language
            </span>
          </h1>
          
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Transform your ideas into playable pixel art games using AI. 
            No coding required, infinite creativity enabled.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8 py-4">
              Start Creating
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            
            <Button variant="ghost" size="lg" className="px-8 py-4 text-white border-white/20">
              Watch Demo
              <Play className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
```

### Feature Showcase
```typescript
// components/landing/FeatureShowcase.tsx
const features = [
  {
    title: "Natural Language Creation",
    description: "Describe your game in plain English and watch it come to life",
    icon: MessageCircle,
    demo: <ChatDemo />
  },
  {
    title: "AI-Generated Assets",
    description: "Beautiful pixel art sprites and audio created specifically for your game",
    icon: Sparkles,
    demo: <AssetGenerationDemo />
  },
  {
    title: "Real-time Collaboration",
    description: "Create games together with friends, family, or classmates",
    icon: Users,
    demo: <CollaborationDemo />
  }
];

const FeatureShowcase: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  
  return (
    <section className="py-20 bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Everything You Need to Create
          </h2>
          <p className="text-xl text-white/70">
            Powerful tools designed for creators of all skill levels
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Feature List */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                feature={feature}
                isActive={activeFeature === index}
                onClick={() => setActiveFeature(index)}
              />
            ))}
          </div>
          
          {/* Demo Area */}
          <div className="relative">
            <GlassContainer variant="elevated" className="h-96">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  {features[activeFeature].demo}
                </motion.div>
              </AnimatePresence>
            </GlassContainer>
          </div>
        </div>
      </div>
    </section>
  );
};
```

## Responsive Design System

### Breakpoint Strategy
```typescript
// utils/responsive.ts
export const breakpoints = {
  sm: '640px',
  md: '768px', 
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState<keyof typeof breakpoints>('sm');
  
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= 1536) setBreakpoint('2xl');
      else if (width >= 1280) setBreakpoint('xl');
      else if (width >= 1024) setBreakpoint('lg');
      else if (width >= 768) setBreakpoint('md');
      else setBreakpoint('sm');
    };
    
    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);
  
  return {
    breakpoint,
    isMobile: breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: ['lg', 'xl', '2xl'].includes(breakpoint)
  };
};
```

### Mobile-First Game Creator
```typescript
// components/creator/MobileGameCreator.tsx
const MobileGameCreator: React.FC = () => {
  const [activePanel, setActivePanel] = useState<'chat' | 'editor' | 'assets'>('editor');
  
  return (
    <div className="h-screen flex flex-col">
      {/* Mobile Navigation */}
      <div className="flex border-b border-white/10 bg-black/40 backdrop-blur-sm">
        {[
          { id: 'chat', label: 'Chat', icon: MessageCircle },
          { id: 'editor', label: 'Editor', icon: Edit },
          { id: 'assets', label: 'Assets', icon: Package }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePanel(tab.id as any)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 text-sm',
              activePanel === tab.id 
                ? 'text-purple-400 border-b-2 border-purple-400' 
                : 'text-white/70'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Panel Content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePanel}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-full"
          >
            {activePanel === 'chat' && <MobileChatInterface />}
            {activePanel === 'editor' && <MobileGameEditor />}
            {activePanel === 'assets' && <MobileAssetLibrary />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
```

## Accessibility Implementation

### Keyboard Navigation
```typescript
// hooks/useKeyboardNavigation.ts
export const useKeyboardNavigation = (items: any[], onSelect: (item: any) => void) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => (prev + 1) % items.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => (prev - 1 + items.length) % items.length);
          break;
        case 'Enter':
          event.preventDefault();
          onSelect(items[selectedIndex]);
          break;
        case 'Escape':
          event.preventDefault();
          setSelectedIndex(0);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onSelect]);
  
  return { selectedIndex, setSelectedIndex };
};
```

### Screen Reader Support
```typescript
// components/ui/ScreenReaderOnly.tsx
const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only">
    {children}
  </span>
);

// Usage in components
<Button>
  <Play className="w-4 h-4" />
  <ScreenReaderOnly>Play game</ScreenReaderOnly>
</Button>
```

This comprehensive UI/UX technical specification provides the foundation for building GameGen's intuitive, accessible, and visually striking interface that makes game creation approachable for users of all skill levels.