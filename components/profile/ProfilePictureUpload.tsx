"use client";

import React, { useState, useRef } from "react";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { motion } from "framer-motion";
import { Camera, Upload, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/context";

interface ProfilePictureUploadProps {
  currentAvatarUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
}

export function ProfilePictureUpload({
  currentAvatarUrl,
  onUploadSuccess,
  onUploadError,
  size = "lg",
  editable = true,
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const supabase = createClient();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onUploadError?.('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onUploadError?.('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Clean up old avatar if it exists and is from our storage
      if (currentAvatarUrl && currentAvatarUrl.includes('user-avatars')) {
        try {
          const oldPath = currentAvatarUrl.split('/user-avatars/').pop();
          if (oldPath) {
            await supabase.storage
              .from('user-avatars')
              .remove([oldPath]);
          }
        } catch (cleanupError) {
          console.warn('Failed to clean up old avatar:', cleanupError);
        }
      }

      onUploadSuccess?.(publicUrl);
    } catch (error) {
      console.error('Avatar upload error:', error);
      onUploadError?.(
        error instanceof Error ? error.message : 'Failed to upload avatar'
      );
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const avatarSize = size === 'sm' ? 'md' : size === 'md' ? 'lg' : 'lg';
  const containerSize = size === 'sm' ? 'w-16 h-16' : size === 'md' ? 'w-24 h-24' : 'w-32 h-32';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`relative ${containerSize}`}>
        <Avatar
          isBordered
          className={`${containerSize} text-large`}
          color="secondary"
          name={user?.user_metadata?.display_name || user?.email || 'User'}
          size={avatarSize as any}
          src={previewUrl || currentAvatarUrl || undefined}
        />
        
        {editable && (
          <motion.div
            className="absolute -bottom-1 -right-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {uploading ? (
              <div className="w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center border-2 border-background">
                <Spinner size="sm" color="white" />
              </div>
            ) : (
              <Button
                isIconOnly
                className="w-8 h-8 min-w-0 bg-secondary-500 hover:bg-secondary-600 border-2 border-background"
                radius="full"
                size="sm"
                onClick={handleUploadClick}
              >
                <Camera size={14} />
              </Button>
            )}
          </motion.div>
        )}

        {previewUrl && (
          <motion.div
            className="absolute -top-1 -right-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <Button
              isIconOnly
              className="w-6 h-6 min-w-0 bg-danger-500 hover:bg-danger-600 border border-background"
              radius="full"
              size="sm"
              onClick={handleRemovePreview}
            >
              <X size={12} />
            </Button>
          </motion.div>
        )}
      </div>

      {editable && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          
          <div className="text-center">
            <Button
              color="secondary"
              variant="flat"
              size="sm"
              startContent={<Upload size={16} />}
              onClick={handleUploadClick}
              isLoading={uploading}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Change Avatar'}
            </Button>
            <p className="text-xs text-foreground/60 mt-2">
              JPG, PNG or GIF (max 5MB)
            </p>
          </div>
        </>
      )}
    </div>
  );
}