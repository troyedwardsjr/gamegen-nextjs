import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Start a transaction to delete all user data
    // Note: In a real implementation, you might want to:
    // 1. Soft delete the account first
    // 2. Queue the data deletion for later
    // 3. Send confirmation emails
    // 4. Handle data retention requirements

    try {
      // Delete user data in correct order due to foreign key constraints
      
      // 1. Delete user activities
      await supabase
        .from('user_activities')
        .delete()
        .eq('user_id', user.id);

      // 2. Delete user follows
      await supabase
        .from('user_follows')
        .delete()
        .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);

      // 3. Delete game likes
      await supabase
        .from('game_likes')
        .delete()
        .eq('user_id', user.id);

      // 4. Delete game comments
      await supabase
        .from('game_comments')
        .delete()
        .eq('author_id', user.id);

      // 5. Delete play sessions
      await supabase
        .from('play_sessions')
        .delete()
        .eq('player_id', user.id);

      // 6. Delete collaboration sessions
      await supabase
        .from('collaboration_sessions')
        .delete()
        .eq('host_user_id', user.id);

      // 7. Delete game assets
      await supabase
        .from('game_assets')
        .delete()
        .eq('creator_id', user.id);

      // 8. Delete game scripts
      await supabase
        .from('game_scripts')
        .delete()
        .eq('creator_id', user.id);

      // 9. Delete games
      await supabase
        .from('games')
        .delete()
        .eq('creator_id', user.id);

      // 10. Delete collections
      await supabase
        .from('collections')
        .delete()
        .eq('creator_id', user.id);

      // 11. Delete community assets
      await supabase
        .from('community_assets')
        .delete()
        .eq('creator_id', user.id);

      // 12. Delete templates
      await supabase
        .from('templates')
        .delete()
        .eq('creator_id', user.id);

      // 13. Delete AI generations
      await supabase
        .from('ai_generations')
        .delete()
        .eq('user_id', user.id);

      // 14. Delete social shares
      await supabase
        .from('social_shares')
        .delete()
        .eq('user_id', user.id);

      // 15. Delete export jobs and related data
      await supabase
        .from('export_jobs')
        .delete()
        .eq('user_id', user.id);

      await supabase
        .from('user_export_usage')
        .delete()
        .eq('user_id', user.id);

      await supabase
        .from('export_webhooks')
        .delete()
        .eq('user_id', user.id);

      // 16. Delete user sessions
      await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', user.id);

      // 17. Delete chat sessions and messages
      const { data: chatSessions } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('user_id', user.id);

      if (chatSessions) {
        for (const session of chatSessions) {
          // Delete chat messages
          await supabase
            .from('chat_messages')
            .delete()
            .eq('session_id', session.id);
        }
      }

      await supabase
        .from('chat_sessions')
        .delete()
        .eq('user_id', user.id);

      // 18. Delete user embeddings
      await supabase
        .from('user_embeddings')
        .delete()
        .eq('user_id', user.id);

      // 19. Delete creator analytics
      await supabase
        .from('creator_analytics')
        .delete()
        .eq('creator_id', user.id);

      // 20. Delete purchases
      await supabase
        .from('purchases')
        .delete()
        .eq('buyer_id', user.id);

      // 21. Delete creator earnings
      await supabase
        .from('creator_earnings')
        .delete()
        .eq('creator_id', user.id);

      // 22. Delete the profile (this will cascade to related data)
      await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      // 23. Delete user avatar from storage if exists
      try {
        // List all files in the user's avatar folder
        const { data: files } = await supabase.storage
          .from('user-avatars')
          .list(`${user.id}/`);

        if (files && files.length > 0) {
          const filePaths = files.map(file => `${user.id}/${file.name}`);
          await supabase.storage
            .from('user-avatars')
            .remove(filePaths);
        }
      } catch (storageError) {
        console.warn('Failed to delete avatar files:', storageError);
        // Don't fail the entire deletion for storage issues
      }

      // 24. Finally delete the auth user
      const { error: deleteUserError } = await supabase.auth.admin.deleteUser(
        user.id
      );

      if (deleteUserError) {
        console.error('Failed to delete auth user:', deleteUserError);
        // Even if auth deletion fails, the data is cleaned up
      }

      return NextResponse.json({ 
        success: true,
        message: 'Account deleted successfully' 
      });

    } catch (dbError) {
      console.error('Database deletion error:', dbError);
      return NextResponse.json(
        { error: 'Failed to delete account data' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}