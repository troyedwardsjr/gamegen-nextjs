import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// POST /api/chat/templates/[templateId]/use - Increment usage count and return template
export async function POST(
  request: NextRequest,
  { params }: { params: { templateId: string } },
) {
  try {
    const supabase = createClient();
    const { templateId } = params;

    // Get the template
    const { data: template, error: fetchError } = await supabase
      .from("chat_prompt_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (fetchError || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    // Check if template is accessible
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!template.is_public && (!user || template.created_by !== user.id)) {
      return NextResponse.json(
        { error: "Template not accessible" },
        { status: 403 },
      );
    }

    // Increment usage count
    const { error: updateError } = await supabase
      .from("chat_prompt_templates")
      .update({
        usage_count: template.usage_count + 1,
      })
      .eq("id", templateId);

    if (updateError) {
      console.error("Failed to update usage count:", updateError);
      // Continue anyway - usage count is not critical
    }

    // Return template with updated usage count
    return NextResponse.json({
      template: {
        ...template,
        usage_count: template.usage_count + 1,
      },
    });
  } catch (error) {
    console.error("Use template error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
