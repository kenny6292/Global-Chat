import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type PresenceStatus = "online" | "away" | "busy" | "invisible";

export async function startGlobalPresence(
  userId: string,
  status: PresenceStatus = "online",
  onChange?: (state: Record<string, unknown[]>) => void,
) {
  if (!supabase) return null;

  const channel = supabase.channel("global-presence", {
    config: { presence: { key: userId } },
  });

  if (onChange) {
    channel.on("presence", { event: "sync" }, () => {
      onChange(channel.presenceState() as Record<string, unknown[]>);
    });
  }

  await new Promise<void>((resolve, reject) => {
    channel.subscribe(async (subscriptionStatus) => {
      if (subscriptionStatus !== "SUBSCRIBED") return;
      try {
        const result = await channel.track({
          userId,
          status,
          onlineAt: new Date().toISOString(),
        });
        if (result !== "ok") reject(new Error("Unable to publish presence."));
        else resolve();
      } catch (error) {
        reject(error);
      }
    });
  });

  return channel;
}

export async function stopPresence(channel: RealtimeChannel) {
  await channel.untrack();
  if (supabase) await supabase.removeChannel(channel);
}
