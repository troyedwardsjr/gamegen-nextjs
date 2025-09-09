# Generate Image (Pixflux)

Generate pixel art images from text descriptions using the Pixflux model.

## Endpoint

```
POST /generate-image-pixflux
```

## Features

- Text-to-pixel-art generation
- Larger image support (up to 400x400)
- Initial image support (img2img)
- Forced color palettes
- Transparent backgrounds
- Camera view and direction control

## Request Schema

```typescript
interface GenerateImagePixfluxRequest {
    description: string;                    // Required: Text description
    negative_description?: string;          // Deprecated
    image_size: {                          // Required: Image dimensions
        width: number;
        height: number;
    };
    text_guidance_scale?: number;          // 1.0-20.0, default: 8
    outline?: "no outline" | "thin outline" | "thick outline";
    shading?: "flat" | "cell shading" | "soft shading";
    detail?: "low detail" | "medium detail" | "highly detailed";
    view?: "side" | "low top-down" | "high top-down";
    direction?: "north" | "north-east" | "east" | "south-east" | 
                "south" | "south-west" | "west" | "north-west";
    isometric?: boolean;                   // Default: false
    no_background?: boolean;               // Default: false
    init_image?: Base64Image;              // Initial image
    init_image_strength?: number;          // 1-999, default: 300
    color_image?: Base64Image;             // Forced palette
    seed?: number;                         // Randomization seed
}

interface Base64Image {
    type: "base64";
    base64: string;                        // data:image/png;base64,...
}
```

## Response Schema

```typescript
interface GenerateImagePixfluxResponse {
    image: Base64Image;
    usage: {
        type: "credits";
        credits: number;                   // Usually 1
    };
}
```

## Image Size Constraints

- **Minimum area**: 32x32 (1,024 pixels)
- **Maximum area**: 400x400 (160,000 pixels)
- **Recommended sizes**: 64x64, 128x128, 256x256, 320x320

## Examples

### Basic Generation

```typescript
const request = {
    description: "cute dragon",
    image_size: { width: 128, height: 128 }
};

const response = await pixelLabClient.generateImagePixflux(request);
const imageData = response.image.base64; // data:image/png;base64,...
```

### Advanced Generation with Style Controls

```typescript
const request = {
    description: "medieval knight with sword and shield",
    image_size: { width: 256, height: 256 },
    text_guidance_scale: 12.0,
    outline: "thick outline",
    shading: "cell shading",
    detail: "highly detailed",
    view: "side",
    direction: "east",
    no_background: true
};
```

### Image-to-Image Generation

```typescript
const request = {
    description: "dragon with wings spread",
    image_size: { width: 128, height: 128 },
    init_image: {
        type: "base64",
        base64: "data:image/png;base64,..." // Base existing image
    },
    init_image_strength: 500, // Higher = more transformation
    text_guidance_scale: 10.0
};
```

### Forced Color Palette

```typescript
const request = {
    description: "forest scene",
    image_size: { width: 192, height: 192 },
    color_image: {
        type: "base64",
        base64: "data:image/png;base64,..." // Palette reference image
    }
};
```

## Use Cases

### Game Asset Creation
```typescript
// Generate character sprites
const characterRequest = {
    description: "pixel art warrior character",
    image_size: { width: 64, height: 64 },
    view: "side",
    direction: "south",
    outline: "thick outline",
    no_background: true
};

// Generate environment tiles
const tileRequest = {
    description: "grass tile with flowers",
    image_size: { width: 32, height: 32 },
    view: "high top-down",
    detail: "medium detail"
};
```

### Concept Art
```typescript
const conceptRequest = {
    description: "mystical floating island with waterfalls",
    image_size: { width: 400, height: 300 },
    text_guidance_scale: 15.0,
    detail: "highly detailed",
    view: "side"
};
```

### Asset Variations
```typescript
const variations = await Promise.all([
    pixelLabClient.generateImagePixflux({
        description: "magic potion bottle",
        image_size: { width: 32, height: 48 },
        seed: 1001
    }),
    pixelLabClient.generateImagePixflux({
        description: "magic potion bottle",
        image_size: { width: 32, height: 48 },
        seed: 1002  // Different seed = different variation
    })
]);
```

## Parameter Guidelines

### Text Guidance Scale
- **1.0-5.0**: Loose interpretation, more creative
- **6.0-10.0**: Balanced, recommended range
- **11.0-20.0**: Strict adherence, less variation

### Style Parameters
- **Outline**: Affects edge definition
  - `"no outline"`: Soft edges, painterly style
  - `"thin outline"`: Subtle definition
  - `"thick outline"`: Bold, classic pixel art style

- **Shading**: Affects lighting and depth
  - `"flat"`: No shading, solid colors
  - `"cell shading"`: Cartoon-like shading
  - `"soft shading"`: Realistic gradients

- **Detail**: Affects complexity level
  - `"low detail"`: Simple, clean designs
  - `"medium detail"`: Balanced complexity
  - `"highly detailed"`: Maximum detail and complexity

### Direction and View
- **Side view**: Best for character sprites, profiles
- **Top-down views**: Ideal for tiles, maps, overhead objects
- **Isometric**: 3D-like perspective for buildings, objects

## Error Handling

```typescript
async function generateWithErrorHandling(request: GenerateImagePixfluxRequest) {
    try {
        return await pixelLabClient.generateImagePixflux(request);
    } catch (error: any) {
        if (error.status === 422) {
            // Validation error - check image size constraints
            const area = request.image_size.width * request.image_size.height;
            if (area < 1024) throw new Error('Image too small (minimum 32x32)');
            if (area > 160000) throw new Error('Image too large (maximum 400x400)');
        }
        throw error;
    }
}
```

## Performance Tips

1. **Batch requests** for multiple variations
2. **Use appropriate image sizes** - larger isn't always better
3. **Cache results** by description + seed combination
4. **Implement retry logic** for rate limits
5. **Monitor credit usage** before expensive operations