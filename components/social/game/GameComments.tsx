"use client";

import React, { useState, useEffect } from "react";
import { Avatar, Button, Textarea, Divider, Spinner, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  Reply, 
  Heart, 
  MoreHorizontal, 
  Flag, 
  Edit, 
  Trash2, 
  Send,
  ArrowRight
} from "lucide-react";
import { GlassmorphicCard, GameGenCardPresets } from "@/components/ui/GlassmorphicCard";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type GameComment = Database["public"]["Tables"]["game_comments"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface CommentWithProfile extends GameComment {
  author: Profile;
  replies?: CommentWithProfile[];
  like_count?: number;
  is_liked?: boolean;
}

interface GameCommentsProps {
  gameId: string;
  currentUserId?: string;
  maxDepth?: number;
  showReplies?: boolean;
  onCommentCount?: (count: number) => void;
  className?: string;
}

export function GameComments({
  gameId,
  currentUserId,
  maxDepth = 3,
  showReplies = true,
  onCommentCount,
  className,
}: GameCommentsProps) {
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const supabase = createClient();

  useEffect(() => {
    fetchComments();
  }, [gameId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      
      const { data: commentsData, error } = await supabase
        .from("game_comments")
        .select(`
          *,
          author:profiles!game_comments_author_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("game_id", gameId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Organize comments into threads
      const commentsMap = new Map<string, CommentWithProfile>();
      const rootComments: CommentWithProfile[] = [];

      // First pass: create map of all comments
      commentsData?.forEach((comment: any) => {
        const commentWithProfile = {
          ...comment,
          replies: [],
          like_count: 0,
          is_liked: false,
        };
        commentsMap.set(comment.id, commentWithProfile);
      });

      // Second pass: organize into threads
      commentsData?.forEach((comment: any) => {
        const commentWithProfile = commentsMap.get(comment.id)!;
        
        if (comment.parent_comment_id) {
          const parent = commentsMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies!.push(commentWithProfile);
          }
        } else {
          rootComments.push(commentWithProfile);
        }
      });

      setComments(rootComments);
      onCommentCount?.(commentsData?.length || 0);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async (parentId?: string) => {
    if (!currentUserId) {
      toast.error("Please log in to comment");
      return;
    }

    const content = parentId ? 
      (document.getElementById(`reply-${parentId}`) as HTMLTextAreaElement)?.value || "" :
      newComment;

    if (!content.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setSubmitting(true);

    try {
      const { data: commentData, error } = await supabase
        .from("game_comments")
        .insert({
          game_id: gameId,
          author_id: currentUserId,
          content: content.trim(),
          parent_comment_id: parentId || null,
        })
        .select(`
          *,
          author:profiles!game_comments_author_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Add comment to local state
      const newCommentWithProfile: CommentWithProfile = {
        ...commentData,
        replies: [],
        like_count: 0,
        is_liked: false,
      };

      if (parentId) {
        // Add as reply
        setComments(prev => 
          updateCommentReplies(prev, parentId, (replies) => [
            ...replies,
            newCommentWithProfile
          ])
        );
        setReplyingTo(null);
      } else {
        // Add as root comment
        setComments(prev => [...prev, newCommentWithProfile]);
        setNewComment("");
      }

      // Create activity
      await supabase.from("activities").insert({
        user_id: currentUserId,
        activity_type: "game_commented",
        target_game_id: gameId,
        activity_data: {
          game_title: "Game", // You might want to pass game title
          comment_content: content.trim().substring(0, 100),
        },
        visibility: "followers",
      });

      toast.success("Comment posted!");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const updateCommentReplies = (
    comments: CommentWithProfile[], 
    commentId: string, 
    updateFn: (replies: CommentWithProfile[]) => CommentWithProfile[]
  ): CommentWithProfile[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: updateFn(comment.replies || [])
        };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentReplies(comment.replies, commentId, updateFn)
        };
      }
      return comment;
    });
  };

  const deleteComment = async (commentId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from("game_comments")
        .update({ is_deleted: true })
        .eq("id", commentId)
        .eq("author_id", currentUserId);

      if (error) throw error;

      // Remove from local state
      const removeComment = (comments: CommentWithProfile[]): CommentWithProfile[] => {
        return comments.filter(comment => {
          if (comment.id === commentId) {
            return false;
          }
          if (comment.replies && comment.replies.length > 0) {
            comment.replies = removeComment(comment.replies);
          }
          return true;
        });
      };

      setComments(prev => removeComment(prev));
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  const editComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error("Please enter comment content");
      return;
    }

    try {
      const { error } = await supabase
        .from("game_comments")
        .update({ 
          content: editContent.trim(),
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", commentId)
        .eq("author_id", currentUserId);

      if (error) throw error;

      // Update local state
      const updateComment = (comments: CommentWithProfile[]): CommentWithProfile[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              content: editContent.trim(),
              is_edited: true,
              updated_at: new Date().toISOString()
            };
          }
          if (comment.replies && comment.replies.length > 0) {
            comment.replies = updateComment(comment.replies);
          }
          return comment;
        });
      };

      setComments(prev => updateComment(prev));
      setEditingComment(null);
      setEditContent("");
      toast.success("Comment updated");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    }
  };

  const renderComment = (comment: CommentWithProfile, depth = 0) => {
    const isAuthor = currentUserId === comment.author.id;
    const canReply = depth < maxDepth && showReplies;

    return (
      <motion.div
        key={comment.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`${depth > 0 ? 'ml-8 pl-4 border-l border-divider' : ''}`}
      >
        <div className="flex items-start gap-3 group">
          <Avatar
            src={comment.author.avatar_url || undefined}
            name={comment.author.display_name || comment.author.username}
            size="sm"
            className="flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm text-foreground">
                {comment.author.display_name || comment.author.username}
              </span>
              <span className="text-xs text-foreground/50">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
              {comment.is_edited && (
                <span className="text-xs text-foreground/40">(edited)</span>
              )}
            </div>
            
            {editingComment === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Edit your comment..."
                  minRows={2}
                  maxRows={6}
                  size="sm"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    color="secondary"
                    onPress={() => editComment(comment.id)}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => {
                      setEditingComment(null);
                      setEditContent("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-foreground/90 mb-2 whitespace-pre-wrap">
                  {comment.content}
                </p>
                
                <div className="flex items-center gap-3">
                  {canReply && currentUserId && (
                    <Button
                      size="sm"
                      variant="light"
                      startContent={<Reply size={14} />}
                      onPress={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    >
                      Reply
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="light"
                    startContent={<Heart size={14} />}
                    className="text-foreground/60"
                  >
                    {comment.like_count || 0}
                  </Button>
                  
                  {isAuthor && (
                    <Dropdown>
                      <DropdownTrigger>
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        <DropdownItem
                          key="edit"
                          startContent={<Edit size={14} />}
                          onPress={() => {
                            setEditingComment(comment.id);
                            setEditContent(comment.content);
                          }}
                        >
                          Edit
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          color="danger"
                          startContent={<Trash2 size={14} />}
                          onPress={() => deleteComment(comment.id)}
                        >
                          Delete
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  )}
                  
                  {!isAuthor && currentUserId && (
                    <Button
                      size="sm"
                      variant="light"
                      startContent={<Flag size={14} />}
                      className="text-foreground/60"
                    >
                      Report
                    </Button>
                  )}
                </div>
              </>
            )}
            
            {/* Reply Form */}
            <AnimatePresence>
              {replyingTo === comment.id && currentUserId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  <div className="flex items-start gap-2">
                    <Avatar
                      src={""} // Current user avatar would go here
                      name="You"
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 space-y-2">
                      <Textarea
                        id={`reply-${comment.id}`}
                        placeholder="Write a reply..."
                        minRows={2}
                        maxRows={4}
                        size="sm"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          color="secondary"
                          startContent={<Send size={14} />}
                          onPress={() => submitComment(comment.id)}
                          isLoading={submitting}
                        >
                          Reply
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => setReplyingTo(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 space-y-3">
                {comment.replies.map(reply => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
        
        {depth === 0 && <Divider className="my-4" />}
      </motion.div>
    );
  };

  return (
    <GlassmorphicCard {...GameGenCardPresets.floatingPanel} className={className}>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle size={20} className="text-secondary-500" />
          <h3 className="text-lg font-semibold text-foreground">
            Comments ({comments.length})
          </h3>
        </div>

        {/* New Comment Form */}
        {currentUserId ? (
          <div className="mb-6">
            <div className="flex items-start gap-3">
              <Avatar
                src={""} // Current user avatar would go here
                name="You"
                size="md"
                className="flex-shrink-0"
              />
              <div className="flex-1 space-y-3">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts about this game..."
                  minRows={3}
                  maxRows={8}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground/50">
                    Be kind and constructive in your feedback
                  </span>
                  <Button
                    color="secondary"
                    startContent={<Send size={16} />}
                    onPress={() => submitComment()}
                    isLoading={submitting}
                    isDisabled={!newComment.trim()}
                  >
                    Post Comment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 mb-6 border border-divider rounded-lg">
            <p className="text-foreground/70 mb-3">Join the conversation!</p>
            <Button as="a" href="/login" color="secondary" variant="flat">
              Log in to comment
            </Button>
          </div>
        )}

        {/* Comments List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner color="secondary" />
            <span className="ml-3 text-foreground/70">Loading comments...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle size={48} className="mx-auto text-foreground/30 mb-4" />
            <h4 className="text-lg font-semibold text-foreground mb-2">No comments yet</h4>
            <p className="text-foreground/60">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </div>
    </GlassmorphicCard>
  );
}