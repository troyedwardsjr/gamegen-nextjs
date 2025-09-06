# Toxoid WASM Engine Integration for GameGen

This document describes the comprehensive integration of the Toxoid WASM game engine with the GameGen NextJS application, providing a complete pixel art game creation platform with AI-powered scripting.

## 🎯 Overview

The Toxoid integration provides:
- **Real-time game preview** with ECS (Entity Component System) architecture
- **JavaScript scripting** via QuickJS (50MB memory, 1MB stack)
- **Input handling** for keyboard, mouse, touch, and gamepad
- **Asset management** for sprites, audio, and scripts
- **Visual script editor** with syntax highlighting and error detection
- **Hot-reload** for rapid game development

## 📁 Architecture

```
src/
├── types/toxoid.ts                 # TypeScript definitions
├── lib/toxoid/
│   ├── wasm-loader.ts             # WASM module loading & initialization
│   ├── input-manager.ts           # Input handling system
│   └── asset-manager.ts           # Asset loading & caching
├── components/toxoid/
│   ├── ToxoidEngine.tsx           # React wrapper component
│   └── ScriptEditor.tsx           # JavaScript code editor
└── app/game-creator/components/
    └── EditorPanel.tsx            # Game creator UI integration

public/
└── toxoid/                        # WASM engine files
    ├── toxoid_dev.wasm           # Development build
    ├── toxoid_dev.js             # Development glue code
    ├── toxoid.wasm               # Production build
    ├── toxoid.js                 # Production glue code
    └── (WebGL variants)          # *_webgl versions
```

## 🚀 Core Components

### 1. TypeScript Definitions (`src/types/toxoid.ts`)

Complete TypeScript bindings for the Toxoid API:

```typescript
// Core types
interface ToxoidEngine {
  API: ToxoidCoreAPI;
  System: ToxoidSystemAPI;
  Query: ToxoidQueryAPI;
  Observer: ToxoidObserverAPI;
  // ... more
}

// Built-in components
interface PositionComponent {
  x: number;
  y: number;
  z?: number;
}

interface SpriteComponent {
  texture_id?: number;
  width: number;
  height: number;
  // ... more properties
}
```

### 2. WASM Loader (`src/lib/toxoid/wasm-loader.ts`)

Handles engine initialization and scripting:

```typescript
class ToxoidWasmLoader {
  async initialize(config: ToxoidInitConfig): Promise<boolean>
  getEngine(): ToxoidEngine | null
  executeScript(code: string): Promise<boolean>
  start(): void
  stop(): void
  // ... more methods
}
```

**Key Features:**
- Automatic WASM build selection (dev/prod, WebGL detection)
- Memory management (50MB limit, 1MB stack)
- Error handling and progress reporting
- QuickJS runtime initialization

### 3. Input Manager (`src/lib/toxoid/input-manager.ts`)

Complete input handling system:

```typescript
class ToxoidInputManager {
  isKeyPressed(key: string): boolean
  isKeyJustPressed(key: string): boolean
  getMousePosition(): { x: number; y: number }
  getTouchInput(): { points: TouchPoint[]; isSupported: boolean }
  // ... more methods
}
```

**Supported Input:**
- **Keyboard**: WASD, arrows, space, modifiers
- **Mouse**: Position, buttons, wheel
- **Touch**: Multi-touch support for mobile
- **Gamepad**: Xbox/PlayStation controller support

### 4. Asset Manager (`src/lib/toxoid/asset-manager.ts`)

Efficient asset loading and caching:

```typescript
class ToxoidAssetManager {
  async loadAsset(path: string, type: AssetType): Promise<AssetInfo>
  async preloadAssets(paths: string[]): Promise<AssetInfo[]>
  getMemoryUsage(): number
  cleanup(): void
  // ... more methods
}
```

**Features:**
- Memory-limited caching (100MB default)
- Automatic cleanup based on usage
- Progress reporting for preloading
- Support for sprites, audio, spine animations, scripts

### 5. React Integration (`src/components/toxoid/ToxoidEngine.tsx`)

React wrapper for seamless integration:

```tsx
<ToxoidEngine
  width={640}
  height={480}
  enableScripting={true}
  debugMode={true}
  onReady={(engine) => console.log('Engine ready!')}
  onGameStateChange={(state) => setGameState(state)}
/>
```

**Features:**
- Loading states with progress indicators
- Error boundaries and recovery
- Debug overlays (FPS, entities, memory)
- Mobile-responsive design

### 6. Script Editor (`src/components/toxoid/ScriptEditor.tsx`)

Professional JavaScript editor for game scripts:

```tsx
<ScriptEditor
  initialCode={defaultScript}
  onExecute={handleScriptRun}
  onSave={handleScriptSave}
  showLineNumbers={true}
/>
```

**Features:**
- Syntax highlighting for JavaScript
- Toxoid API autocompletion hints
- Real-time error detection
- Code templates and examples
- Script execution and debugging

## 🎮 Game Creator Integration

The Live Play tab in the game creator now uses the real Toxoid engine:

```typescript
// Default demo script loaded on initialization
const demoScript = `
// Create player entity
const player = Toxoid.API.createEntity("Player");
player.add("Position");
player.add("Sprite");

// Movement system
Toxoid.System.create("PlayerMovement", "Position, Player", Toxoid.Phases.ON_UPDATE,
    function(iter) {
        const keyboard = Toxoid.API.getKeyboardInput();
        iter.entities().forEach(entity => {
            const pos = entity.getComponent("Position");
            if (keyboard.isKeyPressed("ArrowLeft")) pos.x -= 200 * iter.deltaTime;
            if (keyboard.isKeyPressed("ArrowRight")) pos.x += 200 * iter.deltaTime;
            // ... more movement logic
        });
    }
);
`;
```

## 📋 Usage Examples

### Basic Entity Creation

```javascript
// Create an entity with components
const player = Toxoid.API.createEntity("Player");
player.add("Position");
player.add("Sprite");
player.add("Health");

// Set component data
const pos = player.getComponent("Position");
pos.x = 100;
pos.y = 200;

const health = player.getComponent("Health");
health.value = 100;
health.max_value = 100;
```

### System Registration

```javascript
// Create a movement system
Toxoid.System.create("MovementSystem", "Position, Velocity", Toxoid.Phases.ON_UPDATE,
    function(iter) {
        iter.entities().forEach(entity => {
            const pos = entity.getComponent("Position");
            const vel = entity.getComponent("Velocity");
            
            pos.x += vel.x * iter.deltaTime;
            pos.y += vel.y * iter.deltaTime;
        });
    }
);
```

### Input Handling

```javascript
// Keyboard input system
Toxoid.System.create("InputSystem", "Position, Player", Toxoid.Phases.ON_UPDATE,
    function(iter) {
        const keyboard = Toxoid.API.getKeyboardInput();
        
        iter.entities().forEach(entity => {
            const pos = entity.getComponent("Position");
            const speed = 200;
            
            if (keyboard.isKeyPressed("w")) pos.y -= speed * iter.deltaTime;
            if (keyboard.isKeyPressed("s")) pos.y += speed * iter.deltaTime;
            if (keyboard.isKeyPressed("a")) pos.x -= speed * iter.deltaTime;
            if (keyboard.isKeyPressed("d")) pos.x += speed * iter.deltaTime;
        });
    }
);
```

### Observer Pattern

```javascript
// React to health changes
Toxoid.Observer.create({
    name: "HealthWatcher",
    query: "Health",
    events: [Toxoid.ObserverEvents.OnSet],
    callback: function(iter) {
        iter.entities().forEach(entity => {
            const health = entity.getComponent("Health");
            if (health.value <= 0) {
                console.log("Entity died:", entity.name);
                entity.destroy();
            }
        });
    }
});
```

## 🔧 Setup Instructions

### 1. Build Toxoid WASM Files

From the WorldLink directory:

```bash
cd worldlink

# Build all required variants
make build-em FEATURES=scripting TARGET=dev
make build-em FEATURES=scripting TARGET=dev_webgl
make build-em FEATURES=scripting TARGET=prod
make build-em FEATURES=scripting TARGET=prod_webgl

# Copy to GameGen public directory
cp dist/dev/* ../public/toxoid/
cp dist/dev_webgl/* ../public/toxoid/
cp dist/prod/* ../public/toxoid/
cp dist/prod_webgl/* ../public/toxoid/
```

### 2. Install Dependencies

The integration uses existing GameGen dependencies:
- `@types/node` - Node.js types
- `framer-motion` - Animations
- `clsx` - Class name utilities

No additional dependencies are required.

### 3. Environment Setup

Add to `.env.local`:

```env
# Toxoid configuration
NEXT_PUBLIC_TOXOID_DEBUG=true
NEXT_PUBLIC_TOXOID_MEMORY_LIMIT=50
```

## 🎨 Customization

### Memory Configuration

```typescript
const config: ToxoidInitConfig = {
  canvas: canvasRef.current,
  memoryLimit: 100 * 1024 * 1024, // 100MB
  stackSize: 2 * 1024 * 1024,     // 2MB
  debugMode: true,
};
```

### Custom Input Mappings

```typescript
const customMappings = {
  'Space': 'jump',
  'ShiftLeft': 'run',
  'KeyE': 'interact',
};
```

### Asset Preloading

```typescript
const gameAssets = [
  '/assets/sprites/player.png',
  '/assets/sprites/enemies.png',
  '/assets/audio/background.mp3',
  '/assets/scripts/game-logic.js',
];

await assetManager.preloadAssets(gameAssets);
```

## 📊 Performance Features

### Memory Management
- 50MB JavaScript heap limit (configurable)
- 1MB stack size for deep recursion
- Automatic asset cleanup based on usage
- Memory pressure monitoring

### Optimization
- WebGL detection for hardware acceleration
- Dev/prod build selection
- Asset caching and compression
- Input event batching

### Mobile Support
- Touch input with multi-point support
- Responsive canvas sizing
- Performance optimizations for mobile
- Battery-friendly frame rates

## 🐛 Debugging Features

### Debug Overlay
Shows real-time information:
- FPS counter
- Entity count
- System count
- Memory usage
- Input state

### Script Debugging
- Real-time error detection
- Line number reporting
- Stack trace analysis
- Console.log integration

### Development Tools
- Hot-reload for scripts
- Live code execution
- Asset loading progress
- Performance profiling

## 🔮 Future Enhancements

### Planned Features
- **Visual scripting** with node-based editor
- **Multi-player support** with WebRTC
- **Asset pipeline** with automatic optimization
- **Plugin system** for custom components
- **Export targets** (mobile, desktop, web)

### Integration Roadmap
1. ✅ **Phase 1**: Core WASM integration
2. 🔄 **Phase 2**: Asset pipeline and optimization
3. 📋 **Phase 3**: Visual scripting interface
4. 📋 **Phase 4**: Multi-platform export
5. 📋 **Phase 5**: AI-powered game generation

## 📚 API Reference

### Core API
- `Toxoid.API.createEntity(name)` - Create new entity
- `Toxoid.API.registerComponent(name, schema)` - Register component type
- `Toxoid.API.getKeyboardInput()` - Get keyboard state
- `Toxoid.API.loadSprite(path)` - Load sprite asset

### System API
- `Toxoid.System.create(name, query, phase, callback)` - Create system
- `Toxoid.System.remove(name)` - Remove system
- `Toxoid.System.enable/disable(name)` - Toggle system

### Query API
- `Toxoid.Query.create(query)` - Create entity query
- `Toxoid.Query.each(query, callback)` - Iterate entities

### Observer API
- `Toxoid.Observer.create(config)` - Create observer
- Events: `OnAdd`, `OnRemove`, `OnSet`

## 🤝 Contributing

To extend the Toxoid integration:

1. **Add new component types** in `src/types/toxoid.ts`
2. **Extend input handling** in `input-manager.ts`
3. **Add asset types** in `asset-manager.ts`
4. **Create script templates** in `ScriptEditor.tsx`
5. **Enhance debugging** in `ToxoidEngine.tsx`

## 📄 License

This integration follows the same license as the GameGen project. The Toxoid engine itself is licensed separately under the WorldLink project.

---

**🎮 Happy Game Creating with Toxoid + GameGen! 🚀**