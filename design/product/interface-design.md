# Interface Design Patterns & Wireframes

## Design System Foundation

### Color Palette
```
Primary Colors:
- GameGen Blue: #2563EB (Primary actions, links)
- Creative Purple: #7C3AED (AI/creative features)
- Success Green: #059669 (Completions, success states)
- Warning Orange: #EA580C (Alerts, premium features)
- Error Red: #DC2626 (Errors, destructive actions)

Neutral Colors:
- Dark Gray: #1F2937 (Text, headers)
- Medium Gray: #6B7280 (Secondary text, borders)
- Light Gray: #F3F4F6 (Backgrounds, disabled states)
- White: #FFFFFF (Cards, input backgrounds)

Semantic Colors:
- AI Accent: Linear gradient (#7C3AED to #2563EB)
- Gaming Theme: #10B981 (Retro game aesthetics)
- Educational: #F59E0B (Learning content)
```

### Typography Scale
```
Headings:
- H1: 2.5rem (40px) - Bold - Page titles
- H2: 2rem (32px) - Bold - Section headers  
- H3: 1.5rem (24px) - Semibold - Subsections
- H4: 1.25rem (20px) - Semibold - Card titles
- H5: 1rem (16px) - Medium - Labels
- H6: 0.875rem (14px) - Medium - Small labels

Body Text:
- Large: 1.125rem (18px) - Regular - Important content
- Base: 1rem (16px) - Regular - Standard text
- Small: 0.875rem (14px) - Regular - Secondary info
- Tiny: 0.75rem (12px) - Regular - Captions, metadata

Font Family: Inter (Primary), JetBrains Mono (Code)
```

### Spacing System
```
Scale (rem units):
0.25 (4px), 0.5 (8px), 0.75 (12px), 1 (16px), 
1.5 (24px), 2 (32px), 2.5 (40px), 3 (48px),
4 (64px), 5 (80px), 6 (96px), 8 (128px)

Common Patterns:
- Button Padding: 0.75rem 1.5rem
- Card Padding: 1.5rem
- Section Spacing: 3rem
- Component Gap: 1rem
```

### Component Library

#### Buttons
```
Primary Button:
┌─────────────────────┐
│   Create Game       │ ← bg-blue-600, text-white, rounded-lg
│                     │   hover:bg-blue-700, px-6, py-3
└─────────────────────┘

Secondary Button:
┌─────────────────────┐
│   Save Draft        │ ← bg-gray-100, text-gray-900, border
│                     │   hover:bg-gray-200, rounded-lg
└─────────────────────┘

AI Action Button:
┌─────────────────────┐
│ ✨ Generate Assets  │ ← gradient bg, text-white, rounded-lg
│                     │   from-purple-600 to-blue-600
└─────────────────────┘
```

#### Form Elements
```
Input Field:
┌─────────────────────────────────┐
│ Game Title                      │ ← Floating label
│ Enter your game title...        │   border-gray-300, focus:border-blue
└─────────────────────────────────┘

Textarea:
┌─────────────────────────────────┐
│ Game Description                │ ← Auto-expanding
│ Describe your game idea in      │   min-height: 3 lines
│ natural language...             │
│                                 │
└─────────────────────────────────┘

Select Dropdown:
┌─────────────────────────────────┐
│ Genre ▼                         │ ← Custom styled select
│ ┌─────────────────────────────┐ │   with search capability
│ │ Platformer                  │ │
│ │ Puzzle                      │ │
│ │ Action                      │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

## Main Interface Layouts

### 1. Landing Page Wireframe

```
┌────────────────────────────────────────────────────────┐
│ [Logo] GameGen    Explore  Pricing  About    [Login]   │ ← Header
├────────────────────────────────────────────────────────┤
│                                                        │
│              Create Games with AI                      │ ← Hero Section
│         Turn ideas into playable games instantly       │   
│                                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ "Make a platformer game with a cat hero"       │   │ ← Interactive Demo
│  │                              [Generate] 🎮     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│           [Start Creating Free] [Watch Demo]           │
│                                                        │
├────────────────────────────────────────────────────────┤
│  How It Works                                          │ ← Process Section
│                                                        │
│  1. Describe     2. AI Creates    3. Play & Share      │
│  [Icon]         [Icon]           [Icon]                │
│  Your Game      Instantly        With Anyone           │
│                                                        │
├────────────────────────────────────────────────────────┤
│  Featured Games Created by Our Community               │ ← Social Proof
│                                                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │[Game 1] │ │[Game 2] │ │[Game 3] │ │[Game 4] │      │
│  │Preview  │ │Preview  │ │Preview  │ │Preview  │      │
│  │& Play ▶ │ │& Play ▶ │ │& Play ▶ │ │& Play ▶ │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                        │
├────────────────────────────────────────────────────────┤
│  Footer: Links, Social, Legal                          │
└────────────────────────────────────────────────────────┘
```

### 2. Game Creator Interface - Desktop

```
┌─────────────┬──────────────────────────────────────────┬─────────────┐
│    CHAT     │                MAIN EDITOR               │   ASSETS    │
│   PANEL     │                                          │   PANEL     │
│   300px     │                840px                     │   300px     │
│             │                                          │             │
│ ┌─────────┐ │ ┌─ Play Mode ─┐ ┌─ Visual ─┐ ┌─ Code ─┐ │ ┌─────────┐ │
│ │  Chat   │ │ │    Active   │ │         │ │        │ │ │ Library │ │
│ │ History │ │ └─────────────┘ └─────────┘ └────────┘ │ │         │ │
│ │         │ │                                        │ │ Search: │ │
│ │ • Made  │ │ ┌────────────────────────────────────┐ │ │ [     ] │ │
│ │   cat   │ │ │                                    │ │ │         │ │
│ │   hero  │ │ │        Game Canvas                 │ │ │ Filter: │ │
│ │ • Added │ │ │                                    │ │ │ [Genre] │ │
│ │   coins │ │ │    [Character] [Platform]          │ │ │         │ │
│ │ • Fixed │ │ │                                    │ │ │ Recent: │ │
│ │   jump  │ │ │         [Enemy]                    │ │ │ ┌─────┐ │ │
│ │         │ │ │                                    │ │ │ │Sprite│ │ │
│ ├─────────┤ │ │    [Platform]    [Coin]            │ │ │ │ Cat │ │ │
│ │New Chat:│ │ │                                    │ │ │ └─────┘ │ │
│ │         │ │ │                [Goal]              │ │ │ ┌─────┐ │ │
│ │[Input   │ │ └────────────────────────────────────┘ │ │ │Sound│ │ │
│ │ Field]  │ │                                        │ │ │Jump │ │ │
│ │    [>]  │ │ [◄] [►] [Test] [Share] [Export] [⚙️]   │ │ └─────┘ │ │
│ │         │ │                                        │ │         │ │
│ │Suggestions:│                                        │ │Generated│ │
│ │• Add     │ │                                        │ │ ┌─────┐ │ │
│ │  enemies │ │                                        │ │ │ AI  │ │ │
│ │• Make    │ │                                        │ │ │Coin │ │ │
│ │  harder  │ │                                        │ │ └─────┘ │ │
│ │• Add     │ │                                        │ │ ┌─────┐ │ │
│ │  music   │ │                                        │ │ │ AI  │ │ │
│ └─────────┘ │                                        │ │ │Enemy│ │ │
│             │                                        │ │ └─────┘ │ │
│ Credits:    │                                        │ │ [+] Gen │ │
│ 47 / 100    │                                        │ │ More    │ │
│ [Upgrade]   │                                        │ │         │ │
└─────────────┴──────────────────────────────────────────┴─────────────┘
```

### 3. Mobile Game Creator Interface

```
┌─────────────────────────┐
│ [☰] GameGen    [👤] [⚙] │ ← Header (60px)
├─────────────────────────┤
│                         │
│    ┌─ Play ─┐           │ ← Tab Navigation
│    │ Active │ Visual    │   (Swipeable)
│    └────────┘           │
│                         │
│ ┌─────────────────────┐ │ ← Game Canvas
│ │                     │ │   (Touch enabled)
│ │     [Character]     │ │
│ │                     │ │
│ │  [Platform] [Coin]  │ │
│ │                     │ │
│ │      [Enemy]        │ │
│ │                     │ │
│ │    [Platform]       │ │
│ │                     │ │
│ │        [Goal]       │ │
│ └─────────────────────┘ │
│                         │
├─────────────────────────┤
│ [💬] [🎨] [⚙️] [▶️] [💾] │ ← Bottom Actions
└─────────────────────────┘   (72px)

Expanded Chat Panel:
┌─────────────────────────┐
│ ← Chat Assistant        │ ← Modal Overlay
├─────────────────────────┤
│ You: "Add more coins"   │
│                         │
│ AI: I've added 5 more   │
│ coins throughout the    │
│ level for better        │
│ collection gameplay.    │
│                         │
│ ┌─────────────────────┐ │
│ │ Type your request...│ │
│ │                 [>] │ │
│ └─────────────────────┘ │
│                         │
│ Suggestions:            │
│ • Add enemies           │
│ • Make it harder        │
│ • Change theme          │
├─────────────────────────┤
│ Credits: 47/100 [Close] │
└─────────────────────────┘
```

### 4. User Dashboard Layout

```
┌────────────────────────────────────────────────────────────────┐
│ [Logo] GameGen                     [Search...] [🔔] [👤] [⚙️]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Welcome back, Alex! 👋                                         │
│                                                                │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │   Games     │ │   Plays     │ │   Likes     │ │  Credits    ││
│ │     12      │ │    1.2K     │ │    89       │ │   47/100    ││
│ │  ↗️ +3 this │ │  ↗️ +156    │ │  ↗️ +12     │ │  [Upgrade]  ││
│ │    week     │ │   today     │ │  this week  │ │             ││
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                                │
│ Recent Games                                       [View All]  │
│                                                                │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │┌─PixelCat──┐│ │┌─SpaceGame─┐│ │┌─MathQuest─┐│ │┌─NewProject┐││
│ ││[Thumbnail]││ ││[Thumbnail]││ ││[Thumbnail]││ ││     +      ││
│ │└───────────┘│ │└───────────┘│ │└───────────┘│ │  Create    ││
│ │ 156 plays   │ │  89 plays   │ │ 234 plays   │ │    New     ││
│ │ 2 days ago  │ │ 5 days ago  │ │ 1 week ago  │ │            ││
│ │[Edit][Share]│ │[Edit][Share]│ │[Edit][Share]│ │            ││
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                                │
│ Community Activity                                             │
│                                                                │
│ 🎮 Jordan Kim liked your game "Pixel Cat Adventure"           │
│ 💬 Someone commented on "Space Game": "Great mechanics!"      │
│ ⭐ Your game "Math Quest" was featured in Education category  │
│ 👥 3 new followers this week                                  │
│                                                                │
│ Quick Actions                                                  │
│ [🎮 Create Game] [🎨 Browse Assets] [👥 Find Collaborators]    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 5. Game Gallery/Community Page

```
┌────────────────────────────────────────────────────────────────┐
│ [Logo] GameGen    Create Explore Marketplace Learn [Profile]   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Discover Amazing Games                                         │
│                                                                │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ [🔍 Search games...] [Filter ▼] [Sort: Popular ▼]         ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                │
│ Filter Tags: [All] [Platformer] [Puzzle] [Educational] [New]   │
│                                                                │
│ Featured This Week                                             │
│                                                                │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ ┌─────────┐  Crystal Cavern Adventure                    │  │
│ │ │[Large   │  by Sarah Johnson • 🎮 2.1K plays           │  │
│ │ │Preview  │  ⭐⭐⭐⭐⭐ 4.9 (127 reviews)                │  │
│ │ │Image]   │                                              │  │
│ │ └─────────┘  "Explore mysterious caves and collect      │  │
│ │              magical crystals in this beautiful         │  │
│ │              platformer adventure!"                      │  │
│ │                                                          │  │
│ │ [▶️ Play Now] [💝 Save] [🔗 Share] [👤 Follow Creator] │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                │
│ All Games                                                      │
│                                                                │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │┌───────────┐│ │┌───────────┐│ │┌───────────┐│ │┌───────────┐││
│ ││[Preview]  ││ ││[Preview]  ││ ││[Preview]  ││ ││[Preview]  ││
│ │└───────────┘│ │└───────────┘│ │└───────────┘│ │└───────────┘││
│ │Robot Runner │ │Math Monsters│ │Pixel Pilot  │ │Color Quest  ││
│ │by Mike C.   │ │by Teacher A.│ │by Lisa M.   │ │by David L.  ││
│ │🎮 856 plays │ │🎮 1.2K plays│ │🎮 445 plays │ │🎮 723 plays ││
│ │⭐ 4.7 (23)  │ │⭐ 4.9 (67)  │ │⭐ 4.5 (18)  │ │⭐ 4.8 (34)  ││
│ │[▶️][💝][🔗] │ │[▶️][💝][🔗] │ │[▶️][💝][🔗] │ │[▶️][💝][🔗] ││
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                                │
│ [Load More Games...]                                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Interactive Design Patterns

### 1. AI Interaction Patterns

#### Chat Interface Design
```
Chat Bubble (User):
┌─────────────────────────────────────────┐
│ "Make the character jump higher"        │ ← Light blue bg
│                                         │   Right aligned
│                                    12:34│   Timestamp
└─────────────────────────────────────────┘

Chat Bubble (AI):
┌─────────────────────────────────────────┐
│ ✨ I've increased the jump height by    │ ← Gradient bg
│ 25%. Your character can now reach       │   Left aligned
│ higher platforms more easily.          │   AI indicator
│                                         │
│ [Preview Change] [Undo]                 │ ← Action buttons
│12:34                                    │   Timestamp
└─────────────────────────────────────────┘

Loading State:
┌─────────────────────────────────────────┐
│ ✨ Generating your game...              │ ← Animated dots
│ [●●○] This usually takes 15-30 seconds  │   Progress indicator
│                                         │   Time estimate
└─────────────────────────────────────────┘
```

#### AI Generation Preview
```
Before/After Comparison:
┌─────────────────────────────────────────┐
│ Preview Changes                         │
│                                         │
│ ┌──────────┐        ┌──────────┐       │
│ │ Before   │   →    │ After    │       │
│ │[Old View]│        │[New View]│       │
│ └──────────┘        └──────────┘       │
│                                         │
│ Changes Made:                           │
│ • Jump height: 100px → 125px           │
│ • Added particle effect on jump        │
│                                         │
│ [Apply Changes] [Try Different] [Cancel]│
└─────────────────────────────────────────┘
```

### 2. Drag-and-Drop Patterns

#### Asset Library to Canvas
```
Asset Library Item:
┌─────────────┐
│ ┌─────────┐ │ ← Drag handle appears on hover
│ │[Sprite] │ │   Shows compatibility indicators
│ │ Image   │ │   Animated preview on hover
│ └─────────┘ │
│ "Cat Hero"  │ ← Asset name
│ 32x32px     │   Dimensions
│ [Add] [❤️]  │   Quick actions
└─────────────┘

Drop Zone (Canvas):
┌─────────────────────────────────────────┐
│ ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐ │ ← Dashed outline
│ │         Drop asset here            │ │   when dragging
│ │                                   │ │   Shows snap grid
│ └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘ │   Position guides
└─────────────────────────────────────────┘

After Drop:
┌─────────────────────────────────────────┐
│        [Sprite positioned]              │ ← Asset placed
│        ┌─────────┐                      │   Selection handles
│        │[Sprite] │ □                    │   Properties panel
│        │ + Hero  │                      │   Context menu
│        └─────────┘                      │   
└─────────────────────────────────────────┘
```

### 3. Real-Time Collaboration Indicators

#### Multi-User Cursors
```
Canvas with Multiple Users:
┌─────────────────────────────────────────┐
│ ┌─────────┐     Alex's cursor           │
│ │[Sprite] │     🖱️ @alex               │ ← Named cursor
│ │         │                             │   Color coded
│ └─────────┘                             │   Live position
│                                         │
│        Jordan's selection               │
│        ┌─ ─ ─ ─ ─ ─ ─ ─ ─┐            │ ← Selection indicator
│        │ [Platform]      │ 👤 Jordan   │   User avatar
│        └─ ─ ─ ─ ─ ─ ─ ─ ─┘            │   Different color
│                                         │
│ Sam is typing...                        │ ← Typing indicators
│ 💬 @sam                                 │   Chat activity
└─────────────────────────────────────────┘

User Presence Panel:
┌─────────────────┐
│ 👥 Collaborators│
│                 │
│ 🟢 Alex (You)   │ ← Status indicators
│ 🟢 Jordan       │   Online/offline
│ 🟡 Sam (Away)   │   Activity status
│ 🔴 Maria        │   
│                 │
│ [Invite More]   │
└─────────────────┘
```

### 4. Mobile Touch Patterns

#### Touch Gestures
```
Mobile Game Editor Gestures:
┌─────────────────────────┐
│ Pinch to Zoom           │ ← Two-finger pinch
│ 🤏 ←→ 🤏               │   Canvas scaling
│                         │
│ Drag to Pan             │ ← Single finger drag
│ 👆 →→→→                 │   Canvas movement
│                         │
│ Long Press for Menu     │ ← Context actions
│ 👆 ●●●                  │   Asset options
│                         │
│ Double Tap to Edit      │ ← Quick editing
│ 👆👆                    │   Properties
└─────────────────────────┘

Touch Feedback:
┌─────────────────────────┐
│ ┌─────────┐             │ ← Visual feedback
│ │[Sprite] │ ✨          │   Haptic response
│ │ touched │             │   Audio confirmation
│ └─────────┘             │   State change
│                         │
│ Ripple effect           │
│ ○ ○○ ○○○                │
└─────────────────────────┘
```

### 5. Error States & Loading Patterns

#### Error State Design
```
Generation Failed:
┌─────────────────────────────────────────┐
│ ⚠️ Oops! Something went wrong           │
│                                         │
│ We couldn't generate your game this     │
│ time. Here are some things to try:      │
│                                         │
│ • Try rephrasing your description       │
│ • Check if you have credits remaining   │
│ • Use simpler game concepts            │
│                                         │
│ Your original request:                  │
│ "Make a super complex RPG with 50       │
│ characters and multiplayer..."          │
│                                         │
│ [Try Again] [Use Template] [Get Help]   │
└─────────────────────────────────────────┘

Loading Skeleton:
┌─────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓░░░ Generating... 75%         │ ← Progress bar
│                                         │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐    │ ← Content placeholders
│ │░░░░░░░░░│ │░░░░░░░░░│ │░░░░░░░░░│    │   Shimmer animation
│ │░░░░░░░░░│ │░░░░░░░░░│ │░░░░░░░░░│    │   Consistent shapes
│ └─────────┘ └─────────┘ └─────────┘    │
│                                         │
│ Current step: Creating game logic...    │ ← Step description
│ Estimated time remaining: 12 seconds    │   Time estimate
└─────────────────────────────────────────┘
```

### 6. Accessibility Patterns

#### Keyboard Navigation
```
Focus Indicators:
┌─────────────────────────┐
│ ┏━━━━━━━━━━━━━━━━━━━━━┓ │ ← High contrast outline
│ ┃ [Create New Game]   ┃ │   2px solid blue
│ ┗━━━━━━━━━━━━━━━━━━━━━┛ │   Visible on all bg colors
│                         │
│ Tab Order: 1 of 12      │ ← Screen reader info
│ Action: Create new game │   Context description
└─────────────────────────┘

Screen Reader Optimized:
┌─────────────────────────┐
│ [Game Preview]          │ ← Alt text: "Platformer
│ ┌─────────────────────┐ │   game featuring cat hero
│ │[Visual Game]        │ │   collecting coins"
│ │                     │ │   
│ │ Live region: Game   │ │ ← Announces changes
│ │ score updated to 50 │ │   Dynamic content
│ └─────────────────────┘ │   ARIA live regions
│                         │
│ [Play Game Button]      │ ← Clear button labels
│ Keyboard shortcut: P    │   Shortcut indicators
└─────────────────────────┘
```

### 7. Credit System UI Patterns

#### Credit Usage Transparency
```
Credit Display (Header):
┌─────────────────────────────────────┐
│ GameGen    Credits: 47/100 [i]      │ ← Always visible
│                    ████░░░          │   Visual indicator
│                    🔋 47% remaining │   Battery metaphor
└─────────────────────────────────────┘

Pre-Action Confirmation:
┌─────────────────────────────────────┐
│ Generate New Assets                 │
│                                     │
│ This action will use:               │
│ 🔥 5 credits                        │ ← Clear cost display
│                                     │   Fire icon for usage
│ You'll have 42 credits remaining    │   Remaining balance
│                                     │   
│ [Continue (5 credits)] [Cancel]     │ ← Explicit confirmation
└─────────────────────────────────────┘

Low Credits Warning:
┌─────────────────────────────────────┐
│ ⚠️ Credits Running Low              │
│                                     │
│ You have 3 credits remaining.       │
│ Consider upgrading to Pro for       │
│ unlimited basic generations.        │
│                                     │
│ [Upgrade to Pro] [Buy Credits]      │
│ [Continue with Limited Features]    │
└─────────────────────────────────────┘
```

This comprehensive interface design specification provides a solid foundation for GameGen's user interface, ensuring consistency, accessibility, and optimal user experience across all platforms and user scenarios. The design patterns emphasize clarity, efficiency, and creative empowerment while maintaining technical feasibility and scalability.