"use server";

import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "./supabaseClient";
import { revalidatePath } from "next/cache";
import { getErrorMessage } from "./utils";
import {
  exchangeAccessCodeForAuthTokens,
  exchangeNpssoForAccessCode,
  exchangeRefreshTokenForAuthTokens,
  getProfileFromUserName,
  UserPlayedGamesResponse,
} from "psn-api";
import { decrypt, encrypt, getPsnPlayedGames } from "./psn";
import { searchPsStoreProducts } from "./ps-store";
export interface WishlistItem {
  id: string;
  user_id: string;
  game_id: number;
  game_name: string;
  game_image: string;
  added_at: string;
}

export interface PriceAlert {
  id: string;
  user_id: string;
  game_id: number;
  target_price: number;
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  game_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface PsnAccount {
  user_id: string;
  online_id: string;
  account_id: string;
  refresh_token_encrypted: string;
  refresh_token_expires_at: string;
  linked_at: string | null;
}

type TokenResult =
  | { success: true; accessToken: string }
  | { success: false; error: string };

type LibraryGamesResult =
  | { success: true; games: UserPlayedGamesResponse["titles"] }
  | { success: false; error: string };
// 🔹 1. WISHLIST ACTIONx

// Get all wishlisted games for the current user
export async function getUserWishlist(): Promise<WishlistItem[]> {
  const { userId } = await auth();
  if (!userId) return [];

  try {
    const supabase = await createClerkSupabaseClient();
    const { data, error } = await supabase
      .from("wishlists")
      .select("*")
      .order("added_at", { ascending: false });

    if (error) {
      console.error("Error fetching wishlist:", error);
      return [];
    }

    return data as WishlistItem[];
  } catch (error) {
    console.error("Wishlist action error:", error);
    return [];
  }
}

// Check if a specific game is wishlisted by the current user
export async function getWishlistStatus(gameId: number): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  try {
    const supabase = await createClerkSupabaseClient();
    const { data, error } = await supabase
      .from("wishlists")
      .select("id")
      .eq("game_id", gameId)
      .maybeSingle();

    if (error) {
      console.error("Error checking wishlist status:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Wishlist status check error:", error);
    return false;
  }
}

// Add or remove a game from the wishlist
export async function toggleWishlist(
  gameId: number,
  gameName: string,
  gameImage: string,
): Promise<{ success: boolean; added: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, added: false, error: "Authentication required" };
  }

  try {
    const supabase = await createClerkSupabaseClient();

    // Check if it already exists
    const { data: existing, error: checkError } = await supabase
      .from("wishlists")
      .select("id")
      .eq("game_id", gameId)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existing) {
      // Remove it
      const { error: deleteError } = await supabase
        .from("wishlists")
        .delete()
        .eq("game_id", gameId);

      if (deleteError) throw deleteError;

      // Also clean up any active price alert for this game
      await supabase.from("price_alerts").delete().eq("game_id", gameId);

      revalidatePath(`/game/${gameId}`);
      revalidatePath("/wishlist");
      return { success: true, added: false };
    } else {
      let skuId: string | null = null;
      try {
        skuId = (await searchPsStoreProducts(gameName))[0]?.skuIds[0] ?? null;
      } catch (err) {
        console.error("Error resolving PS Store sku for", gameName, err);
      }
      const { error: insertError } = await supabase.from("wishlists").insert({
        user_id: userId,
        game_id: gameId,
        game_name: gameName,
        game_image: gameImage,
        ps_store_sku_id: skuId,
      });

      if (insertError) throw insertError;

      revalidatePath(`/game/${gameId}`);
      revalidatePath("/wishlist");
      return { success: true, added: true };
    }
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    return { success: false, added: false, error: getErrorMessage(error) };
  }
}

// 🔹 2. PRICE ALERT ACTIONS

// Get user's price alert for a game
export async function getPriceAlert(
  gameId: number,
): Promise<PriceAlert | null> {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    const supabase = await createClerkSupabaseClient();
    const { data, error } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("game_id", gameId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching price alert:", error);
      return null;
    }

    return data as PriceAlert;
  } catch (error) {
    console.error("Price alert action error:", error);
    return null;
  }
}

// Set or update a target price alert
export async function setPriceAlert(
  gameId: number,
  targetPrice: number,
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Authentication required" };

  try {
    const supabase = await createClerkSupabaseClient();

    const { error } = await supabase.from("price_alerts").upsert(
      {
        user_id: userId,
        game_id: gameId,
        target_price: targetPrice,
        is_active: true,
        triggered_at: null,
      },
      { onConflict: "user_id,game_id" },
    );

    if (error) throw error;

    revalidatePath(`/game/${gameId}`);
    return { success: true };
  } catch (error) {
    console.error("Error setting price alert:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

// Delete a price alert
export async function deletePriceAlert(
  gameId: number,
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Authentication required" };

  try {
    const supabase = await createClerkSupabaseClient();
    const { error } = await supabase
      .from("price_alerts")
      .delete()
      .eq("game_id", gameId);

    if (error) throw error;

    revalidatePath(`/game/${gameId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting price alert:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

// 🔹 3. NOTIFICATION ACTIONS

// Get recent notifications for current user
export async function getNotifications(): Promise<NotificationItem[]> {
  const { userId } = await auth();
  if (!userId) return [];

  try {
    const supabase = await createClerkSupabaseClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }

    return data as NotificationItem[];
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return [];
  }
}

// Mark a specific notification as read
export async function markNotificationAsRead(
  notificationId: string,
): Promise<{ success: boolean }> {
  const { userId } = await auth();
  if (!userId) return { success: false };

  try {
    const supabase = await createClerkSupabaseClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error marking notification read:", error);
    return { success: false };
  }
}

// Mark all user notifications as read
export async function markAllNotificationsAsRead(): Promise<{
  success: boolean;
}> {
  const { userId } = await auth();
  if (!userId) return { success: false };

  try {
    const supabase = await createClerkSupabaseClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications read:", error);
    return { success: false };
  }
}

export async function linkPsnAccount(npsso: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Authentication required" };

  try {
    const accessCode = await exchangeNpssoForAccessCode(npsso);
    const authorization = await exchangeAccessCodeForAuthTokens(accessCode);
    const profile = await getProfileFromUserName(authorization, "me");
    const encryptedRefreshToken = encrypt(authorization.refreshToken);
    const refreshTokenExpiresTimeStamp = new Date(
      Date.now() + authorization.refreshTokenExpiresIn * 1000,
    ).toISOString();
    const supabase = await createClerkSupabaseClient();

    const { error } = await supabase.from("psn_accounts").upsert(
      {
        user_id: userId,
        online_id: profile.profile.onlineId,
        account_id: profile.profile.accountId,
        refresh_token_encrypted: encryptedRefreshToken,
        refresh_token_expires_at: refreshTokenExpiresTimeStamp,
      },
      {
        onConflict: "user_id",
      },
    );
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("Error linking psn account: ", err);
    return { success: false, error: getErrorMessage(err) };
  }
}

export async function getPsnAccountStatus(): Promise<Pick<
  PsnAccount,
  "online_id" | "linked_at" | "refresh_token_expires_at"
> | null> {
  const { userId } = await auth();
  if (!userId) return null;
  try {
    const supabase = await createClerkSupabaseClient();

    const { data, error } = await supabase
      .from("psn_accounts")
      .select("online_id,linked_at,refresh_token_expires_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    return data as Pick<
      PsnAccount,
      "online_id" | "linked_at" | "refresh_token_expires_at"
    >;
  } catch (err) {
    console.error("Error getting psn account:", err);
    return null;
  }
}

export async function unlinkPsnAccount() {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Authentication required" };
  try {
    const supabase = await createClerkSupabaseClient();

    const { error } = await supabase
      .from("psn_accounts")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;
    //need updation
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("Error unlinlink psn account:", err);
    return { success: false, error: getErrorMessage(err) };
  }
}

export async function getFreshAccessToken(): Promise<TokenResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Authentication required" };
  try {
    const supabase = await createClerkSupabaseClient();

    const { data: row, error } = await supabase
      .from("psn_accounts")
      .select("refresh_token_encrypted")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    if (!row)
      return { success: false, error: "user didd't link psn account yet" };

    const refresh_token = decrypt(row?.refresh_token_encrypted);
    const authTokenResp =
      await exchangeRefreshTokenForAuthTokens(refresh_token);
    const newRefreshToken = encrypt(authTokenResp.refreshToken);

    const { error: secErr } = await supabase
      .from("psn_accounts")
      .update({
        refresh_token_encrypted: newRefreshToken,
        refresh_token_expires_at: new Date(
          Date.now() + authTokenResp.refreshTokenExpiresIn * 1000,
        ).toISOString(),
      })
      .eq("user_id", userId);
    if (secErr) throw secErr;

    return { success: true, accessToken: authTokenResp.accessToken };
  } catch (err) {
    console.error("Error getting refreshToken for user:", err);
    return { success: false, error: getErrorMessage(err) };
  }
}

export async function getLibraryGames(): Promise<LibraryGamesResult> {
  const result = await getFreshAccessToken();
  if (!result.success) {
    return result;
  }
  try {
    const games = await getPsnPlayedGames(result.accessToken);
    return { success: true, games: games };
  } catch (err) {
    return { success: false, error: getErrorMessage(err) };
  }
}

export async function getMonthlyAlertPreference(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  try {
    const supabase = await createClerkSupabaseClient();

    const { data, error } = await supabase
      .from("monthly_alert_preferences")
      .select("in_app_enabled")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    if (data == null) {
      return false;
    }
    return data.in_app_enabled;
  } catch (err) {
    console.error("Error getting monthly preference:", err);
    return false;
  }
}

export async function setMonthlyAlertPreference(
  enabled: boolean,
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Authentication required" };

  try {
    const supabase = await createClerkSupabaseClient();

    const { error } = await supabase.from("monthly_alert_preferences").upsert(
      {
        user_id: userId,
        in_app_enabled: enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) throw error;

    revalidatePath(`/settings`);
    return { success: true };
  } catch (error) {
    console.error("Error setting monthly alert preference:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}
