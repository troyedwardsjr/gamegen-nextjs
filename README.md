# GameGen - AI-Powered Pixel Art Game Creation Platform

## Overview
GameGen is an innovative platform that empowers users to create pixel art games using AI assistance. Built with Next.js, Supabase, and TypeScript, it provides a comprehensive suite of tools for game development, asset creation, and community collaboration.

## Features
- 🎮 AI-powered game generation
- 🎨 Pixel art editor with AI assistance
- 🔐 Enterprise-grade authentication system
- 👥 Real-time collaboration
- 💳 Tiered subscription model (Free, Pro, Max, Educational)
- 🌍 Community marketplace
- 📚 Educational resources

## Tech Stack
- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **AI**: OpenAI, Claude, Custom LLMs
- **Styling**: TailwindCSS, Framer Motion
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- OAuth provider credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/troyedwardsjr/gamegen-nextjs.git
cd gamegen-nextjs
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Authentication System

The platform includes a comprehensive authentication system with:
- JWT token management
- Social OAuth providers (Google, Discord, GitHub, Apple)
- Multi-factor authentication (TOTP)
- Password security validation
- Email verification
- Account lockout protection
- Rate limiting
- Session management

## Project Structure
```
├── app/                  # Next.js app directory
├── components/          # React components
│   └── auth/           # Authentication components
├── lib/                # Utility libraries
│   └── auth/          # Authentication utilities
├── design/            # Design documents
│   ├── product/      # Product design specs
│   └── technical/    # Technical architecture
├── public/           # Static assets
└── qa/              # QA test reports
```

## Contributing
We welcome contributions! Please see our contributing guidelines for more information.

## License
MIT License - see LICENSE file for details

## Support
For support, email support@gamegen.com or join our Discord community.