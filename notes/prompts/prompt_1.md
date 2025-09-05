Update the technical design documents under ./design/technical using the saas-architect-gamegen subagent, updating it so that the LLM is generating game scripts on the serverside for Toxoid and executing it on the client side in WASM quickjs by running the script on the client. 
- Understand the scripting API for Toxoid through these paths:
   ```
   /Users/troyedwards/dev/gamegen_nextjs/worldlink/docs/scripting_api
   /Users/troyedwards/dev/gamegen_nextjs/worldlink/assets/scripts/examples
   /Users/troyedwards/dev/gamegen_nextjs/worldlink/dist/dev/index.html
   /Users/troyedwards/dev/gamegen_nextjs/worldlink/crates/toxoid_quickjs
   ```