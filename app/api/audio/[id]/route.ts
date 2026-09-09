import { getSupabaseAdmin } from "@/lib/supabase/admin";

const AUDIO_BUCKET = "audio_fragments";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mtr_transcriptions")
    .select("audio_storage_path")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!data?.audio_storage_path) {
    return Response.json({ error: "La transcripción no tiene grabación" }, { status: 404 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(AUDIO_BUCKET)
    .createSignedUrl(data.audio_storage_path, 3600);

  if (signError || !signed?.signedUrl) {
    return Response.json({ error: signError?.message ?? "No se pudo firmar el audio" }, { status: 500 });
  }

  return Response.json({ url: signed.signedUrl });
}
