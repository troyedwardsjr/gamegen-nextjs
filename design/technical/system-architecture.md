# GameGen Platform: System Architecture Design

**Version**: 1.0  
**Date**: 2025-09-05  
**Timeline**: 3-month MVP development cycle  

## Executive Summary

GameGen is an AI-powered pixel art game creation platform built on a modern, scalable technology stack. This document outlines the comprehensive technical architecture for a full-stack NextJS application integrated with Supabase backend services, Toxoid game engine, and Claude 4 Sonnet LLM capabilities.

The architecture supports the platform's core mission: democratizing game development through natural language "vibe coding" while maintaining professional-grade capabilities for advanced users. The system is designed to handle 10,000+ concurrent users with sub-30-second game generation times and real-time collaborative editing.

## Technical Stack Overview

### Frontend Architecture
- **Framework**: NextJS 15.3+ (App Router, React 18.3+)
- **UI Library**: HeroUI (formerly NextUI) with glassmorphic design system
- **Styling**: TailwindCSS 4.1+ with custom design tokens
- **State Management**: React Server Components + Client Components hybrid
- **Animation**: Framer Motion for smooth transitions
- **Icons**: Lucide React with custom pixel art icon set

### Backend Services  
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with social providers
- **File Storage**: Supabase Storage with CDN delivery
- **Real-time**: Supabase Realtime for collaborative features
- **Vector Database**: Supabase pgvector for semantic search
- **Edge Functions**: Supabase Edge Functions for LLM processing

### Game Engine Integration
- **Engine**: Toxoid (Rust WASM) with QuickJS JavaScript runtime
- **Scripting Runtime**: QuickJS embedded in WASM (50MB memory, 1MB stack)
- **ECS System**: Flecs Entity Component System with JavaScript bindings
- **API Surface**: Comprehensive JavaScript API (Toxoid.API, Toxoid.System, Toxoid.Observer, Toxoid.Query)
- **Graphics**: WebGL-based pixel-perfect rendering with Spine animation support
- **Physics**: Built-in 2D physics with collision detection
- **Audio**: Web Audio API with spatial audio support
- **Input**: Cross-platform input handling (touch, keyboard, gamepad)

### AI/LLM Services
- **Primary LLM**: Claude 4 Sonnet via Anthropic API
- **Backup LLM**: Configurable provider fallback system
- **Script Generation**: Server-side Toxoid-compatible JavaScript generation
- **Code Patterns**: ECS-based game logic with Toxoid API integration
- **Image Generation**: Integration with Midjourney/DALL-E for pixel art
- **RAG System**: Supabase vector embeddings for context retrieval

### Cross-Platform Deployment
- **Web**: Progressive Web App (PWA) with offline support
- **Desktop**: Tauri 2.0 for native Windows/macOS/Linux apps
- **Mobile**: Capacitor for iOS/Android deployment
- **Distribution**: Multi-platform build pipeline

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        GameGen Platform                         │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (NextJS + HeroUI + Tauri)                           │
│  ┌───────────────┐ ┌──────────────┐ ┌─────────────────────────┐ │
│  │   Web App     │ │  Desktop App │ │      Mobile App         │ │
│  │   (PWA)       │ │   (Tauri)    │ │     (Capacitor)         │ │
│  └───────────────┘ └──────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Game Creation Interface                                        │
│  ┌─────────────┐ ┌───────────────┐ ┌─────────────────────────── │
│  │ Chat Panel  │ │ Editor Tabs   │ │    Asset Library         │ │
│  │ (LLM Chat)  │ │ • Live Play   │ │ • AI Generated          │ │
│  │ • Vibe Code │ │ • Map Editor  │ │ • Community Assets      │ │
│  │ • AI Assist │ │ • Code Editor │ │ • Template Library      │ │
│  └─────────────┘ └───────────────┘ └───────────────────────── │
├─────────────────────────────────────────────────────────────────┤
│  Game Engine Layer (Toxoid WASM + QuickJS)                    │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────────── │
│  │ QuickJS     │ │   ECS Core   │ │    Rendering Engine      │ │
│  │ Runtime     │ │ • Flecs      │ │ • WebGL + Pixel Art     │ │
│  │ • Script    │ │ • Components │ │ • Sprite Loading        │ │
│  │   Execution │ │ • Systems    │ │ • Spine Animations      │ │
│  │ • Memory    │ │ • Queries    │ │                         │ │
│  │   Sandbox   │ │ • Observers  │ │                         │ │
│  └─────────────┘ └──────────────┘ └───────────────────────── │
├─────────────────────────────────────────────────────────────────┤
│  Server-Side Script Generation                                │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────────── │
│  │   Script    │ │    Toxoid    │ │   Script Delivery       │ │
│  │ Generation  │ │   Pattern    │ │ • WebSocket/HTTP        │ │
│  │ • LLM Calls │ │  Generation  │ │ • Hot Reloading         │ │
│  │ • Context   │ │ • ECS Logic  │ │ • Error Handling        │ │
│  │   Injection │ │ • API Usage  │ │ • Validation            │ │
│  └─────────────┘ └──────────────┘ └───────────────────────── │
├─────────────────────────────────────────────────────────────────┤
│  API Layer (NextJS API Routes + Edge Functions)               │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────────── │
│  │   Game      │ │     AI       │ │      Export            │ │
│  │ Management  │ │  Generation  │ │   • Web Deploy         │ │
│  │ • CRUD Ops  │ │ • Script Gen │ │   • Mobile Build       │ │
│  │ • Collab    │ │ • Asset Gen  │ │   • Desktop Export     │ │
│  │ • Scripts   │ │ • LLM Calls  │ │   • Source Code        │ │
│  └─────────────┘ └──────────────┘ └───────────────────────── │
├─────────────────────────────────────────────────────────────────┤
│  Backend Services (Supabase)                                  │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────────── │
│  │  Database   │ │    Auth      │ │      Storage            │ │
│  │ • PostgreSQL│ │ • JWT Tokens │ │ • Game Assets          │ │
│  │ • RLS       │ │ • Social     │ │ • Generated Scripts    │ │
│  │ • Vector DB │ │ • MFA        │ │ • User Files           │ │
│  │ • Scripts   │ │              │ │ • CDN Delivery         │ │
│  └─────────────┘ └──────────────┘ └───────────────────────── │
├─────────────────────────────────────────────────────────────────┤
│  External Services                                             │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────────── │
│  │   Claude    │ │    Stripe    │ │       CDN                │ │
│  │ • Script    │ │ • Payments   │ │ • Asset Delivery        │ │
│  │   Generation│ │ • Billing    │ │ • Script Delivery       │ │
│  │ • Code Gen  │ │              │ │ • Global Cache          │ │
│  └─────────────┘ └──────────────┘ └───────────────────────── │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Component Hierarchy

```
App Layout (Root)
├── Navigation (Navbar)
│   ├── Logo & Branding
│   ├── Main Navigation Links  
│   ├── User Profile Dropdown
│   └── Theme Toggle
├── Main Content Area
│   ├── Landing Page (Public)
│   │   ├── Hero Section
│   │   ├── Feature Showcase
│   │   ├── Pricing Tiers
│   │   └── Community Gallery
│   ├── Dashboard (Authenticated)
│   │   ├── Project Grid
│   │   ├── Recent Activity
│   │   ├── Quick Actions
│   │   └── Statistics Cards
│   ├── Game Creator Interface
│   │   ├── Chat Panel (Left)
│   │   │   ├── Message History
│   │   │   ├── Input Field
│   │   │   ├── Suggestion Pills
│   │   │   └── Credit Usage Display
│   │   ├── Editor Tabs (Center)  
│   │   │   ├── Live Play Tab
│   │   │   ├── Map Editor Tab
│   │   │   ├── Code Editor Tab
│   │   │   └── Settings Tab
│   │   └── Asset Library (Right)
│   │       ├── Search Interface
│   │       ├── Category Filters
│   │       ├── Asset Grid
│   │       └── Upload Tools (Pro+)
│   ├── Community Features
│   │   ├── Game Gallery
│   │   ├── User Profiles
│   │   ├── Social Feed
│   │   └── Marketplace
│   └── Account Management
│       ├── Profile Settings
│       ├── Billing & Subscription
│       ├── Project History
│       └── API Keys (Max Tier)
└── Global Components
    ├── Modal System
    ├── Toast Notifications
    ├── Loading States
    └── Error Boundaries
```

### Backend Service Architecture

```
Database Layer (Supabase PostgreSQL)
├── Core Tables
│   ├── users (profiles, preferences, subscription)
│   ├── games (metadata, settings, collaboration)
│   ├── game_assets (sprites, audio, textures)
│   ├── game_versions (history, branches)
│   └── game_exports (builds, deployments)
├── Social Tables
│   ├── user_follows (social connections)
│   ├── game_likes (engagement tracking) 
│   ├── game_comments (community feedback)
│   └── collections (curated lists)
├── Marketplace Tables
│   ├── templates (reusable game structures)
│   ├── asset_packs (bundled resources)
│   ├── purchases (transaction history)
│   └── creator_earnings (revenue tracking)
├── Analytics Tables
│   ├── play_sessions (gameplay metrics)
│   ├── creation_events (editor usage)
│   ├── ai_generations (LLM usage stats)
│   └── performance_metrics (system health)
└── Vector Extensions
    ├── game_embeddings (semantic similarity)
    ├── asset_embeddings (visual similarity)
    └── user_embeddings (recommendation engine)

Authentication System (Supabase Auth)
├── OAuth Providers
│   ├── Google (primary)
│   ├── Discord (gaming community)
│   ├── GitHub (developers)
│   └── Apple (mobile users)
├── Security Features
│   ├── Multi-Factor Authentication
│   ├── Session Management
│   ├── Rate Limiting
│   └── Bot Protection
└── Role-Based Access Control
    ├── Free Tier (basic creation)
    ├── Pro Tier (advanced features)
    ├── Max Tier (commercial use)
    └── Educational (institutional)

Storage System (Supabase Storage)
├── Game Assets Bucket
│   ├── Sprites & Animations
│   ├── Audio Files
│   ├── Game Code
│   └── Exported Builds  
├── User Content Bucket
│   ├── Profile Images
│   ├── Custom Assets
│   └── Portfolio Media
├── Template Library Bucket
│   ├── Official Templates
│   ├── Community Templates
│   └── Educational Content
└── CDN Configuration
    ├── Global Edge Locations
    ├── Automatic Compression
    ├── Cache Strategies
    └── Bandwidth Optimization
```

## Data Flow Architecture

### Game Creation Workflow

```
User Input → LLM Processing → Script Generation → Client Execution → Live Preview
     ↓              ↓              ↓                ↓                ↓
   Natural      AI Analysis    Toxoid JS         QuickJS         User
  Language      + Context      Code Gen          Runtime         Testing
  Description   Retrieval      + ECS Logic       Execution       + Iteration
     ↓              ↓              ↓                ↓                ↓
  Saved to      Vector DB      Script            WASM             Auto-save
  Chat History  Embeddings     Delivery          Sandbox          to Database
```

### Script Generation & Execution Pipeline

```
User Prompt → RAG Context → LLM Script Gen → Validation → Client Delivery → QuickJS Exec
     ↓              ↓             ↓            ↓            ↓               ↓
  Game Idea     Code Examples  Toxoid API    Syntax       WebSocket/     Game Logic
  Description   + Patterns     JavaScript    Check        HTTP           Running
     ↓              ↓             ↓            ↓            ↓               ↓
  Context       Best Practice  ECS Systems   Security     Hot Reload     Real-time
  Building      Retrieval      + Components  Validation   Updates        Feedback
```

### Real-time Collaboration Flow

```
User A Edit → Conflict Detection → Operational Transform → Broadcast → User B Update
     ↓              ↓                    ↓                   ↓           ↓
  Local State    Server           Merge Resolution      WebSocket    Local State
  Update         Validation       Algorithm             Message      Synchronization
     ↓              ↓                    ↓                   ↓           ↓
  UI Update      Database         State                 All Users    Live Cursors
                 Persistence      Consensus             Notified     + Changes
```

### Asset Generation Pipeline  

```
User Request → Prompt Engineering → LLM Call → Image Processing → Integration
     ↓              ↓                   ↓            ↓              ↓
  Style +        Context             Claude/        Pixel Art      Game Engine
  Requirements   Enhancement         Midjourney     Optimization   Loading
     ↓              ↓                   ↓            ↓              ↓  
  Credit         RAG Context         API            Format         Automatic
  Deduction      Injection           Response       Conversion     Organization
```

## Performance Architecture

### Caching Strategy

- **Browser Cache**: Static assets, compiled game code
- **CDN Cache**: Images, audio, templates (24-hour TTL)
- **Database Cache**: Query results, user sessions (Redis)
- **LLM Cache**: Common generation requests (1-hour TTL)
- **Service Worker**: Offline game play, asset preloading

### Load Balancing

- **Geographic Distribution**: CDN edge locations worldwide
- **Auto-scaling**: Horizontal pod scaling based on CPU/memory
- **Database Scaling**: Read replicas, connection pooling  
- **API Rate Limiting**: Tier-based quotas, graceful degradation
- **Background Jobs**: Queue-based processing for exports

### Monitoring & Analytics

- **Performance Metrics**: Response times, throughput, error rates
- **User Analytics**: Engagement, retention, conversion funnels
- **Business Metrics**: Credit usage, subscription conversions
- **System Health**: Database performance, service availability
- **Security Monitoring**: Failed auth attempts, API abuse

## Security Architecture

### Authentication & Authorization

- **JWT Token Strategy**: Short-lived access tokens, refresh rotation
- **Row Level Security**: Database-level access control
- **API Key Management**: Tiered access levels, usage tracking
- **Session Security**: Secure cookies, CSRF protection
- **Privacy Controls**: GDPR compliance, data deletion

### Content Security

- **Input Validation**: Sanitization of user-generated content
- **Content Moderation**: AI-powered filtering, human review queue
- **Intellectual Property**: Plagiarism detection, licensing tracking
- **Code Injection**: Sandboxed game execution, script validation
- **Asset Verification**: Malware scanning, format validation

### Infrastructure Security

- **Network Security**: VPN access, firewall rules, DDoS protection
- **Data Encryption**: At-rest and in-transit encryption
- **Backup Strategy**: Automated backups, disaster recovery
- **Compliance**: SOC 2, COPPA (educational users), GDPR
- **Incident Response**: Automated alerting, escalation procedures

This system architecture provides a robust, scalable foundation for the GameGen platform that can grow from MVP to enterprise-scale deployment while maintaining performance and security standards.