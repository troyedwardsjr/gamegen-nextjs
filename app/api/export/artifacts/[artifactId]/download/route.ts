import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { ExportArtifactService } from "@/lib/export/services";

// GET /api/export/artifacts/[artifactId]/download - Download export artifact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ artifactId: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { artifactId } = await params;

    if (!artifactId) {
      return NextResponse.json(
        { error: "Artifact ID is required" },
        { status: 400 },
      );
    }

    // Get artifact and verify ownership
    const { data: artifact, error: artifactError } = await (supabase as any)
      .from("export_artifacts")
      .select(
        `
        *,
        export_jobs!inner (
          user_id,
          game_id,
          games (title)
        )
      `,
      )
      .eq("id", artifactId)
      .single();

    if (artifactError || !artifact) {
      return NextResponse.json(
        { error: "Artifact not found" },
        { status: 404 },
      );
    }

    // Verify user owns the export job
    if (artifact.export_jobs.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if download has expired
    if (
      artifact.download_expires_at &&
      new Date(artifact.download_expires_at) < new Date()
    ) {
      return NextResponse.json(
        { error: "Download link has expired" },
        { status: 410 }, // Gone
      );
    }

    // Increment download count
    const artifactService = new ExportArtifactService(true);

    await artifactService.incrementDownloadCount(artifactId);

    // In a real implementation, this would:
    // 1. Generate a signed URL for the file from Supabase Storage
    // 2. Or stream the file directly
    // 3. Handle different storage providers (S3, CDN, etc.)

    // For now, return download information
    if (artifact.public_url) {
      // Redirect to public URL
      return NextResponse.redirect(artifact.public_url);
    } else {
      // Generate signed URL for Supabase Storage
      const { data: signedUrl, error: urlError } = await supabase.storage
        .from("exports")
        .createSignedUrl(artifact.file_path, 3600); // 1 hour expiry

      if (urlError || !signedUrl) {
        return NextResponse.json(
          { error: "Failed to generate download link" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          download_url: signedUrl.signedUrl,
          file_name: artifact.file_name,
          file_size: artifact.file_size_bytes,
          content_type: artifact.content_type,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        },
      });
    }
  } catch (error: any) {
    // TODO: Implement proper error logging system
    return NextResponse.json(
      {
        error: "Failed to download artifact",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
