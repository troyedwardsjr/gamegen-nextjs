# PixelLab API Authentication

The PixelLab API uses Bearer token authentication for all requests. You need to include your API token in the Authorization header of every request.

## Getting Your API Token

1. Create an account at [pixellab.ai](https://pixellab.ai)
2. Navigate to your [account settings](https://pixellab.ai/account)
3. Copy your API token

## Using Your Token

### HTTP Headers
Include your token in the Authorization header:

```http
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json
```

### Example Request

```bash
curl -X POST https://api.pixellab.ai/v1/generate-image-pixflux \
    -H "Authorization: Bearer YOUR_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "description": "cute dragon",
        "image_size": {"width": 128, "height": 128}
    }'
```

### JavaScript Example

```javascript
const response = await fetch('https://api.pixellab.ai/v1/generate-image-pixflux', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${YOUR_API_TOKEN}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        description: 'cute dragon',
        image_size: { width: 128, height: 128 }
    })
});

const result = await response.json();
```

### TypeScript with Fetch Wrapper

```typescript
interface PixelLabConfig {
    apiToken: string;
    baseUrl?: string;
}

class PixelLabClient {
    private config: PixelLabConfig;

    constructor(config: PixelLabConfig) {
        this.config = {
            baseUrl: 'https://api.pixellab.ai/v1',
            ...config
        };
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.config.baseUrl}${endpoint}`;
        
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.config.apiToken}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    async generateImagePixflux(params: GenerateImagePixfluxRequest) {
        return this.request<GenerateImagePixfluxResponse>('/generate-image-pixflux', {
            method: 'POST',
            body: JSON.stringify(params)
        });
    }
}
```

## Environment Variables

### Development Environment
Store your API token securely using environment variables:

```bash
# .env.local
PIXELLAB_API_TOKEN=your_api_token_here
```

### Next.js Integration

```typescript
// lib/pixellab.ts
const PIXELLAB_API_TOKEN = process.env.PIXELLAB_API_TOKEN;

if (!PIXELLAB_API_TOKEN) {
    throw new Error('PIXELLAB_API_TOKEN environment variable is required');
}

export const pixelLabClient = new PixelLabClient({
    apiToken: PIXELLAB_API_TOKEN
});
```

## Error Handling

### Authentication Errors

```typescript
interface APIError {
    status: number;
    message: string;
}

async function handleApiRequest<T>(request: Promise<T>): Promise<T> {
    try {
        return await request;
    } catch (error: any) {
        switch (error.status) {
            case 401:
                throw new Error('Invalid API token. Please check your credentials.');
            case 402:
                throw new Error('Insufficient credits. Please add more credits to your account.');
            case 429:
                throw new Error('Too many requests. Please wait before retrying.');
            case 529:
                throw new Error('Rate limit exceeded. Please implement exponential backoff.');
            default:
                throw error;
        }
    }
}
```

### Retry Logic with Exponential Backoff

```typescript
async function apiRequestWithRetry<T>(
    requestFn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await requestFn();
        } catch (error: any) {
            lastError = error;
            
            // Don't retry on authentication or validation errors
            if ([401, 422].includes(error.status)) {
                throw error;
            }
            
            // Calculate delay for exponential backoff
            const delay = baseDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError!;
}
```

## Security Best Practices

### 1. Server-Side Only
Never expose your API token in client-side code:

```typescript
// ❌ DON'T: Client-side token exposure
const apiToken = 'your_token_here'; // Visible in browser

// ✅ DO: Server-side API calls only
export async function generatePixelArt(description: string) {
    const token = process.env.PIXELLAB_API_TOKEN; // Server-side only
    // ... make API call
}
```

### 2. Environment Variables
Use environment variables for token storage:

```bash
# Production
PIXELLAB_API_TOKEN=prod_token_here

# Development  
PIXELLAB_API_TOKEN=dev_token_here

# Testing
PIXELLAB_API_TOKEN=test_token_here
```

### 3. Token Rotation
Regularly rotate your API tokens:

```typescript
interface TokenConfig {
    current: string;
    backup?: string;
    expiresAt?: Date;
}

class SecurePixelLabClient {
    private tokens: TokenConfig;
    
    async rotateToken(newToken: string) {
        this.tokens.backup = this.tokens.current;
        this.tokens.current = newToken;
    }
}
```

## Testing Authentication

### Unit Tests

```typescript
import { pixelLabClient } from '@/lib/pixellab';

describe('PixelLab Authentication', () => {
    it('should authenticate successfully with valid token', async () => {
        const balance = await pixelLabClient.getBalance();
        expect(balance.usd).toBeGreaterThanOrEqual(0);
    });

    it('should handle invalid token gracefully', async () => {
        const invalidClient = new PixelLabClient({ apiToken: 'invalid_token' });
        
        await expect(invalidClient.getBalance()).rejects.toThrow('Invalid API token');
    });
});
```

### Health Check Endpoint

```typescript
// pages/api/health/pixellab.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const balance = await pixelLabClient.getBalance();
        res.status(200).json({ 
            status: 'healthy', 
            balance: balance.usd,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'unhealthy', 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
```