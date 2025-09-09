import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Rate a template
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: templateId } = await params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { rating, reviewText } = body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ 
        error: 'Rating must be between 1 and 5' 
      }, { status: 400 });
    }

    // Validate template exists and is approved
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .eq('status', 'approved')
      .single();

    if (templateError || !template) {
      return NextResponse.json({ 
        error: 'Template not found or not available' 
      }, { status: 404 });
    }

    // Prevent self-rating
    if (template.creator_id === user.id) {
      return NextResponse.json({ 
        error: 'You cannot rate your own template' 
      }, { status: 400 });
    }

    try {
      // Use any to bypass TypeScript issues with new tables not in types yet
      const supabaseAny = supabase as any;
      
      // Upsert rating (update if exists, insert if not)
      const { data: ratingRecord, error: ratingError } = await supabaseAny
        .from('template_ratings')
        .upsert({
          template_id: templateId,
          user_id: user.id,
          rating: rating,
          review_text: reviewText || null,
        }, { onConflict: 'template_id,user_id' })
        .select()
        .single();

      if (ratingError) {
        console.error('Error saving template rating:', ratingError);
        return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
      }

      // Recalculate template rating average
      const { data: allRatings, error: allRatingsError } = await supabaseAny
        .from('template_ratings')
        .select('rating')
        .eq('template_id', templateId);

      if (!allRatingsError && allRatings && allRatings.length > 0) {
        const totalRating = allRatings.reduce((sum: number, r: any) => sum + r.rating, 0);
        const averageRating = totalRating / allRatings.length;
        const ratingCount = allRatings.length;

        // Update template with new rating
        const { error: updateError } = await supabase
          .from('templates')
          .update({
            rating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
            rating_count: ratingCount,
          })
          .eq('id', templateId);

        if (updateError) {
          console.warn('Failed to update template rating:', updateError);
        }
      }

      return NextResponse.json({
        success: true,
        rating: ratingRecord,
        message: 'Rating submitted successfully'
      });

    } catch (dbError) {
      console.warn('Template ratings table not available:', dbError);
      return NextResponse.json({ 
        error: 'Rating system not yet available. Please try again later.' 
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Template rating API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get template ratings and reviews
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: templateId } = await params;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));

    // Validate template exists
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('rating, rating_count')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ 
        error: 'Template not found' 
      }, { status: 404 });
    }

    try {
      // Use any to bypass TypeScript issues with new tables not in types yet
      const supabaseAny = supabase as any;
      
      // Get ratings with user information
      const offset = (page - 1) * limit;
      const { data: ratings, error: ratingsError } = await supabaseAny
        .from('template_ratings')
        .select(`
          *,
          profiles!inner(display_name, username, avatar_url)
        `)
        .eq('template_id', templateId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (ratingsError) {
        console.error('Error fetching template ratings:', ratingsError);
        return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 });
      }

      // Transform ratings data
      const ratingsData = ratings?.map((rating: any) => ({
        id: rating.id,
        rating: rating.rating,
        reviewText: rating.review_text,
        createdAt: rating.created_at,
        updatedAt: rating.updated_at,
        user: {
          displayName: rating.profiles.display_name || rating.profiles.username,
          avatarUrl: rating.profiles.avatar_url,
        },
      })) || [];

      // Get rating distribution
      const { data: allRatings, error: distributionError } = await supabaseAny
        .from('template_ratings')
        .select('rating')
        .eq('template_id', templateId);

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      if (!distributionError && allRatings) {
        allRatings.forEach((r: any) => {
          distribution[r.rating as keyof typeof distribution]++;
        });
      }

      return NextResponse.json({
        templateId,
        averageRating: template.rating || 0,
        totalRatings: template.rating_count || 0,
        distribution,
        ratings: ratingsData,
        pagination: {
          page,
          limit,
          hasNext: ratingsData.length === limit,
        },
      });

    } catch (dbError) {
      console.warn('Template ratings table not available:', dbError);
      
      // Fallback: return basic template rating info
      return NextResponse.json({
        templateId,
        averageRating: template.rating || 0,
        totalRatings: template.rating_count || 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        ratings: [],
        pagination: { page: 1, limit: 0, hasNext: false },
      });
    }

  } catch (error) {
    console.error('Get template ratings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete a rating (user can delete their own rating)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: templateId } = await params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // Use any to bypass TypeScript issues with new tables not in types yet
      const supabaseAny = supabase as any;
      
      // Delete user's rating for this template
      const { error: deleteError } = await supabaseAny
        .from('template_ratings')
        .delete()
        .eq('template_id', templateId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting template rating:', deleteError);
        return NextResponse.json({ error: 'Failed to delete rating' }, { status: 500 });
      }

      // Recalculate template rating average
      const { data: remainingRatings, error: remainingError } = await supabaseAny
        .from('template_ratings')
        .select('rating')
        .eq('template_id', templateId);

      if (!remainingError) {
        let newRating = 0;
        let newCount = 0;
        
        if (remainingRatings && remainingRatings.length > 0) {
          const totalRating = remainingRatings.reduce((sum: number, r: any) => sum + r.rating, 0);
          newRating = Math.round((totalRating / remainingRatings.length) * 100) / 100;
          newCount = remainingRatings.length;
        }

        // Update template with new rating
        const { error: updateError } = await supabase
          .from('templates')
          .update({
            rating: newRating,
            rating_count: newCount,
          })
          .eq('id', templateId);

        if (updateError) {
          console.warn('Failed to update template rating:', updateError);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Rating deleted successfully'
      });

    } catch (dbError) {
      console.warn('Template ratings table not available:', dbError);
      return NextResponse.json({ 
        error: 'Rating system not yet available.' 
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Delete template rating API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}