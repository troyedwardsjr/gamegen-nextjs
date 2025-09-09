# Generate Image (Bitforge)

Generate pixel art images with custom art styles using reference images and the Bitforge model.

## Endpoint

```
POST /generate-image-bitforge
```

## Features

- Style image reference support
- Advanced inpainting capabilities
- Skeleton guidance system
- Fine-grained style control
- Consistent art style generation

## Request Schema

```typescript
interface GenerateImageBitforgeRequest {
    description: string;                    // Required: Text description
    negative_description?: string;          // What to avoid
    image_size: {                          // Required: Image dimensions
        width: number;
        height: number;
    };
    text_guidance_scale?: number;          // 1.0-20.0, default: 8.0
    extra_guidance_scale?: number;         // 0.0-20.0, default: 3.0 (deprecated)
    style_strength?: number;               // 0.0-100.0, default: 0.0
    outline?: "no outline" | "thin outline" | "thick outline";
    shading?: "flat" | "cell shading" | "soft shading";
    detail?: "low detail" | "medium detail" | "highly detailed";
    view?: "side" | "low top-down" | "high top-down";
    direction?: "north" | "north-east" | "east" | "south-east" | 
                "south" | "south-west" | "west" | "north-west";
    isometric?: boolean;                   // Default: false
    oblique_projection?: boolean;          // Default: false
    no_background?: boolean;               // Default: false
    coverage_percentage?: number;          // 0.0-100.0, canvas coverage
    init_image?: Base64Image;              // Initial image
    init_image_strength?: number;          // 1-999, default: 300
    style_image?: Base64Image;             // Style reference
    inpainting_image?: Base64Image;        // Image to inpaint
    mask_image?: Base64Image;              // Inpainting mask
    color_image?: Base64Image;             // Forced palette
    skeleton_guidance_scale?: number;      // 0.0-5.0, default: 1.0
    skeleton_keypoints?: Point[];          // Skeleton points
    seed?: number;                         // Randomization seed
}

interface Point {
    x: number;
    y: number;
}
```

## Response Schema

```typescript
interface GenerateImageBitforgeResponse {
    image: Base64Image;
    usage: {
        type: "credits";
        credits: number;                   // Usually 1
    };
}
```

## Image Size Constraints

- **Maximum area**: 200x200 (40,000 pixels)
- **Recommended sizes**: 64x64, 128x128, 192x192

## Examples

### Style Transfer

```typescript
const request = {
    description: "fantasy castle",
    image_size: { width: 128, height: 128 },
    style_image: {
        type: "base64",
        base64: "data:image/png;base64,..." // Reference style image
    },
    style_strength: 75.0,
    text_guidance_scale: 10.0
};
```

### Advanced Inpainting

```typescript
const request = {
    description: "warrior with magical sword",
    image_size: { width: 64, height: 64 },
    inpainting_image: {
        type: "base64",
        base64: "data:image/png;base64,..." // Base character image
    },
    mask_image: {
        type: "base64",
        base64: "data:image/png;base64,..." // White = areas to inpaint
    },
    text_guidance_scale: 8.0
};
```

### Skeleton-Guided Generation

```typescript
const request = {
    description: "running character",
    image_size: { width: 64, height: 64 },
    skeleton_keypoints: [
        { x: 32, y: 10 }, // Head
        { x: 32, y: 20 }, // Neck
        { x: 32, y: 35 }, // Torso
        { x: 25, y: 50 }, // Left leg
        { x: 39, y: 50 }, // Right leg
        // ... more keypoints
    ],
    skeleton_guidance_scale: 2.5,
    view: "side",
    direction: "east"
};
```

### Consistent Art Style

```typescript
const styleConfig = {
    outline: "thick outline" as const,
    shading: "cell shading" as const,
    detail: "medium detail" as const,
    style_strength: 60.0
};

// Generate multiple assets with consistent style
const assets = await Promise.all([
    pixelLabClient.generateImageBitforge({
        description: "medieval knight",
        image_size: { width: 64, height: 64 },
        style_image: referenceStyleImage,
        ...styleConfig
    }),
    pixelLabClient.generateImageBitforge({
        description: "castle tower",
        image_size: { width: 64, height: 96 },
        style_image: referenceStyleImage,
        ...styleConfig
    })
]);
```

## Use Cases

### Game Art Pipeline
```typescript
// 1. Create base character
const baseCharacter = await pixelLabClient.generateImageBitforge({
    description: "pixel art mage character",
    image_size: { width: 64, height: 64 },
    style_image: gameStyleReference,
    style_strength: 80.0
});

// 2. Add equipment via inpainting
const equippedCharacter = await pixelLabClient.generateImageBitforge({
    description: "mage with staff and robes",
    image_size: { width: 64, height: 64 },
    inpainting_image: baseCharacter.image,
    mask_image: equipmentMask, // Areas for staff and robes
    style_image: gameStyleReference,
    style_strength: 80.0
});
```

### Art Style Exploration
```typescript
const styleVariations = await Promise.all([
    // Minimalist style
    pixelLabClient.generateImageBitforge({
        description: "simple tree",
        image_size: { width: 32, height: 48 },
        outline: "no outline",
        shading: "flat",
        detail: "low detail"
    }),
    
    // Detailed style
    pixelLabClient.generateImageBitforge({
        description: "detailed tree",
        image_size: { width: 32, height: 48 },
        outline: "thick outline",
        shading: "soft shading",
        detail: "highly detailed"
    })
]);
```

### Sprite Animation Preparation
```typescript
// Generate base frame with skeleton
const baseFrame = await pixelLabClient.generateImageBitforge({
    description: "walking character",
    image_size: { width: 32, height: 32 },
    skeleton_keypoints: walkCycleFrame1,
    skeleton_guidance_scale: 3.0,
    style_image: characterStyleRef
});
```

## Parameter Guidelines

### Style Strength
- **0-25**: Subtle style influence, preserves content
- **26-50**: Balanced style and content
- **51-75**: Strong style influence
- **76-100**: Maximum style transfer, content may be altered

### Skeleton Guidance Scale
- **0.0-1.0**: Minimal skeleton influence
- **1.1-2.5**: Balanced pose guidance
- **2.6-5.0**: Strict pose adherence

### Inpainting Tips
- **Mask images**: White areas = inpaint, black areas = preserve
- **Feathered edges**: Use gray values for smooth transitions
- **Context preservation**: Include enough context around inpaint areas

### Coverage Percentage
- **25-50%**: Small objects, details
- **51-75%**: Main subjects, characters
- **76-100%**: Full scene generation

## Advanced Techniques

### Multi-Pass Generation
```typescript
// Pass 1: Generate base structure
const base = await pixelLabClient.generateImageBitforge({
    description: "castle outline",
    image_size: { width: 128, height: 96 },
    outline: "thick outline",
    shading: "flat",
    detail: "low detail"
});

// Pass 2: Add details via inpainting
const detailed = await pixelLabClient.generateImageBitforge({
    description: "castle with windows, doors, and flags",
    image_size: { width: 128, height: 96 },
    inpainting_image: base.image,
    mask_image: detailMask,
    detail: "highly detailed",
    text_guidance_scale: 12.0
});
```

### Color Palette Consistency
```typescript
const paletteImage = createPaletteReference([
    "#2C3E50", // Dark blue-gray
    "#E74C3C", // Red
    "#F39C12", // Orange
    "#27AE60", // Green
    "#FFFFFF", // White
    "#000000"  // Black
]);

const consistentAssets = await Promise.all([
    pixelLabClient.generateImageBitforge({
        description: "hero character",
        image_size: { width: 32, height: 32 },
        color_image: paletteImage
    }),
    pixelLabClient.generateImageBitforge({
        description: "enemy orc",
        image_size: { width: 32, height: 32 },
        color_image: paletteImage
    })
]);
```

## Error Handling

```typescript
async function generateBitforgeWithValidation(request: GenerateImageBitforgeRequest) {
    // Validate image size
    const area = request.image_size.width * request.image_size.height;
    if (area > 40000) {
        throw new Error('Image too large for Bitforge (maximum 200x200)');
    }
    
    // Validate style strength
    if (request.style_strength !== undefined && request.style_strength > 100) {
        throw new Error('Style strength must be between 0-100');
    }
    
    // Validate skeleton guidance
    if (request.skeleton_guidance_scale !== undefined && request.skeleton_guidance_scale > 5) {
        throw new Error('Skeleton guidance scale must be between 0-5');
    }
    
    return await pixelLabClient.generateImageBitforge(request);
}
```

## Performance Optimization

1. **Use smaller images** when possible (64x64 vs 200x200)
2. **Cache style references** to avoid re-uploading
3. **Batch similar requests** with different seeds
4. **Optimize skeleton keypoints** for consistent results
5. **Pre-validate inputs** before API calls