import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/chat/templates - Get prompt templates
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const isPublic = searchParams.get('public') !== 'false'; // Default to public only
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get authenticated user (optional for public templates)
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('chat_prompt_templates')
      .select('*')
      .order('usage_count', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (isPublic && !user) {
      // Anonymous users can only see public templates
      query = query.eq('is_public', true);
    } else if (isPublic) {
      // Authenticated users can see public templates and their own
      query = query.or(`is_public.eq.true,created_by.eq.${user.id}`);
    } else if (user) {
      // Authenticated users can see their own private templates
      query = query.eq('created_by', user.id);
    } else {
      // Anonymous users requesting private templates
      return NextResponse.json(
        { error: 'Authentication required for private templates' },
        { status: 401 }
      );
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`
      );
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Failed to fetch templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    // Also get category counts for filtering UI
    const { data: categoryCounts } = await supabase
      .from('chat_prompt_templates')
      .select('category')
      .eq('is_public', true);

    const categories = categoryCounts?.reduce((acc: Record<string, number>, { category }) => {
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      templates: templates || [],
      categories,
      pagination: {
        limit,
        offset,
        hasMore: (templates?.length || 0) === limit
      }
    });

  } catch (error) {
    console.error('Templates API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/chat/templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, category, description, prompt_text, tags, is_public } = body;

    // Validate required fields
    if (!name || !category || !prompt_text) {
      return NextResponse.json(
        { error: 'Name, category, and prompt_text are required' },
        { status: 400 }
      );
    }

    // Create template
    const { data: template, error } = await supabase
      .from('chat_prompt_templates')
      .insert({
        name,
        category,
        description: description || '',
        prompt_text,
        tags: tags || [],
        is_public: is_public || false,
        created_by: user.id,
        usage_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create template:', error);
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template }, { status: 201 });

  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}