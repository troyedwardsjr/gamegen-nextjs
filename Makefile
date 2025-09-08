# Development Commands
dev-mode-on: ## Enable development mode (bypass authentication for local testing)
	node scripts/toggle-dev-mode.js on

dev-mode-off: ## Disable development mode (require normal authentication)  
	node scripts/toggle-dev-mode.js off

dev-mode-status: ## Show current development mode status
	node scripts/toggle-dev-mode.js

dev-with-auth-bypass: ## Start development server with authentication bypass enabled
	node scripts/toggle-dev-mode.js on && npm run dev

# Legacy commands for unrest_app template (kept for compatibility)
unrest-dev-mode-on: ## Enable development mode in unrest_app template
	cd unrest_app/nextjs_app && npm run dev-mode:on

unrest-dev-mode-off: ## Disable development mode in unrest_app template
	cd unrest_app/nextjs_app && npm run dev-mode:off

# Claude integration
claude: ## Launch Claude with proper permissions
	claude --dangerously-skip-permissions --verbose

run-agent:
	cd agent_scripts && make run-dev board_id=68ba85662f8c4c4f08047e1a suffix="Develop the features on the Trello taskboard by using the fullstack-pixel-game-engineer subagent to develop / implement the features and make sure to use the playwright MCP to verify the features, open google chrome in debug mode if you have to, then use the qa-tester-nextjs-saas subagent to test the features. Make sure that the engineer agent creates a new branch as based on the feature as soon as they have information about it, based off the current branch. Have them communicate with each other and chain them in a loop so that the qa-tester-nextjs-saas agent will report bugs and issues back to the fullstack-pixel-game-engineer agent to fix them. Whenever you think the agent needs a previous memory, call the openmemory mcp server tool command "search-memories" or "list-memories" to find the memory you need. Whenever the agent needs to understand the codebase, call the claude context mcp server tool command "search_code". Whenever the agent is confused about API usage, use the rag-docs mcp server tool command "search_documentation" to search the codebase for the API usage. For every feature that the agent implements from the trello board, use the MCP server tool commands for git to first checkout the current branch, then create a new branch with the name of the feature, then commit the changes, then push the changes to the remote repository using the Github MCP server tool commands, then create a pull request to the current branch for review. The primary job of this software engineer is to take the technical design documents specified under ./design/technical to understand the project, understand the product and UX design under ./design/product."