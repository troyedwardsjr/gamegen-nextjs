# PixelLab API Overview

The PixelLab API is a comprehensive AI-powered pixel art generation service that provides multiple endpoints for creating, animating, and manipulating pixel art images.

## Core Features

### 1. Image Generation Models

#### Pixflux Model
- **Purpose**: General pixel art generation from text descriptions
- **Strengths**: Fast generation, larger image support (up to 400x400)
- **Best for**: Creating new assets, rapid prototyping
- **Features**:
  - Text-to-pixel-art generation
  - Initial image support (img2img)
  - Forced color palettes
  - Transparent backgrounds
  - Various camera views and directions

#### Bitforge Model  
- **Purpose**: Style-guided pixel art generation
- **Strengths**: Style transfer, inpainting, reference-based generation
- **Best for**: Consistent art styles, editing existing images
- **Features**:
  - Style image reference
  - Advanced inpainting capabilities
  - Skeleton guidance
  - Multiple art style parameters (outline, shading, detail)

### 2. Animation System

#### Skeleton-Based Animation
- **Process**: Uses pose keypoints to generate character animations
- **Output**: 4 frames of animation
- **Use cases**: Character movement, object rotation
- **Integration**: Works with skeleton estimation endpoint

#### Text-Based Animation
- **Process**: Generates animations from action descriptions
- **Output**: 2-20 frames (4 frames generated at a time)
- **Use cases**: Quick animation prototyping
- **Features**: Action descriptions, character descriptions

### 3. Image Manipulation

#### Rotation System
- **Purpose**: Change object/character orientation
- **Supported views**: Side, low top-down, high top-down
- **Supported directions**: 8 cardinal and intercardinal directions
- **Use cases**: Creating sprite sheets, multiple angles

#### Inpainting System
- **Purpose**: Edit specific parts of existing images
- **Process**: Uses mask images to define edit areas
- **Use cases**: Adding details, modifying characters, fixing artifacts

### 4. Utility Functions

#### Skeleton Estimation
- **Purpose**: Extract pose keypoints from character images
- **Output**: Array of skeleton keypoints
- **Integration**: Feeds into skeleton animation system

#### Balance Checking
- **Purpose**: Monitor API usage credits
- **Response**: Current USD balance
- **Use cases**: Usage tracking, billing integration

## Technical Architecture

### Request/Response Pattern
All endpoints follow a consistent pattern:

1. **Request**: JSON payload with generation parameters
2. **Processing**: AI model processes the request
3. **Response**: JSON with base64 image data and usage info

### Image Format
- **Encoding**: Base64 PNG data
- **Color depth**: Full color with alpha channel support
- **Compression**: PNG compression for optimal file size

### Authentication
- **Method**: Bearer token authentication
- **Header**: `Authorization: Bearer YOUR_API_TOKEN`
- **Scope**: All endpoints require authentication

### Rate Limiting
- **429 Error**: Too many requests
- **529 Error**: Rate limit exceeded
- **Best practice**: Implement exponential backoff

## Integration Patterns

### Batch Processing
- Generate multiple variations
- Process animation frames
- Create sprite sheets

### Pipeline Integration
- Image generation → Inpainting → Final output
- Skeleton estimation → Animation generation
- Style transfer → Rotation → Multi-angle assets

### Error Handling
- Credit validation before requests
- Retry logic for rate limits
- Fallback models for different use cases

## Performance Characteristics

### Generation Speed
- **Pixflux**: ~2-5 seconds per image
- **Bitforge**: ~3-7 seconds per image
- **Animation**: ~5-15 seconds per sequence
- **Rotation**: ~2-4 seconds per image

### Credit Usage
- Most operations: 1 credit per request
- Animation: 1 credit per sequence (4 frames)
- Batch operations: 1 credit per individual generation

### Quality Factors
- **Image size**: Larger images may have lower quality on some models
- **Complexity**: Simple descriptions generally produce better results
- **Style consistency**: Bitforge better for consistent styling
- **Animation smoothness**: Skeleton-based more consistent than text-based