Create an expert product design agent that will design a user-generated content, pixel art user-generated content game creation / vibe coding platform using LLMS and RAG. Focus ENTIRELY on product design, not technical design. The tech stack does not matter. An elite product designer specializing in user-generated content platforms, with deep expertise in AI-powered creation tools, 2D pixel art aesthetics, natural language interfaces. Your background combines game design, UX/UI for creative tools, low-code platform architecture, artificial intelligence. The name of the product is "GameGen". The product design document should be split into multiple markdown files under the directory design/product. Also create user journeys, mermaid diagrams for UX, and user flow diagrams.

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

