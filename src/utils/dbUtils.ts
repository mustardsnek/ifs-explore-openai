import { Database } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

type message = Database["public"]["Tables"]["chat"]["Row"];

export async function insertChatMessages(
  supabaseClient: SupabaseClient,
  messages: message[]
) {
  await supabaseClient.from("chat").insert(messages);
}
