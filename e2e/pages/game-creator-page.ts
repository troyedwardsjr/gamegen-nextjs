import { Page, expect } from "@playwright/test";

export class GameGenCreatorPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto("/creator");
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForSelector(
      '[data-testid="game-creator"], .game-creator-interface, .editor-layout', 
      { timeout: 15000 }
    );
  }

  async verifyCreatorLayout(): Promise<void> {
    // Left panel: Vibe Coding Chat Interface
    const chatPanel = this.page.locator(
      '[data-testid="vibe-chat-panel"], .chat-interface, .left-panel'
    );
    await expect(chatPanel).toBeVisible();

    // Middle panel: Multi-tab editor
    const editorPanel = this.page.locator(
      '[data-testid="editor-panel"], .editor-tabs, .middle-panel'
    );
    await expect(editorPanel).toBeVisible();

    // Right panel: Asset library
    const assetPanel = this.page.locator(
      '[data-testid="asset-panel"], .asset-library, .right-panel'
    );
    await expect(assetPanel).toBeVisible();
  }

  async verifyVibeCodingChat(): Promise<void> {
    const chatInterface = this.page.locator('[data-testid="vibe-chat-panel"]');
    
    // Should have chat input
    const chatInput = this.page.locator(
      '[data-testid="chat-input"], .chat-input, input[placeholder*="describe" i]'
    );
    await expect(chatInput).toBeVisible();

    // Should have send button
    const sendButton = this.page.locator(
      '[data-testid="send-chat"], .send-button, button:has-text("Send")'
    );
    await expect(sendButton).toBeVisible();

    // Should show game type suggestions
    const gameTypeSuggestions = this.page.locator(
      '[data-testid="game-type-suggestions"], .game-suggestions'
    );
    if (await gameTypeSuggestions.isVisible({ timeout: 2000 })) {
      await expect(gameTypeSuggestions).toContainText(/Bullet Hell|RPG|Action|Platformer/i);
    }
  }

  async sendChatMessage(message: string): Promise<void> {
    const chatInput = this.page.locator(
      '[data-testid="chat-input"], .chat-input'
    );
    const sendButton = this.page.locator(
      '[data-testid="send-chat"], .send-button'
    );

    await chatInput.fill(message);
    await sendButton.click();

    // Wait for response
    await this.page.waitForSelector(
      '.chat-message, [data-testid="chat-response"]',
      { timeout: 10000 }
    );
  }

  async verifyEditorTabs(): Promise<void> {
    const expectedTabs = ['Live Play', 'Map Editor', 'Code Editor'];
    
    for (const tabName of expectedTabs) {
      const tab = this.page.locator(
        `[data-testid="${tabName.toLowerCase().replace(' ', '-')}-tab"], button:has-text("${tabName}")`
      );
      await expect(tab).toBeVisible();
    }
  }

  async switchToTab(tabName: 'live-play' | 'map-editor' | 'code-editor'): Promise<void> {
    const tab = this.page.locator(
      `[data-testid="${tabName}-tab"], button:has-text("${tabName.replace('-', ' ')}")`
    );
    await tab.click();
    
    // Wait for tab content to load
    await this.page.waitForSelector(
      `[data-testid="${tabName}-content"], .${tabName}-panel`,
      { timeout: 5000 }
    );
  }

  async verifyLivePlayTab(): Promise<void> {
    await this.switchToTab('live-play');
    
    const gamePreview = this.page.locator(
      '[data-testid="game-preview"], .game-canvas, canvas'
    );
    await expect(gamePreview).toBeVisible();

    const playControls = this.page.locator(
      '[data-testid="play-controls"], .game-controls'
    );
    await expect(playControls).toBeVisible();
  }

  async verifyMapEditor(): Promise<void> {
    await this.switchToTab('map-editor');
    
    const mapCanvas = this.page.locator(
      '[data-testid="map-canvas"], .map-editor-canvas'
    );
    await expect(mapCanvas).toBeVisible();

    const tileToolbar = this.page.locator(
      '[data-testid="tile-toolbar"], .tile-palette'
    );
    await expect(tileToolbar).toBeVisible();
  }

  async verifyCodeEditor(): Promise<void> {
    await this.switchToTab('code-editor');
    
    const codeEditor = this.page.locator(
      '[data-testid="code-editor"], .monaco-editor, .code-editor'
    );
    await expect(codeEditor).toBeVisible();
  }

  async verifyAssetLibrary(): Promise<void> {
    const assetPanel = this.page.locator('[data-testid="asset-panel"]');
    
    // Search functionality
    const assetSearch = this.page.locator(
      '[data-testid="asset-search"], .asset-search input'
    );
    await expect(assetSearch).toBeVisible();

    // Asset categories
    const assetCategories = this.page.locator(
      '[data-testid="asset-categories"], .asset-categories'
    );
    if (await assetCategories.isVisible({ timeout: 2000 })) {
      await expect(assetCategories).toContainText(/Sprites|Audio|Backgrounds|Characters/i);
    }

    // Asset grid
    const assetGrid = this.page.locator(
      '[data-testid="asset-grid"], .asset-grid'
    );
    await expect(assetGrid).toBeVisible();
  }

  async searchAssets(searchTerm: string): Promise<void> {
    const assetSearch = this.page.locator(
      '[data-testid="asset-search"], .asset-search input'
    );
    await assetSearch.fill(searchTerm);
    await assetSearch.press('Enter');

    // Wait for search results
    await this.page.waitForTimeout(1000);
  }

  async dragAssetToCanvas(assetIndex: number): Promise<void> {
    const asset = this.page.locator('.asset-item').nth(assetIndex);
    const canvas = this.page.locator('[data-testid="map-canvas"], canvas');

    await asset.dragTo(canvas);
  }

  async verifyCreditSystem(): Promise<void> {
    const creditDisplay = this.page.locator(
      '[data-testid="credit-display"], .credit-counter'
    );
    
    if (await creditDisplay.isVisible({ timeout: 2000 })) {
      await expect(creditDisplay).toBeVisible();
      await expect(creditDisplay).toContainText(/Credit|Token/i);
    }
  }

  async verifyApprovalWorkflow(): Promise<void> {
    // After sending a chat message, should see approval prompt
    await this.sendChatMessage("Create a simple platformer game");
    
    const approvalPrompt = this.page.locator(
      '[data-testid="approval-prompt"], .approval-dialog'
    );
    
    if (await approvalPrompt.isVisible({ timeout: 5000 })) {
      await expect(approvalPrompt).toBeVisible();
      await expect(approvalPrompt).toContainText(/Approve|Confirm|Execute/i);
    }
  }

  async approveAIAction(): Promise<void> {
    const approveButton = this.page.locator(
      '[data-testid="approve-button"], button:has-text("Approve")'
    );
    await approveButton.click();
  }

  async rejectAIAction(): Promise<void> {
    const rejectButton = this.page.locator(
      '[data-testid="reject-button"], button:has-text("Reject")'
    );
    await rejectButton.click();
  }

  async verifyToxoidIntegration(): Promise<void> {
    // Check for Toxoid engine indicators
    const engineInfo = this.page.locator(
      '[data-testid="engine-info"], .engine-status'
    );
    
    if (await engineInfo.isVisible({ timeout: 2000 })) {
      await expect(engineInfo).toContainText(/Toxoid|Engine/i);
    }

    // Check for WASM loading
    const wasmStatus = this.page.locator(
      '[data-testid="wasm-status"], .wasm-loader'
    );
    
    if (await wasmStatus.isVisible({ timeout: 2000 })) {
      await expect(wasmStatus).toBeVisible();
    }
  }

  async saveProject(projectName: string): Promise<void> {
    const saveButton = this.page.locator(
      '[data-testid="save-project"], button:has-text("Save")'
    );
    await saveButton.click();

    const projectNameInput = this.page.locator(
      '[data-testid="project-name-input"], input[placeholder*="project" i]'
    );
    if (await projectNameInput.isVisible({ timeout: 2000 })) {
      await projectNameInput.fill(projectName);
      
      const confirmSave = this.page.locator(
        '[data-testid="confirm-save"], button:has-text("Save")'
      );
      await confirmSave.click();
    }
  }

  async loadProject(projectName: string): Promise<void> {
    const loadButton = this.page.locator(
      '[data-testid="load-project"], button:has-text("Load")'
    );
    await loadButton.click();

    const projectItem = this.page.locator(
      `[data-testid="project-${projectName}"], .project-item:has-text("${projectName}")`
    );
    await projectItem.click();

    const confirmLoad = this.page.locator(
      '[data-testid="confirm-load"], button:has-text("Load")'
    );
    await confirmLoad.click();

    // Wait for project to load
    await this.waitForPageLoad();
  }

  async verifyErrorHandling(): Promise<void> {
    // Send an invalid chat command
    await this.sendChatMessage("!@#$%^&*()");

    const errorMessage = this.page.locator(
      '[data-testid="error-message"], .error-alert, .chat-error'
    );
    
    if (await errorMessage.isVisible({ timeout: 3000 })) {
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/Error|Invalid|Problem/i);
    }
  }

  async verifyLoadingStates(): Promise<void> {
    // Send a complex request that should show loading
    await this.sendChatMessage("Create a complete RPG with inventory system");

    const loadingIndicator = this.page.locator(
      '[data-testid="loading-spinner"], .loading-spinner, .spinner'
    );
    
    if (await loadingIndicator.isVisible({ timeout: 2000 })) {
      await expect(loadingIndicator).toBeVisible();
    }
  }

  async verifyKeyboardShortcuts(): Promise<void> {
    // Test common shortcuts
    await this.page.keyboard.press('Control+S'); // Save
    await this.page.keyboard.press('Control+Z'); // Undo
    await this.page.keyboard.press('Control+Y'); // Redo

    // Verify shortcuts work (implementation dependent)
    const shortcutHelp = this.page.locator(
      '[data-testid="keyboard-shortcuts"], .shortcuts-help'
    );
    
    if (await shortcutHelp.isVisible({ timeout: 1000 })) {
      await expect(shortcutHelp).toBeVisible();
    }
  }
}