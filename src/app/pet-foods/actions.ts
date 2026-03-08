"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Json } from "@/lib/database.types";

export async function updatePetFood(
  id: string,
  payload: {
    brand?: string;
    brand_en?: string;
    product_name?: string;
    product_name_en?: string;
    species?: string;
    data?: Json;
  },
) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("pet_foods")
    .update(payload)
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/pet-foods/${id}`);
  revalidatePath("/pet-foods");
}

export async function createPetFood(payload: {
  food_key: string;
  brand: string;
  brand_en: string;
  product_name: string;
  product_name_en: string;
  species: string;
  calories_per_100g: number | null;
  data: Json;
}) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("pet_foods")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/pet-foods");
  return data.id;
}

export async function deletePetFood(id: string) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("pet_foods").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/pet-foods");
}
