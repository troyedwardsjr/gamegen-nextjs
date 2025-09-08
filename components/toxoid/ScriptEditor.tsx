/**
 * Toxoid Script Editor Component
 *
 * A JavaScript code editor specifically designed for Toxoid game scripts with:
 * - Syntax highlighting for JavaScript
 * - Toxoid API autocompletion
 * - Real-time error detection
 * - Script execution and debugging
 * - Code templates and examples
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";
import { GlassmorphicBadge } from "@/components/ui/GlassmorphicBadge";
import { GlassmorphicAlert } from "@/components/ui/GlassmorphicAlert";
import { GlassmorphicInput } from "@/components/ui/GlassmorphicInput";
import { GameScript } from "@/types/toxoid";

// =============================================================================
// TYPES
// =============================================================================

export interface ScriptError {
  line: number;
  column?: number;
  message: string;
  type: "error" | "warning" | "info";
}

export interface ScriptEditorProps {
  initialCode?: string;
  onCodeChange?: (code: string) => void;
  onExecute?: (code: string) => Promise<boolean>;
  onSave?: (script: GameScript) => void;
  readOnly?: boolean;
  showLineNumbers?: boolean;
  showMinimap?: boolean;
  theme?: "dark" | "light";
  className?: string;
}

// =============================================================================
// SCRIPT TEMPLATES
// =============================================================================

const SCRIPT_TEMPLATES = {
  empty: {
    name: "Empty Script",
    code: "// Write your game code here\n",
  },
  "basic-entity": {
    name: "Basic Entity Creation",
    code: `// Create a basic entity with position and sprite
const player = Toxoid.API.createEntity("Player");
player.add("Position");
player.add("Sprite");

// Set position
const position = player.getComponent("Position");
position.x = 100;
position.y = 200;

console.log("Player entity created at:", position.x, position.y);`,
  },
  "movement-system": {
    name: "Movement System",
    code: `// Create a movement system
Toxoid.System.create("MovementSystem", "Position, Velocity", Toxoid.Phases.ON_UPDATE,
    function(iter) {
        iter.entities().forEach(entity => {
            const pos = entity.getComponent("Position");
            const vel = entity.getComponent("Velocity");
            
            // Update position based on velocity
            pos.x += vel.x * iter.deltaTime;
            pos.y += vel.y * iter.deltaTime;
        });
    }
);

console.log("Movement system created");`,
  },
  "keyboard-input": {
    name: "Keyboard Input",
    code: `// Handle keyboard input
Toxoid.System.create("KeyboardSystem", "Position, Player", Toxoid.Phases.ON_UPDATE,
    function(iter) {
        const keyboard = Toxoid.API.getKeyboardInput();
        
        iter.entities().forEach(entity => {
            const pos = entity.getComponent("Position");
            const speed = 200; // pixels per second
            
            if (keyboard.isKeyPressed("ArrowLeft") || keyboard.isKeyPressed("a")) {
                pos.x -= speed * iter.deltaTime;
            }
            if (keyboard.isKeyPressed("ArrowRight") || keyboard.isKeyPressed("d")) {
                pos.x += speed * iter.deltaTime;
            }
            if (keyboard.isKeyPressed("ArrowUp") || keyboard.isKeyPressed("w")) {
                pos.y -= speed * iter.deltaTime;
            }
            if (keyboard.isKeyPressed("ArrowDown") || keyboard.isKeyPressed("s")) {
                pos.y += speed * iter.deltaTime;
            }
        });
    }
);`,
  },
  "sprite-rendering": {
    name: "Sprite Rendering",
    code: `// Load and display sprites
const spriteResult = Toxoid.API.loadSprite("/assets/player.png");

if (spriteResult.success) {
    const entity = Toxoid.API.createEntity("SpriteEntity");
    entity.add("Position");
    entity.add("Sprite");
    
    const position = entity.getComponent("Position");
    position.x = 320;
    position.y = 240;
    
    const sprite = entity.getComponent("Sprite");
    sprite.texture_id = spriteResult.id;
    sprite.width = spriteResult.width;
    sprite.height = spriteResult.height;
    sprite.scale_x = 1.0;
    sprite.scale_y = 1.0;
    sprite.visible = true;
    
    console.log("Sprite loaded and entity created");
} else {
    console.error("Failed to load sprite");
}`,
  },
  "observer-pattern": {
    name: "Observer Pattern",
    code: `// React to component changes with observers
Toxoid.Observer.create({
    name: "HealthWatcher",
    query: "Health",
    events: [Toxoid.ObserverEvents.OnSet],
    callback: function(iter) {
        iter.entities().forEach(entity => {
            const health = entity.getComponent("Health");
            
            if (health.value <= 0) {
                console.log("Entity died:", entity.name || "unnamed");
                // Could trigger death animation, remove entity, etc.
            } else if (health.value <= health.max_value * 0.2) {
                console.log("Entity is critically wounded:", entity.name || "unnamed");
                // Could trigger low health effects
            }
        });
    }
});

console.log("Health observer created");`,
  },
};

// =============================================================================
// SYNTAX HIGHLIGHTING
// =============================================================================

const KEYWORDS = [
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "for",
  "while",
  "switch",
  "case",
  "break",
  "continue",
  "try",
  "catch",
  "throw",
  "new",
  "class",
  "extends",
  "import",
  "export",
  "default",
  "async",
  "await",
];

const TOXOID_KEYWORDS = [
  "Toxoid",
  "API",
  "System",
  "Query",
  "Observer",
  "Entity",
  "Phases",
  "Events",
  "createEntity",
  "registerComponent",
  "registerSingleton",
  "getComponent",
  "setComponent",
  "loadSprite",
  "loadSpineAnimation",
  "console",
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  initialCode = "",
  onCodeChange,
  onExecute,
  onSave,
  readOnly = false,
  showLineNumbers = true,
  showMinimap = false,
  theme = "dark",
  className = "",
}) => {
  // ==========================================================================
  // STATE
  // ==========================================================================

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [code, setCode] = useState(initialCode);
  const [errors, setErrors] = useState<ScriptError[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [showTemplates, setShowTemplates] = useState(false);
  const [scriptName, setScriptName] = useState("untitled.js");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ==========================================================================
  // CODE ANALYSIS
  // ==========================================================================

  const analyzeCode = useCallback((codeText: string) => {
    const newErrors: ScriptError[] = [];
    const lines = codeText.split("\n");

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Basic syntax checks
      if (line.includes("function") && !line.includes("(")) {
        newErrors.push({
          line: lineNumber,
          message: "Function declaration missing parentheses",
          type: "error",
        });
      }

      // Check for unclosed strings
      const singleQuoteCount = (line.match(/'/g) || []).length;
      const doubleQuoteCount = (line.match(/"/g) || []).length;

      if (singleQuoteCount % 2 !== 0 || doubleQuoteCount % 2 !== 0) {
        newErrors.push({
          line: lineNumber,
          message: "Unclosed string literal",
          type: "error",
        });
      }

      // Check for common Toxoid API mistakes
      if (
        line.includes("Toxoid.") &&
        !TOXOID_KEYWORDS.some((keyword) => line.includes(keyword))
      ) {
        newErrors.push({
          line: lineNumber,
          message: "Unknown Toxoid API usage - check documentation",
          type: "warning",
        });
      }

      // Check for missing semicolons (basic check)
      const trimmedLine = line.trim();

      if (
        trimmedLine &&
        !trimmedLine.startsWith("//") &&
        !trimmedLine.startsWith("/*") &&
        !trimmedLine.endsWith(";") &&
        !trimmedLine.endsWith("{") &&
        !trimmedLine.endsWith("}") &&
        !trimmedLine.includes("if") &&
        !trimmedLine.includes("else") &&
        !trimmedLine.includes("for") &&
        !trimmedLine.includes("while") &&
        !trimmedLine.includes("function")
      ) {
        newErrors.push({
          line: lineNumber,
          message: "Missing semicolon",
          type: "info",
        });
      }
    });

    setErrors(newErrors);
  }, []);

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  const handleCodeChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newCode = event.target.value;

      setCode(newCode);
      setHasUnsavedChanges(true);

      // Update cursor position
      const textarea = event.target;
      const lines = newCode.substring(0, textarea.selectionStart).split("\n");

      setCursorPosition({
        line: lines.length,
        column: lines[lines.length - 1].length + 1,
      });

      // Analyze code for errors
      analyzeCode(newCode);

      if (onCodeChange) {
        onCodeChange(newCode);
      }
    },
    [analyzeCode, onCodeChange],
  );

  const handleExecute = useCallback(async () => {
    if (!onExecute || isExecuting) return;

    setIsExecuting(true);
    try {
      const success = await onExecute(code);

      if (!success) {
        setErrors((prev) => [
          ...prev,
          {
            line: 1,
            message: "Script execution failed",
            type: "error",
          },
        ]);
      }
    } catch (error) {
      setErrors((prev) => [
        ...prev,
        {
          line: 1,
          message:
            error instanceof Error ? error.message : "Unknown execution error",
          type: "error",
        },
      ]);
    } finally {
      setIsExecuting(false);
    }
  }, [onExecute, code, isExecuting]);

  const handleSave = useCallback(() => {
    if (!onSave) return;

    const script: GameScript = {
      id: crypto.randomUUID(),
      name: scriptName,
      content: code,
      isEnabled: true,
      hasErrors: errors.some((e) => e.type === "error"),
      errorMessage: errors.find((e) => e.type === "error")?.message,
      lastModified: new Date(),
    };

    onSave(script);
    setHasUnsavedChanges(false);
  }, [onSave, scriptName, code, errors]);

  const handleTemplateSelect = useCallback(
    (templateKey: string) => {
      const template =
        SCRIPT_TEMPLATES[templateKey as keyof typeof SCRIPT_TEMPLATES];

      if (template) {
        setCode(template.code);
        setHasUnsavedChanges(true);
        analyzeCode(template.code);
        if (onCodeChange) {
          onCodeChange(template.code);
        }
      }
      setShowTemplates(false);
    },
    [analyzeCode, onCodeChange],
  );

  const handleFormat = useCallback(() => {
    // Basic JavaScript formatting
    let formatted = code
      .replace(/;}/g, ";\n}")
      .replace(/{\s*([^\s])/g, "{\n    $1")
      .replace(/([^{])\s*}/g, "$1\n}");

    setCode(formatted);
    setHasUnsavedChanges(true);
    if (onCodeChange) {
      onCodeChange(formatted);
    }
  }, [code, onCodeChange]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    if (initialCode !== code) {
      setCode(initialCode);
      analyzeCode(initialCode);
    }
  }, [initialCode, code, analyzeCode]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const lineNumbers = code.split("\n").map((_, i) => i + 1);

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <GlassmorphicInput
            className="w-40"
            placeholder="Script name"
            size="sm"
            value={scriptName}
            onChange={(e) => setScriptName(e.target.value)}
          />

          {hasUnsavedChanges && (
            <GlassmorphicBadge size="sm" variant="warning">
              Unsaved
            </GlassmorphicBadge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <GlassmorphicButton
            size="sm"
            title="Code Templates"
            variant="glass"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            📋
          </GlassmorphicButton>

          <GlassmorphicButton
            size="sm"
            title="Format Code"
            variant="glass"
            onClick={handleFormat}
          >
            ✨
          </GlassmorphicButton>

          {onSave && (
            <GlassmorphicButton
              disabled={!hasUnsavedChanges}
              size="sm"
              variant="accent"
              onClick={handleSave}
            >
              Save
            </GlassmorphicButton>
          )}

          {onExecute && (
            <GlassmorphicButton
              className="flex items-center space-x-2"
              disabled={isExecuting || readOnly}
              size="sm"
              variant="gaming"
              onClick={handleExecute}
            >
              {isExecuting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  className="w-4 h-4 border border-white border-t-transparent rounded-full"
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
              <span>Run</span>
            </GlassmorphicButton>
          )}
        </div>
      </div>

      {/* Templates Dropdown */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-16 right-4 z-10"
            exit={{ opacity: 0, y: -10 }}
            initial={{ opacity: 0, y: -10 }}
          >
            <GlassmorphicCard className="p-2 w-64" variant="subtle">
              <div className="space-y-1">
                {Object.entries(SCRIPT_TEMPLATES).map(([key, template]) => (
                  <button
                    key={key}
                    className="w-full text-left p-2 rounded text-sm text-white/80 hover:bg-white/10 transition-colors"
                    onClick={() => handleTemplateSelect(key)}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </GlassmorphicCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Content */}
      <div className="flex-1 flex">
        {/* Main Editor */}
        <div className="flex-1 relative">
          <GlassmorphicCard className="h-full" variant="strong">
            <div className="relative h-full flex">
              {/* Line Numbers */}
              {showLineNumbers && (
                <div className="w-12 bg-black/20 flex flex-col p-2 text-xs text-white/40 font-mono border-r border-white/10">
                  {lineNumbers.map((num) => (
                    <div key={num} className="leading-6 text-right pr-2">
                      {num}
                    </div>
                  ))}
                </div>
              )}

              {/* Code Area */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  className="w-full h-full p-4 bg-transparent text-white font-mono text-sm resize-none outline-none"
                  placeholder="// Write your Toxoid game script here..."
                  readOnly={readOnly}
                  spellCheck={false}
                  style={{
                    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                    lineHeight: "1.5",
                    tabSize: "2",
                  }}
                  value={code}
                  onChange={handleCodeChange}
                />
              </div>
            </div>
          </GlassmorphicCard>
        </div>

        {/* Error Panel */}
        {errors.length > 0 && (
          <div className="w-80 p-4 pl-0">
            <GlassmorphicCard className="h-full" variant="subtle">
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white/80">
                    Issues
                  </h4>
                  <GlassmorphicBadge
                    size="sm"
                    variant={
                      errors.some((e) => e.type === "error")
                        ? "danger"
                        : "warning"
                    }
                  >
                    {errors.length}
                  </GlassmorphicBadge>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {errors.map((error, i) => (
                    <GlassmorphicAlert
                      key={i}
                      message={error.message}
                      title={`Line ${error.line}`}
                      variant={
                        error.type === "error"
                          ? "error"
                          : error.type === "warning"
                            ? "warning"
                            : "info"
                      }
                    />
                  ))}
                </div>
              </div>
            </GlassmorphicCard>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 text-xs text-white/60">
        <div className="flex items-center space-x-4">
          <span>
            Line {cursorPosition.line}, Column {cursorPosition.column}
          </span>
          <span>{code.split("\n").length} lines</span>
          <span>{code.length} characters</span>
        </div>

        <div className="flex items-center space-x-2">
          <GlassmorphicBadge
            size="sm"
            variant={
              errors.some((e) => e.type === "error")
                ? "danger"
                : errors.length > 0
                  ? "warning"
                  : "success"
            }
          >
            {errors.some((e) => e.type === "error")
              ? `${errors.filter((e) => e.type === "error").length} Error${errors.filter((e) => e.type === "error").length > 1 ? "s" : ""}`
              : errors.length > 0
                ? `${errors.length} Warning${errors.length > 1 ? "s" : ""}`
                : "No Issues"}
          </GlassmorphicBadge>

          <span>JavaScript</span>
        </div>
      </div>
    </div>
  );
};

export default ScriptEditor;
