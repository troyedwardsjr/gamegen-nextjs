# PixelLab AI API Documentation

The PixelLab API provides comprehensive endpoints for AI-generated pixel art creation, animation, and manipulation. This documentation covers all available endpoints and their integration into the GameGen platform.

## Quick Links

- [API Overview](./api-overview.md) - High-level overview of the API
- [Authentication](./authentication.md) - How to authenticate with the API
- [Endpoints](./endpoints/) - Detailed endpoint documentation
- [Integration Guide](./integration-guide.md) - How to integrate with GameGen
- [Examples](./examples/) - Code examples and use cases

## API Capabilities

### Image Generation
- **Pixflux**: Generate pixel art from text descriptions
- **Bitforge**: Generate pixel art with custom art styles using reference images

### Animation
- **Skeleton Animation**: Generate 4-frame animations using skeleton poses
- **Text Animation**: Generate animations from text descriptions

### Image Manipulation
- **Rotate**: Rotate characters or objects to different orientations
- **Inpaint**: Edit and modify existing pixel art images

### Utilities
- **Estimate Skeleton**: Extract skeleton keypoints from character images
- **Account Balance**: Check your API usage credits

## Base URL

```
https://api.pixellab.ai/v1
```

## Authentication

All API requests require a Bearer token:

```bash
Authorization: Bearer YOUR_API_TOKEN
```

## Supported Image Sizes

Different endpoints support different image size constraints:

- **Pixflux**: 32x32 to 400x400 (minimum area 1024, maximum area 160000)
- **Bitforge**: Maximum 200x200 (40000 pixels)
- **Animate with Skeleton**: 16x16, 32x32, 64x64, 128x128, 256x256
- **Animate with Text**: 64x64 only
- **Rotate**: 16x16, 32x32, 64x64, 128x128
- **Inpaint**: Maximum 200x200
- **Estimate Skeleton**: 16x16, 32x32, 64x64, 128x128, 256x256

## Response Format

All successful responses include:
- `image` or `images`: Base64 encoded PNG data
- `usage`: Credit usage information

## Error Codes

- `401`: Invalid API token
- `402`: Insufficient credits  
- `422`: Validation error
- `429`: Too many requests
- `529`: Rate limit exceeded