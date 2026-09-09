import { after } from "next/server";
import { AUDIO_BUCKET, processTranscription } from "@/lib/process-transcription";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const maxDuration = 300;
export const runtime = "nodejs";

function fileBaseName(name: string): string {
  return name.replace(/\.[^.]+$/, "").trim() || "Grabación";
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Adjunta un archivo de audio" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: folder } = await supabase
    .from("mtr_folders")
    .select("id")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  const transcriptionId = crypto.randomUUID();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_") || "audio";
  const audioPath = `${transcriptionId}/${safeName}`;

  await supabase.storage.createBucket(AUDIO_BUCKET, { public: false }).catch(() => undefined);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(audioPath, new Blob([bytes], { type: file.type || "application/octet-stream" }), {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 });
  }

  const { error: insertError } = await supabase.from("mtr_transcriptions").insert({
    id: transcriptionId,
    folder_id: folder?.id ?? null,
    session_key: `upload-${transcriptionId}`,
    recorded_at: new Date().toISOString(),
    short_title: fileBaseName(file.name),
    status: "processing",
    audio_storage_path: audioPath,
  });

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  after(() => processTranscription(transcriptionId));

  return Response.json({ id: transcriptionId });
}
