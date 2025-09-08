# Toxoid WASM Files Directory

This directory should contain the compiled Toxoid WASM engine files for GameGen integration.

## Required Files

The following files need to be copied from the `worldlink/dist/` directory:

### Development Files
- `toxoid_dev.wasm` - Development build of Toxoid engine
- `toxoid_dev.js` - Emscripten glue code for development build
- `toxoid_webgl_dev.wasm` - Development build with WebGL support
- `toxoid_webgl_dev.js` - WebGL development glue code

### Production Files
- `toxoid.wasm` - Production build of Toxoid engine
- `toxoid.js` - Emscripten glue code for production build
- `toxoid_webgl.wasm` - Production build with WebGL support
- `toxoid_webgl.js` - WebGL production glue code

## Build Instructions

To generate these files from the WorldLink project:

```bash
# From the worldlink directory
cd /Users/troyedwards/dev/gamegen_nextjs/worldlink

# Build development version with scripting
make build-em FEATURES=scripting TARGET=dev

# Build WebGL development version
make build-em FEATURES=scripting TARGET=dev_webgl

# Build production version
make build-em FEATURES=scripting TARGET=prod

# Build WebGL production version
make build-em FEATURES=scripting TARGET=prod_webgl

# Copy files to GameGen
cp dist/dev/* ../public/toxoid/
cp dist/dev_webgl/* ../public/toxoid/
cp dist/prod/* ../public/toxoid/
cp dist/prod_webgl/* ../public/toxoid/
```

## Asset Directory

You may also want to create an assets directory for game resources:

```bash
mkdir -p public/assets/toxoid/sprites
mkdir -p public/assets/toxoid/audio
mkdir -p public/assets/toxoid/scripts
```

## Integration Status

The Toxoid WASM loader (`/src/lib/toxoid/wasm-loader.ts`) is configured to load these files automatically based on:
- Development vs. production mode
- WebGL support detection
- Feature requirements

Once the WASM files are in place, the GameGen Live Play tab will be able to run real Toxoid games with full ECS and scripting support.