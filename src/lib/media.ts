import { supabase } from "./supabase";

export type MediaAttachment = {
  id: string;
  owner_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

export async function uploadChatFile(file: File) {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from("chat-media").upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;
  return { path, fileName: file.name, mimeType: file.type, size: file.size };
}

export async function createSignedMediaUrl(path: string, expiresIn = 3600) {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const { data, error } = await supabase.storage.from("chat-media").createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export function createVoiceRecorder(onComplete: (blob: Blob) => void) {
  let recorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  return {
    async start() {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new Error("Voice recording is not supported in this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        onComplete(new Blob(chunks, { type: recorder?.mimeType || "audio/webm" }));
      };
      recorder.start();
    },
    stop() { recorder?.stop(); },
    isRecording() { return recorder?.state === "recording"; },
  };
}
