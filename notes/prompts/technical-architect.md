Create an expert SaaS technical architect for a pixel art user-generated content game creation / vibe coding platform using LLMS and RAG. The stack being used is NextJS for a full stack react app, HeroUI (previously NextUI) for UI, Supabase for accounts, user data, and file storage (asset tagging, pulling, vector database semantic search, etc.), and Tauri for mobile deployment. The goal is to take the product design documents from design/product and generate technical design documents in markdown using this stack under design/technical. The LLM for code generation (Claude 4 Sonnet) should be swappable and we should return mocks in the beginning. We will use Claude Code CLI and MCP for backend RAG technology. It will also integrate Stripe integration for payments for subscriptions. Generate the documents under design/technical, and make sure to include ASCII diagrams, UX, front end and backend, etc. Use glassmorphic esign in the UI. Also take a look at /Users/troyedwards/dev/gamegen_nextjs/unrest_app, and copy as much stuff that is generalizable as possible.

Features include:
- A chat interface for vibe coding that using AIs / LLMs with a chat interface.
- AI agent has suggestions on game types, multiple choice for one shot "bullet hell, RPG, action-adventure, team deathmatch", etc.
- A game editor that runs on the web (we already have this, it's called Toxoid engine and it's a Rust WASM game engine that accepts JavaScript as scripts)
- AI agent using LLMs, RAG and other tool calls, tries to one shot game for you, and do QA on it's own to test the game and fix errors, you can stop this at any time, and toggle in options if you want to be able to be asked for approval so it doesn't use all your credits. This should be made very obvious in the UX so that users don't feel ripped off. 
- Web app for non-users contains landing page, explore (UGC content) page, pricing page, blog. Login + Signup / "Start creating now" redirect. 
- Web app for users contains dashboard, settings (including billing), and user generated content section to browse other peoples work. There should also be a section to view and play templates, and view community and official plugins and assets similar to the Unity asset store.
- Web app for users should be a game editor / creation page for you account where you start creating. This includes:
Left: Persistent - Chat Interface
Middle: Game editor screen with multiple tabs
 - Tab 1: Live play mode (similar to Unity player)
 - Tab 2: Game / Map editor
 - Tab 3: Code editor (JS scripts)
 Right: Persistent - Asset library that you can use to search assets and pull into the editor. 
 - Most of the time the chat should automatically generate assets for you based on context.
 - This is a software as a service with subscriptions tiers, based on AI credits. Free tier, Pro Tier, and Max tier. 
 - The ability to export games and use our assets is only available in the Pro tier or higher.
 - Any additional credits are pay per use.
 - Timeline for the project is 3 months.
 - Users need to be able to authenticate and share their projects. They can publish on the website / UGC platform in the free tier, but not export or profit off their games.
 - Splash screen is included in everything but max tier advertising GameGen at the beginning of the game.
 - Exports include desktop, web and mobile platforms, and come with the JavaScript code included and a binary of the engine. 
 - Design the app for web, desktop, and mobile, including UX and diagrams.


5. **Task Management**:
   - Create detailed Trello cards with:
      - Clear acceptance criteria including UnrestAI-specific requirements
      - Technical implementation notes 
      - Dependencies on UnrestAI node modules
      - Testing requirements for both web and Tauri desktop and mobile builds
   - Upload tasks to Trello board (ID: 68ba85662f8c4c4f08047e1a) in the backlog list using the Trello MCP
   - Use organization ID: 5fc3e364de7e7144735c3f1f