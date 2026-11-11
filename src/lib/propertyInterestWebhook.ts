import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import type { Property } from "@/types/property";

function propertySnapshot(property: Property) {
  return {
    id: property.id,
    title: property.title,
    address: property.address,
    city: property.city,
    state: property.state,
    zip_code: property.zip_code,
    price: property.price,
    arv: property.arv,
    roi: property.roi,
    monthly_rent: property.monthly_rent,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    sqft: property.sqft,
    year_built: property.year_built,
    status: property.status,
    property_type: property.property_type,
    owner_id: property.owner_id ?? null,
  };
}

/**
 * Loads owner + visitor profiles when RLS allows, then POSTs JSON to LeadConnector.
 * Does not throw; logs warnings on failure. Configure VITE_PROPERTY_INTEREST_WEBHOOK_URL to enable it.
 */
export async function notifyLeadConnectorPropertyInterest(
  property: Property,
  authUser: User,
): Promise<void> {
  const url =
    typeof import.meta.env.VITE_PROPERTY_INTEREST_WEBHOOK_URL === "string"
      ? import.meta.env.VITE_PROPERTY_INTEREST_WEBHOOK_URL.trim()
      : "";

  if (!url) return;

  let owner: Record<string, unknown> | null = null;
  if (property.owner_id) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, phone")
      .eq("id", property.owner_id)
      .maybeSingle();

    if (data) {
      owner = data as Record<string, unknown>;
    } else {
      owner = {
        id: property.owner_id,
        profile_unavailable: true,
        hint: error?.message ?? "RLS or missing profile row",
      };
    }
  }

  const { data: visitorRow } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone")
    .eq("id", authUser.id)
    .maybeSingle();

  const interestedUser =
    visitorRow ??
    ({
      id: authUser.id,
      email: authUser.email ?? null,
      full_name: (authUser.user_metadata?.full_name as string | undefined) ?? null,
      phone: (authUser.user_metadata?.phone as string | undefined) ?? null,
    } as Record<string, unknown>);

  const body = {
    event: "property_interest",
    source: "inventory_app",
    property: propertySnapshot(property),
    owner,
    interestedUser,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("Property interest webhook response:", res.status, text);
    }
  } catch (e) {
    console.warn("Property interest webhook request failed:", e);
  }
}
