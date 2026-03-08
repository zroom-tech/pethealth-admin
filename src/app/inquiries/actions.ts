"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function replyInquiry(id: number, adminReply: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("inquiry")
    .update({
      admin_reply: adminReply,
      admin_replied_at: new Date().toISOString(),
      is_processed: true,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/inquiries/${id}`);
  revalidatePath("/inquiries");
}

export async function deleteInquiry(id: number) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("inquiry").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/inquiries");
}
