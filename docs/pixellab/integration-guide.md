# PixelLab API Integration Guide for GameGen

This guide covers integrating the PixelLab API into the GameGen Next.js application.

## Project Structure Integration

### API Client Setup

Create a centralized PixelLab client:

```typescript
// lib/pixellab/client.ts
import { PixelLabClient } from './types';

const PIXELLAB_API_TOKEN = process.env.PIXELLAB_API_TOKEN;

if (!PIXELLAB_API_TOKEN) {
    throw new Error('PIXELLAB_API_TOKEN environment variable is required');
}

export const pixelLabClient = new PixelLabClient({
    apiToken: PIXELLAB_API_TOKEN,
    baseUrl: 'https://api.pixellab.ai/v1'
});

// Health check function
export async function checkPixelLabHealth() {
    try {
        const balance = await pixelLabClient.getBalance();
        return { healthy: true, balance: balance.usd };
    } catch (error) {
        return { healthy: false, error: error.message };
    }
}
```

### Environment Configuration

```bash
# .env.local
PIXELLAB_API_TOKEN=your_pixellab_api_token_here

# Optional: Custom base URL for development
PIXELLAB_BASE_URL=https://api.pixellab.ai/v1
```

## API Routes Integration

### Image Generation Endpoints

```typescript
// pages/api/pixellab/generate.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { pixelLabClient } from '@/lib/pixellab/client';
import { GenerateImagePixfluxRequest } from '@/lib/pixellab/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const request: GenerateImagePixfluxRequest = req.body;
        
        // Validate request
        if (!request.description || !request.image_size) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await pixelLabClient.generateImagePixflux(request);
        
        res.status(200).json(result);
    } catch (error: any) {
        console.error('PixelLab API error:', error);
        
        const statusCode = error.status || 500;
        res.status(statusCode).json({ 
            error: error.message || 'Internal server error' 
        });
    }
}
```

### Animation Generation

```typescript
// pages/api/pixellab/animate.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { type, ...params } = req.body;

    try {
        let result;
        
        switch (type) {
            case 'skeleton':
                result = await pixelLabClient.animateWithSkeleton(params);
                break;
            case 'text':
                result = await pixelLabClient.animateWithText(params);
                break;
            default:
                return res.status(400).json({ error: 'Invalid animation type' });
        }

        res.status(200).json(result);
    } catch (error: any) {
        const statusCode = error.status || 500;
        res.status(statusCode).json({ error: error.message });
    }
}
```

## Frontend Integration

### React Hook for Image Generation

```typescript
// hooks/usePixelLabGeneration.ts
import { useState } from 'react';
import { GenerateImagePixfluxRequest, GenerateImagePixfluxResponse } from '@/lib/pixellab/types';

interface UsePixelLabGenerationResult {
    generating: boolean;
    error: string | null;
    result: GenerateImagePixfluxResponse | null;
    generateImage: (request: GenerateImagePixfluxRequest) => Promise<void>;
    reset: () => void;
}

export function usePixelLabGeneration(): UsePixelLabGenerationResult {
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<GenerateImagePixfluxResponse | null>(null);

    const generateImage = async (request: GenerateImagePixfluxRequest) => {
        setGenerating(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/pixellab/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Generation failed');
            }

            const data = await response.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setGenerating(false);
        }
    };

    const reset = () => {
        setError(null);
        setResult(null);
    };

    return { generating, error, result, generateImage, reset };
}
```

### Image Generation Component

```typescript
// components/pixellab/ImageGenerator.tsx
import { useState } from 'react';
import { usePixelLabGeneration } from '@/hooks/usePixelLabGeneration';

export function ImageGenerator() {
    const [description, setDescription] = useState('');
    const [imageSize, setImageSize] = useState({ width: 128, height: 128 });
    const { generating, error, result, generateImage, reset } = usePixelLabGeneration();

    const handleGenerate = async () => {
        await generateImage({
            description,
            image_size: imageSize,
            text_guidance_scale: 8.0,
            no_background: true
        });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-2">
                    Description
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Describe the image you want to generate..."
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Width</label>
                    <input
                        type="number"
                        value={imageSize.width}
                        onChange={(e) => setImageSize(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Height</label>
                    <input
                        type="number"
                        value={imageSize.height}
                        onChange={(e) => setImageSize(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                        className="w-full p-2 border rounded"
                    />
                </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={generating || !description.trim()}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded disabled:opacity-50"
            >
                {generating ? 'Generating...' : 'Generate Image'}
            </button>

            {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {result && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Generated Image</h3>
                        <span className="text-sm text-gray-500">
                            Credits used: {result.usage.credits}
                        </span>
                    </div>
                    <img
                        src={result.image.base64}
                        alt="Generated pixel art"
                        className="max-w-full h-auto border rounded pixelated"
                        style={{ imageRendering: 'pixelated' }}
                    />
                    <button
                        onClick={reset}
                        className="px-4 py-2 bg-gray-500 text-white rounded"
                    >
                        Generate Another
                    </button>
                </div>
            )}
        </div>
    );
}
```

## Game Creator Integration

### Asset Generation Pipeline

```typescript
// lib/gameAssets/pixelLabPipeline.ts
interface AssetGenerationPipeline {
    generateCharacterSprites: (description: string) => Promise<string[]>;
    generateEnvironmentTiles: (theme: string) => Promise<string[]>;
    generateAnimatedCharacter: (description: string, action: string) => Promise<string[]>;
}

export class PixelLabAssetPipeline implements AssetGenerationPipeline {
    async generateCharacterSprites(description: string): Promise<string[]> {
        const directions = ['north', 'east', 'south', 'west'];
        const sprites: string[] = [];

        for (const direction of directions) {
            const result = await pixelLabClient.generateImagePixflux({
                description: `${description} facing ${direction}`,
                image_size: { width: 32, height: 32 },
                view: 'side',
                direction: direction as any,
                no_background: true,
                outline: 'thick outline'
            });

            sprites.push(result.image.base64);
        }

        return sprites;
    }

    async generateEnvironmentTiles(theme: string): Promise<string[]> {
        const tileTypes = ['grass', 'stone', 'water', 'tree', 'rock'];
        const tiles: string[] = [];

        for (const tileType of tileTypes) {
            const result = await pixelLabClient.generateImagePixflux({
                description: `${theme} ${tileType} tile`,
                image_size: { width: 32, height: 32 },
                view: 'high top-down',
                detail: 'medium detail'
            });

            tiles.push(result.image.base64);
        }

        return tiles;
    }

    async generateAnimatedCharacter(description: string, action: string): Promise<string[]> {
        const result = await pixelLabClient.animateWithText({
            description,
            action,
            image_size: { width: 64, height: 64 },
            view: 'side',
            direction: 'south',
            n_frames: 4
        });

        return result.images.map(img => img.base64);
    }
}

export const assetPipeline = new PixelLabAssetPipeline();
```

### Game Creator Page Integration

```typescript
// pages/create/index.tsx - Updated with PixelLab integration
import { assetPipeline } from '@/lib/gameAssets/pixelLabPipeline';

export default function GameCreator() {
    const [generatingAssets, setGeneratingAssets] = useState(false);
    const [gameAssets, setGameAssets] = useState<{
        characters: string[];
        tiles: string[];
        animations: string[];
    }>({ characters: [], tiles: [], animations: [] });

    const handleGenerateAssets = async (gameTheme: string) => {
        setGeneratingAssets(true);

        try {
            const [characters, tiles, animations] = await Promise.all([
                assetPipeline.generateCharacterSprites(`${gameTheme} hero character`),
                assetPipeline.generateEnvironmentTiles(gameTheme),
                assetPipeline.generateAnimatedCharacter(`${gameTheme} character`, 'walk')
            ]);

            setGameAssets({ characters, tiles, animations });
        } catch (error) {
            console.error('Asset generation failed:', error);
        } finally {
            setGeneratingAssets(false);
        }
    };

    // ... rest of component
}
```

## Database Integration

### Asset Storage Schema

```sql
-- Add PixelLab integration fields to existing tables
ALTER TABLE game_assets ADD COLUMN pixellab_prompt TEXT;
ALTER TABLE game_assets ADD COLUMN pixellab_model VARCHAR(50);
ALTER TABLE game_assets ADD COLUMN pixellab_config JSONB;
ALTER TABLE game_assets ADD COLUMN credits_used INTEGER DEFAULT 0;

-- Create PixelLab generation history
CREATE TABLE pixellab_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    game_id UUID REFERENCES games(id),
    prompt TEXT NOT NULL,
    model_used VARCHAR(50) NOT NULL,
    config JSONB NOT NULL,
    result_image_url TEXT NOT NULL,
    credits_used INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Supabase Functions

```typescript
// lib/supabase/pixellab.ts
export async function savePixelLabGeneration(
    userId: string,
    gameId: string | null,
    prompt: string,
    modelUsed: string,
    config: any,
    resultImageUrl: string,
    creditsUsed: number
) {
    const { data, error } = await supabase
        .from('pixellab_generations')
        .insert({
            user_id: userId,
            game_id: gameId,
            prompt,
            model_used: modelUsed,
            config,
            result_image_url: resultImageUrl,
            credits_used: creditsUsed
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getPixelLabHistory(userId: string, limit = 50) {
    const { data, error } = await supabase
        .from('pixellab_generations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}
```

## Error Handling & Monitoring

### Comprehensive Error Handler

```typescript
// lib/pixellab/errorHandler.ts
export class PixelLabError extends Error {
    constructor(
        public status: number,
        message: string,
        public code?: string
    ) {
        super(message);
        this.name = 'PixelLabError';
    }
}

export function handlePixelLabError(error: any): PixelLabError {
    if (error.status) {
        switch (error.status) {
            case 401:
                return new PixelLabError(401, 'Invalid API token', 'INVALID_TOKEN');
            case 402:
                return new PixelLabError(402, 'Insufficient credits', 'INSUFFICIENT_CREDITS');
            case 422:
                return new PixelLabError(422, 'Invalid request parameters', 'VALIDATION_ERROR');
            case 429:
                return new PixelLabError(429, 'Too many requests', 'RATE_LIMITED');
            case 529:
                return new PixelLabError(529, 'Service rate limit exceeded', 'SERVICE_RATE_LIMITED');
            default:
                return new PixelLabError(error.status, error.message || 'Unknown error');
        }
    }
    
    return new PixelLabError(500, 'Internal server error');
}
```

### Health Monitoring

```typescript
// pages/api/health/pixellab.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const health = await checkPixelLabHealth();
        
        res.status(health.healthy ? 200 : 503).json({
            service: 'pixellab',
            status: health.healthy ? 'healthy' : 'unhealthy',
            balance: health.balance,
            error: health.error,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        res.status(503).json({
            service: 'pixellab',
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
```

## Testing Strategy

### Unit Tests

```typescript
// __tests__/pixellab/client.test.ts
import { pixelLabClient } from '@/lib/pixellab/client';

describe('PixelLab Client', () => {
    it('should generate image with valid request', async () => {
        const request = {
            description: 'test dragon',
            image_size: { width: 64, height: 64 }
        };

        const result = await pixelLabClient.generateImagePixflux(request);
        
        expect(result.image.base64).toMatch(/^data:image\/png;base64,/);
        expect(result.usage.credits).toBe(1);
    });

    it('should handle rate limiting gracefully', async () => {
        // Mock rate limit response
        jest.spyOn(global, 'fetch').mockResolvedValueOnce(
            new Response(null, { status: 429 })
        );

        await expect(
            pixelLabClient.generateImagePixflux({
                description: 'test',
                image_size: { width: 32, height: 32 }
            })
        ).rejects.toThrow('Too many requests');
    });
});
```

### Integration Tests

```typescript
// __tests__/api/pixellab.integration.test.ts
describe('PixelLab API Integration', () => {
    it('should generate assets through API route', async () => {
        const response = await request(app)
            .post('/api/pixellab/generate')
            .send({
                description: 'fantasy warrior',
                image_size: { width: 32, height: 32 }
            });

        expect(response.status).toBe(200);
        expect(response.body.image.base64).toBeDefined();
    });
});
```

## Deployment Considerations

### Environment Variables

```bash
# Production
PIXELLAB_API_TOKEN=prod_token_here

# Staging
PIXELLAB_API_TOKEN=staging_token_here

# Development
PIXELLAB_API_TOKEN=dev_token_here
```

### Rate Limiting

```typescript
// middleware/rateLimiting.ts
import { NextRequest } from 'next/server';

const rateLimiter = new Map();

export function checkRateLimit(req: NextRequest, userId: string): boolean {
    const key = `pixellab:${userId}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 10; // Max 10 requests per minute

    const userRequests = rateLimiter.get(key) || [];
    const validRequests = userRequests.filter((time: number) => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
        return false;
    }

    validRequests.push(now);
    rateLimiter.set(key, validRequests);
    return true;
}
```

This integration guide provides a comprehensive foundation for implementing PixelLab API functionality within the GameGen application architecture.