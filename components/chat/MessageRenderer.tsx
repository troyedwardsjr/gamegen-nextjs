"use client";

import React, { memo, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

import { ChatMessage } from "@/hooks/useChat";
import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";

interface MessageRendererProps {
  message: ChatMessage;
  onCopy?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
  onToggleFavorite?: (messageId: string) => void;
  onReact?: (messageId: string, reaction: string) => void;
  className?: string;
}

interface CodeBlockProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// Custom code block component with copy functionality
const CodeBlock: React.FC<CodeBlockProps> = ({
  inline,
  className,
  children,
  ...props
}) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  const code = String(children).replace(/\n$/, "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  if (inline) {
    return (
      <code
        className="px-1.5 py-0.5 bg-black/30 rounded text-cyan-300 font-mono text-sm border border-cyan-500/30"
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-4">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <GlassmorphicButton
          className="text-xs"
          size="sm"
          variant="glass-ghost"
          onClick={handleCopy}
        >
          {copied ? "✓ Copied" : "Copy"}
        </GlassmorphicButton>
      </div>
      <SyntaxHighlighter
        PreTag="div"
        customStyle={{
          background: "rgba(0, 0, 0, 0.4)",
          border: "1px solid rgba(6, 182, 212, 0.3)",
          borderRadius: "8px",
          fontSize: "14px",
          lineHeight: "1.5",
        }}
        language={language || "text"}
        style={vscDarkPlus}
        {...props}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

// Custom image component with lazy loading and error handling
const ImageComponent: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({
  src,
  alt,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="my-4 relative">
      {isLoading && (
        <div className="flex items-center justify-center h-32 bg-black/20 rounded-lg border border-white/10">
          <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full" />
        </div>
      )}
      {hasError ? (
        <div className="flex items-center justify-center h-32 bg-red-500/10 rounded-lg border border-red-500/30 text-red-400">
          Failed to load image
        </div>
      ) : (
        <img
          alt={alt || "Generated image"}
          className={clsx(
            "max-w-full h-auto rounded-lg border border-white/20 shadow-lg",
            isLoading && "opacity-0",
          )}
          loading="lazy"
          src={src}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          onLoad={() => setIsLoading(false)}
          {...props}
        />
      )}
    </div>
  );
};

// Custom link component
const LinkComponent: React.FC<
  React.AnchorHTMLAttributes<HTMLAnchorElement>
> = ({ href, children, ...props }) => {
  return (
    <a
      className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
      {...props}
    >
      {children}
    </a>
  );
};

// Custom table components
const TableComponent: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  children,
  ...props
}) => (
  <div className="my-4 overflow-x-auto">
    <table
      className="min-w-full border-collapse border border-white/20 rounded-lg"
      {...props}
    >
      {children}
    </table>
  </div>
);

const TableHeaderComponent: React.FC<
  React.ThHTMLAttributes<HTMLTableHeaderCellElement>
> = ({ children, ...props }) => (
  <th
    className="border border-white/20 px-3 py-2 bg-white/5 text-left font-semibold text-white"
    {...props}
  >
    {children}
  </th>
);

const TableDataComponent: React.FC<
  React.TdHTMLAttributes<HTMLTableDataCellElement>
> = ({ children, ...props }) => (
  <td className="border border-white/20 px-3 py-2 text-white/90" {...props}>
    {children}
  </td>
);

// Custom blockquote component
const BlockquoteComponent: React.FC<
  React.BlockquoteHTMLAttributes<HTMLQuoteElement>
> = ({ children, ...props }) => (
  <blockquote
    className="border-l-4 border-cyan-500 pl-4 my-4 bg-cyan-500/5 py-2 italic text-white/80 rounded-r"
    {...props}
  >
    {children}
  </blockquote>
);

// Message actions component
const MessageActions: React.FC<{
  message: ChatMessage;
  onCopy?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
  onToggleFavorite?: (messageId: string) => void;
  onReact?: (messageId: string, reaction: string) => void;
}> = memo(({ message, onCopy, onRegenerate, onToggleFavorite, onReact }) => {
  const [showReactions, setShowReactions] = useState(false);

  const reactions = ["👍", "👎", "❤️", "🎯", "💡", "🔥"];

  return (
    <div className="flex items-center space-x-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      {/* Copy button */}
      {onCopy && (
        <GlassmorphicButton
          className="text-white/60 hover:text-white"
          size="xs"
          title="Copy message"
          variant="glass-ghost"
          onClick={() => onCopy(message.id)}
        >
          📋
        </GlassmorphicButton>
      )}

      {/* Favorite button */}
      {onToggleFavorite && (
        <GlassmorphicButton
          className={clsx(
            "transition-colors",
            message.is_favorite
              ? "text-yellow-400 hover:text-yellow-300"
              : "text-white/60 hover:text-white",
          )}
          size="xs"
          title={
            message.is_favorite ? "Remove from favorites" : "Add to favorites"
          }
          variant="glass-ghost"
          onClick={() => onToggleFavorite(message.id)}
        >
          {message.is_favorite ? "⭐" : "☆"}
        </GlassmorphicButton>
      )}

      {/* Regenerate button (AI messages only) */}
      {onRegenerate && message.message_type === "ai" && (
        <GlassmorphicButton
          className="text-white/60 hover:text-white"
          disabled={message.status === "regenerating"}
          size="xs"
          title="Regenerate response"
          variant="glass-ghost"
          onClick={() => onRegenerate(message.id)}
        >
          {message.status === "regenerating" ? (
            <motion.div
              animate={{ rotate: 360 }}
              className="w-3 h-3"
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              🔄
            </motion.div>
          ) : (
            "🔄"
          )}
        </GlassmorphicButton>
      )}

      {/* Reactions */}
      <div className="relative">
        <GlassmorphicButton
          className="text-white/60 hover:text-white"
          size="xs"
          title="Add reaction"
          variant="glass-ghost"
          onClick={() => setShowReactions(!showReactions)}
        >
          😀
        </GlassmorphicButton>

        <AnimatePresence>
          {showReactions && (
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute bottom-full mb-1 left-0 z-10"
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
            >
              <GlassmorphicCard className="p-2" variant="glass-subtle">
                <div className="flex space-x-1">
                  {reactions.map((reaction) => (
                    <button
                      key={reaction}
                      className="p-1 rounded hover:bg-white/10 transition-colors text-lg"
                      onClick={() => {
                        onReact?.(message.id, reaction);
                        setShowReactions(false);
                      }}
                    >
                      {reaction}
                    </button>
                  ))}
                </div>
              </GlassmorphicCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

MessageActions.displayName = "MessageActions";

// Main message renderer component
export const MessageRenderer: React.FC<MessageRendererProps> = memo(
  ({ message, onCopy, onRegenerate, onToggleFavorite, onReact, className }) => {
    // Memoized markdown components
    const markdownComponents = useMemo(
      () => ({
        code: CodeBlock,
        img: ImageComponent,
        a: LinkComponent,
        table: TableComponent,
        th: TableHeaderComponent,
        td: TableDataComponent,
        blockquote: BlockquoteComponent,
        h1: ({
          children,
          ...props
        }: React.HTMLAttributes<HTMLHeadingElement>) => (
          <h1
            className="text-2xl font-bold text-white mb-4 mt-6 border-b border-white/20 pb-2"
            {...props}
          >
            {children}
          </h1>
        ),
        h2: ({
          children,
          ...props
        }: React.HTMLAttributes<HTMLHeadingElement>) => (
          <h2 className="text-xl font-bold text-white mb-3 mt-5" {...props}>
            {children}
          </h2>
        ),
        h3: ({
          children,
          ...props
        }: React.HTMLAttributes<HTMLHeadingElement>) => (
          <h3 className="text-lg font-semibold text-white mb-2 mt-4" {...props}>
            {children}
          </h3>
        ),
        p: ({
          children,
          ...props
        }: React.HTMLAttributes<HTMLParagraphElement>) => (
          <p className="text-white/90 mb-3 leading-relaxed" {...props}>
            {children}
          </p>
        ),
        ul: ({
          children,
          ...props
        }: React.HTMLAttributes<HTMLUListElement>) => (
          <ul
            className="list-disc list-inside text-white/90 mb-3 space-y-1"
            {...props}
          >
            {children}
          </ul>
        ),
        ol: ({
          children,
          ...props
        }: React.HTMLAttributes<HTMLOListElement>) => (
          <ol
            className="list-decimal list-inside text-white/90 mb-3 space-y-1"
            {...props}
          >
            {children}
          </ol>
        ),
        li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
          <li className="text-white/90" {...props}>
            {children}
          </li>
        ),
        strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
          <strong className="font-semibold text-white" {...props}>
            {children}
          </strong>
        ),
        em: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
          <em className="italic text-cyan-300" {...props}>
            {children}
          </em>
        ),
        hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => (
          <hr className="border-white/20 my-6" {...props} />
        ),
      }),
      [],
    );

    // Handle different message types
    const renderContent = () => {
      if (message.message_type === "error") {
        return (
          <div className="flex items-center space-x-2 text-red-400">
            <span>❌</span>
            <span>{message.content}</span>
          </div>
        );
      }

      if (message.message_type === "system") {
        return (
          <div className="flex items-center space-x-2 text-blue-400 italic">
            <span>ℹ️</span>
            <span>{message.content}</span>
          </div>
        );
      }

      return (
        <div className="relative group">
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown
              className="text-white/90 leading-relaxed"
              components={markdownComponents}
              rehypePlugins={[rehypeRaw]}
              remarkPlugins={[remarkGfm]}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Streaming indicator */}
          {message.is_streaming && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              className="inline-flex items-center mt-2 text-cyan-400 text-sm"
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="flex space-x-1 mr-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
              AI is thinking...
            </motion.div>
          )}

          {/* Message actions */}
          <MessageActions
            message={message}
            onCopy={onCopy}
            onReact={onReact}
            onRegenerate={onRegenerate}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
      );
    };

    return (
      <div className={clsx("message-renderer", className)}>
        {renderContent()}
      </div>
    );
  },
);

MessageRenderer.displayName = "MessageRenderer";

export default MessageRenderer;
