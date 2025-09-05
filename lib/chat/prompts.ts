"use client";

// Types for prompt templates
export interface PromptTemplate {
  id: string;
  name: string;
  category: GameCategory;
  description: string;
  prompt: string;
  tags: string[];
  isPopular?: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: string;
  icon?: string;
}

export type GameCategory = 
  | 'rpg' 
  | 'platformer' 
  | 'puzzle' 
  | 'shooter' 
  | 'strategy' 
  | 'adventure' 
  | 'simulation' 
  | 'custom';

// Built-in prompt templates
export const GAME_PROMPT_TEMPLATES: PromptTemplate[] = [
  // RPG Templates
  {
    id: 'fantasy-rpg-starter',
    name: 'Fantasy RPG Adventure',
    category: 'rpg',
    description: 'Create a classic fantasy RPG with character classes, magic system, and epic quests',
    icon: '⚔️',
    difficulty: 'intermediate',
    estimatedTime: '2-3 hours',
    isPopular: true,
    tags: ['fantasy', 'characters', 'magic', 'quests', 'combat'],
    prompt: `I want to create a fantasy RPG game with the following elements:

🏰 **Setting & World:**
- Medieval fantasy world with kingdoms, dungeons, and magical creatures
- Rich lore and backstory for the game world
- Various locations: towns, forests, mountains, caves, castles

⚔️ **Character System:**
- Character classes: Warrior, Mage, Archer, Cleric
- Attribute system: Strength, Intelligence, Dexterity, Constitution, Charisma
- Level progression and skill trees
- Equipment system with weapons, armor, and accessories

🎯 **Core Mechanics:**
- Turn-based combat system
- Magic spells and abilities
- Inventory and item management
- Quest system with main story and side quests
- NPC dialogue and interactions

🎨 **Art Style:**
- 16-bit pixel art aesthetic
- Character sprites with multiple animations
- Environmental tiles and backgrounds
- UI elements and interface design

Please help me design the core systems and suggest pixel art concepts for this RPG!`
  },

  {
    id: 'sci-fi-rpg-space',
    name: 'Space RPG Explorer',
    category: 'rpg',
    description: 'Build a sci-fi RPG with space exploration, alien races, and futuristic technology',
    icon: '🚀',
    difficulty: 'advanced',
    estimatedTime: '3-4 hours',
    tags: ['sci-fi', 'space', 'aliens', 'technology', 'exploration'],
    prompt: `I want to create a sci-fi RPG set in space with these features:

🌌 **Universe & Setting:**
- Multiple star systems and planets to explore
- Different alien civilizations and factions
- Space stations, colonies, and derelict ships
- Political intrigue and galactic conflicts

👨‍🚀 **Character System:**
- Roles: Pilot, Engineer, Scientist, Soldier, Diplomat
- Cybernetic upgrades and genetic modifications
- Reputation system with different factions
- Spaceship customization and crew management

⚡ **Technology & Combat:**
- Energy weapons and defensive shields
- Hacking and tech abilities
- Ship-to-ship combat mechanics
- Environmental hazards and zero-g mechanics

🎨 **Visual Design:**
- Futuristic pixel art with neon accents
- Sleek UI design with holographic elements
- Alien creature and ship designs
- Planet surface and space station environments

Help me design this space opera RPG with engaging mechanics and stunning visuals!`
  },

  // Platformer Templates
  {
    id: 'retro-platformer-classic',
    name: 'Retro Platformer Adventure',
    category: 'platformer',
    description: 'Design a classic 2D platformer with tight controls and creative level design',
    icon: '🏃‍♂️',
    difficulty: 'beginner',
    estimatedTime: '1-2 hours',
    isPopular: true,
    tags: ['retro', 'jumping', 'enemies', 'powerups', 'collectibles'],
    prompt: `I want to create a retro-style 2D platformer game:

🎮 **Core Gameplay:**
- Precise jumping mechanics with variable jump height
- Running, sliding, and wall-jumping abilities
- Momentum-based movement that feels responsive
- Simple but satisfying control scheme

🏗️ **Level Design:**
- Progressive difficulty with creative obstacles
- Secret areas and hidden collectibles
- Moving platforms and environmental hazards
- Boss battles at the end of each world

👾 **Enemies & Challenges:**
- Various enemy types with unique behaviors
- Environmental challenges (spikes, pits, moving blocks)
- Power-ups that enhance abilities temporarily
- Checkpoint system for fair progression

🎨 **Art & Style:**
- 8-bit or 16-bit pixel art aesthetic
- Colorful and vibrant world themes
- Smooth character animations
- Parallax scrolling backgrounds

Please help me design the movement system, level concepts, and pixel art style!`
  },

  {
    id: 'metroidvania-exploration',
    name: 'Metroidvania Explorer',
    category: 'platformer',
    description: 'Create an interconnected world with ability-gated progression and secrets',
    icon: '🗺️',
    difficulty: 'advanced',
    estimatedTime: '4-5 hours',
    tags: ['metroidvania', 'exploration', 'abilities', 'secrets', 'backtracking'],
    prompt: `I want to create a Metroidvania-style exploration game:

🗺️ **World Design:**
- Large interconnected map with multiple biomes
- Locked areas that require specific abilities to access
- Environmental storytelling through visual details
- Shortcuts and connections between distant areas

🔓 **Ability Progression:**
- New abilities unlock new traversal options
- Double jump, wall climbing, dash, and special powers
- Abilities that also serve as keys to new areas
- Backtracking feels rewarding, not tedious

🏛️ **Atmosphere & Story:**
- Mysterious ancient civilization or sci-fi facility
- Story told through environmental clues
- Boss fights that grant new abilities
- Sense of isolation and discovery

🎨 **Visual Design:**
- Detailed pixel art environments
- Each area has distinct visual identity
- Atmospheric lighting and particle effects
- Clear visual language for interactive elements

Help me design the world layout, ability progression, and atmospheric pixel art!`
  },

  // Puzzle Templates
  {
    id: 'logic-puzzle-mechanics',
    name: 'Logic Puzzle Master',
    category: 'puzzle',
    description: 'Build engaging logic puzzles with escalating complexity',
    icon: '🧩',
    difficulty: 'intermediate',
    estimatedTime: '2-3 hours',
    tags: ['logic', 'switches', 'mechanics', 'progression'],
    prompt: `I want to create a logic puzzle game with these elements:

🧠 **Core Mechanics:**
- Switches, buttons, and pressure plates
- Logic gates (AND, OR, NOT operations)
- Timing-based puzzles with moving elements
- Color-coding and pattern recognition

📈 **Difficulty Progression:**
- Tutorial levels that teach each mechanic
- Gradual introduction of new elements
- Complex combinations of simple rules
- Optional challenge levels for experts

🎯 **Player Guidance:**
- Clear visual feedback for interactions
- Undo system for trial and error
- Hint system that doesn't give away solutions
- Achievement system for elegant solutions

🎨 **Interface Design:**
- Clean, minimal pixel art style
- Clear iconography for different elements
- Satisfying animations for successful solutions
- Calming color palette that aids concentration

Help me design the core mechanics and create engaging puzzle concepts!`
  },

  // Shooter Templates
  {
    id: 'top-down-shooter-arcade',
    name: 'Arcade Space Shooter',
    category: 'shooter',
    description: 'Create an intense top-down shooter with waves of enemies',
    icon: '🛸',
    difficulty: 'intermediate',
    estimatedTime: '2-3 hours',
    isPopular: true,
    tags: ['arcade', 'waves', 'weapons', 'powerups', 'scoring'],
    prompt: `I want to create a top-down arcade shooter:

🚀 **Player Ship & Controls:**
- Responsive 8-directional movement
- Multiple weapon types (spread shot, laser, missiles)
- Shield system and special abilities
- Smooth controls that feel precise

👾 **Enemy Design:**
- Various enemy types with unique attack patterns
- Formation flying and coordinated attacks
- Boss battles with multiple phases
- Escalating difficulty with new enemy types

💥 **Combat System:**
- Satisfying weapon feedback and screen shake
- Power-up system for weapon upgrades
- Score multipliers and combo systems
- Destructible environments and objects

🎨 **Visual Effects:**
- Explosive particle effects and screen flash
- Colorful laser beams and projectiles
- Smooth enemy and player animations
- Dynamic background with parallax scrolling

Help me design the combat feel, enemy patterns, and explosive visual effects!`
  },

  // Strategy Templates
  {
    id: 'tower-defense-strategy',
    name: 'Tower Defense Commander',
    category: 'strategy',
    description: 'Build a strategic tower defense game with upgrade paths',
    icon: '🏰',
    difficulty: 'intermediate',
    estimatedTime: '3-4 hours',
    tags: ['tower-defense', 'strategy', 'upgrades', 'waves'],
    prompt: `I want to create a tower defense strategy game:

🏗️ **Tower System:**
- Different tower types (archer, cannon, magic, support)
- Upgrade paths that change tower appearance and abilities
- Strategic placement for optimal coverage
- Special abilities and active powers

👥 **Enemy Waves:**
- Various enemy types with different resistances
- Flying units that require anti-air towers
- Boss enemies with unique mechanics
- Increasing difficulty with mixed enemy types

💰 **Resource Management:**
- Economy system with gold/crystals
- Strategic decisions about upgrades vs new towers
- Risk/reward mechanics for bonus objectives
- Research tree for long-term progression

🎨 **Battlefield Design:**
- Clear paths and strategic chokepoints
- Environmental obstacles and elevation
- Pixel art towers with detailed animations
- Satisfying visual feedback for successful defenses

Help me design the tower mechanics, enemy balance, and strategic gameplay!`
  },

  // Adventure Templates
  {
    id: 'point-click-adventure',
    name: 'Mystery Adventure Game',
    category: 'adventure',
    description: 'Create a story-driven adventure with puzzles and dialogue',
    icon: '🕵️',
    difficulty: 'advanced',
    estimatedTime: '4-6 hours',
    tags: ['story', 'dialogue', 'investigation', 'characters'],
    prompt: `I want to create a point-and-click adventure game:

📖 **Story & Setting:**
- Compelling mystery or adventure storyline
- Interesting characters with unique personalities
- Multiple locations to explore and investigate
- Plot twists and meaningful player choices

🗣️ **Dialogue System:**
- Branching conversations with multiple options
- Character development through dialogue
- Clues and information gathering mechanics
- Personality-based responses and reactions

🔍 **Investigation Mechanics:**
- Inventory system with item combinations
- Environmental puzzles and hidden objects
- Logical deduction and evidence gathering
- Journal system to track clues and progress

🎨 **Artistic Vision:**
- Detailed pixel art backgrounds and characters
- Expressive character portraits and animations
- Atmospheric lighting and mood setting
- UI design that fits the game's theme

Help me develop the story structure, character interactions, and puzzle design!`
  },

  // Simulation Templates
  {
    id: 'life-simulation-cozy',
    name: 'Cozy Life Simulator',
    category: 'simulation',
    description: 'Build a relaxing life simulation with character needs and relationships',
    icon: '🏡',
    difficulty: 'intermediate',
    estimatedTime: '3-4 hours',
    tags: ['life-sim', 'relationships', 'customization', 'peaceful'],
    prompt: `I want to create a cozy life simulation game:

🏠 **Home & Environment:**
- Customizable house with furniture and decorations
- Garden where players can grow plants and flowers
- Seasonal changes and weather effects
- Day/night cycle with different activities

👥 **Character & Relationships:**
- Friendship system with NPCs in the community
- Gift-giving and conversation mechanics
- Community events and festivals
- Character needs (hunger, energy, happiness)

🎯 **Activities & Goals:**
- Cooking system with recipes to discover
- Crafting items from gathered materials
- Mini-games for different activities
- Personal goals and achievement system

🎨 **Cozy Aesthetic:**
- Warm, inviting pixel art style
- Soft color palette and comfortable environments
- Charming character designs and animations
- Relaxing background music and sound effects

Help me design the relationship systems, daily activities, and cozy visual style!`
  },

  // Custom/Specialized Templates
  {
    id: 'game-jam-rapid-prototype',
    name: 'Game Jam Quick Start',
    category: 'custom',
    description: 'Rapid prototyping template for game jams with tight deadlines',
    icon: '⚡',
    difficulty: 'beginner',
    estimatedTime: '30 minutes - 2 hours',
    isPopular: true,
    tags: ['game-jam', 'prototype', 'minimal', 'scope'],
    prompt: `I'm participating in a game jam and need help creating a game quickly:

⏰ **Time Constraints:**
- Game jam duration: [SPECIFY TIME LIMIT]
- My experience level: [BEGINNER/INTERMEDIATE/ADVANCED]
- Available team members: [SOLO/ARTIST/PROGRAMMER/SOUND]
- Tools I'm comfortable with: [SPECIFY TOOLS]

🎯 **Jam Theme/Requirements:**
- Theme: [SPECIFY THEME IF KNOWN]
- Any specific requirements or limitations
- Target platform (web, desktop, mobile)
- Judging criteria I want to focus on

💡 **Quick Concept Generation:**
- Suggest a simple but engaging core mechanic
- Minimal viable feature set (no scope creep!)
- Art style that can be executed quickly
- Sound requirements and placeholder options

🚀 **Execution Strategy:**
- Development timeline and milestones
- Which features to implement first
- Polish opportunities in remaining time
- Submission and presentation tips

Help me brainstorm and scope a realistic game concept I can complete on time!`
  },

  {
    id: 'educational-game-design',
    name: 'Educational Game Designer',
    category: 'custom',
    description: 'Create engaging educational games that teach while entertaining',
    icon: '🎓',
    difficulty: 'advanced',
    estimatedTime: '4-6 hours',
    tags: ['educational', 'learning', 'engagement', 'assessment'],
    prompt: `I want to create an educational game that teaches while entertaining:

📚 **Learning Objectives:**
- Subject matter: [SPECIFY SUBJECT - math, science, language, history, etc.]
- Target age group: [SPECIFY AGE RANGE]
- Specific skills or concepts to teach
- Assessment and progress tracking needs

🎮 **Gamification Elements:**
- Point systems and rewards for learning
- Progressive difficulty and skill building
- Achievements and badges for milestones
- Social features for collaborative learning

⚖️ **Education-Entertainment Balance:**
- Game mechanics that reinforce learning
- Fun elements that maintain engagement
- Avoiding "chocolate-covered broccoli" design
- Immediate feedback and positive reinforcement

🎨 **Accessibility & Design:**
- Visual design appropriate for age group
- Clear UI and intuitive interactions
- Support for different learning styles
- Parental/teacher dashboard features

Help me design educational mechanics that make learning genuinely fun and effective!`
  },

  {
    id: 'multiplayer-concept',
    name: 'Multiplayer Game Architect',
    category: 'custom',
    description: 'Design multiplayer mechanics and social features',
    icon: '👥',
    difficulty: 'advanced',
    estimatedTime: '5-8 hours',
    tags: ['multiplayer', 'social', 'cooperation', 'competition'],
    prompt: `I want to design a multiplayer game with social features:

🌐 **Multiplayer Scope:**
- Player count: [2-4 local / 4-16 online / MMO-style]
- Cooperative vs competitive gameplay
- Real-time vs turn-based mechanics
- Cross-platform compatibility needs

🤝 **Social Features:**
- Friend systems and player profiles
- Communication tools (chat, emotes, voice)
- Guilds, clans, or team formations
- Leaderboards and ranking systems

⚖️ **Game Balance:**
- Fair matchmaking systems
- Anti-cheat and moderation tools
- Progression that doesn't create pay-to-win
- Balancing individual skill vs teamwork

🔧 **Technical Considerations:**
- Network synchronization for game state
- Handling lag and disconnections gracefully
- Server architecture and scaling
- Security and player data protection

Help me design multiplayer mechanics that create positive social experiences!`
  }
];

// Categories with metadata
export const GAME_CATEGORIES = [
  {
    id: 'rpg' as GameCategory,
    name: 'RPG',
    icon: '⚔️',
    description: 'Role-playing games with character progression',
    color: 'from-purple-500 to-blue-600'
  },
  {
    id: 'platformer' as GameCategory,
    name: 'Platformer',
    icon: '🏃‍♂️',
    description: 'Jump and run adventure games',
    color: 'from-green-500 to-teal-600'
  },
  {
    id: 'puzzle' as GameCategory,
    name: 'Puzzle',
    icon: '🧩',
    description: 'Logic and brain-teasing challenges',
    color: 'from-yellow-500 to-orange-600'
  },
  {
    id: 'shooter' as GameCategory,
    name: 'Shooter',
    icon: '🎯',
    description: 'Action-packed combat games',
    color: 'from-red-500 to-pink-600'
  },
  {
    id: 'strategy' as GameCategory,
    name: 'Strategy',
    icon: '♟️',
    description: 'Tactical and strategic gameplay',
    color: 'from-indigo-500 to-purple-600'
  },
  {
    id: 'adventure' as GameCategory,
    name: 'Adventure',
    icon: '🗺️',
    description: 'Story-driven exploration games',
    color: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'simulation' as GameCategory,
    name: 'Simulation',
    icon: '🏡',
    description: 'Life and world simulation games',
    color: 'from-emerald-500 to-green-600'
  },
  {
    id: 'custom' as GameCategory,
    name: 'Custom',
    icon: '⚡',
    description: 'Specialized and unique concepts',
    color: 'from-gray-500 to-slate-600'
  }
] as const;

// Utility functions
export function getPromptsByCategory(category: GameCategory): PromptTemplate[] {
  return GAME_PROMPT_TEMPLATES.filter(template => template.category === category);
}

export function getPopularPrompts(): PromptTemplate[] {
  return GAME_PROMPT_TEMPLATES.filter(template => template.isPopular);
}

export function searchPrompts(query: string): PromptTemplate[] {
  const searchTerm = query.toLowerCase();
  return GAME_PROMPT_TEMPLATES.filter(template => 
    template.name.toLowerCase().includes(searchTerm) ||
    template.description.toLowerCase().includes(searchTerm) ||
    template.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
    template.prompt.toLowerCase().includes(searchTerm)
  );
}

export function getPromptById(id: string): PromptTemplate | undefined {
  return GAME_PROMPT_TEMPLATES.find(template => template.id === id);
}

export function getCategoryInfo(category: GameCategory) {
  return GAME_CATEGORIES.find(cat => cat.id === category);
}

// Quick start suggestions based on experience level
export const EXPERIENCE_BASED_SUGGESTIONS = {
  beginner: ['retro-platformer-classic', 'logic-puzzle-mechanics', 'game-jam-rapid-prototype'],
  intermediate: ['fantasy-rpg-starter', 'top-down-shooter-arcade', 'tower-defense-strategy'],
  advanced: ['sci-fi-rpg-space', 'metroidvania-exploration', 'multiplayer-concept']
} as const;

export function getPromptsByExperience(level: 'beginner' | 'intermediate' | 'advanced'): PromptTemplate[] {
  const suggestionIds = EXPERIENCE_BASED_SUGGESTIONS[level];
  return suggestionIds.map(id => getPromptById(id)).filter(Boolean) as PromptTemplate[];
}