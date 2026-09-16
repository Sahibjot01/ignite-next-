import type { UserPlayedGamesResponse } from "psn-api";
import { searchGames, type Game } from "./rawg";
import { parseDurationToMinutes } from "./psn";
import { env } from "./env";

type PlayedGame = UserPlayedGamesResponse["titles"][number];

export interface AiRecommendation {
  game: Game;
  reason: string;
}

// Explicitly a comparison section, not a replacement for the rule-based
// recommendations — decided in ROADMAP.md: "I built a transparent
// rule-based recommender and, separately, compared it against an LLM's
// take" is the interview-safe story; quietly swapping the primary logic
// for an LLM call would not be.
const GEMINI_MODEL = "gemini-3.6-flash";
const TOP_PLAYED_COUNT = 5;
const MAX_AI_RECOMMENDATIONS = 6;

interface GeminiSuggestion {
  title: string;
  reason: string;
}

export async function getAiRecommendations(
  playedGames: PlayedGame[],
): Promise<AiRecommendation[]> {
  if (playedGames.length === 0) return [];

  try {
    const topPlayed = [...playedGames]
      .sort(
        (a, b) =>
          parseDurationToMinutes(b.playDuration) -
          parseDurationToMinutes(a.playDuration),
      )
      .slice(0, TOP_PLAYED_COUNT);

    const gameList = topPlayed.map((g) => g.name).join(", ");
    const ownedNames = new Set(
      playedGames.map((g) => g.name.toLowerCase()),
    );

    const prompt = `Someone's most-played PlayStation games, in order: ${gameList}. Suggest ${MAX_AI_RECOMMENDATIONS} other real PlayStation games (PS4 or PS5) they might enjoy, that are NOT in that list. For each, give a very short reason (under 8 words, e.g. "Similar boss-focused combat to Elden Ring") — this displays on a single truncated line in the UI, so it must be short, not a full sentence.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            // Disables extended "thinking" — confirmed against the real
            // API this cuts token usage by ~7x (996 -> 139 total tokens
            // for an equivalent request) with no real quality loss for a
            // request this simple. Matters for staying comfortably inside
            // Gemini's free tier at any real usage volume.
            thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                suggestions: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      title: { type: "STRING" },
                      reason: { type: "STRING" },
                    },
                    required: ["title", "reason"],
                  },
                },
              },
              required: ["suggestions"],
            },
          },
        }),
      },
    );

    if (!res.ok) {
      console.error(`Gemini request failed: ${res.status} ${res.statusText}`);
      return [];
    }

    const json = await res.json();
    const text: string | undefined =
      json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return [];

    const parsed: { suggestions: GeminiSuggestion[] } = JSON.parse(text);

    // Resolve each suggested title to a real RAWG record — this is what
    // filters out anything Gemini hallucinated that doesn't actually
    // exist or isn't on PlayStation, and gives real cover art/rating to
    // display instead of trusting the model's text alone.
    const resolved = await Promise.all(
      parsed.suggestions.map(async (suggestion) => {
        const hits = await searchGames(suggestion.title);
        return { game: hits[0], reason: suggestion.reason };
      }),
    );

    return resolved.filter(
      (r): r is AiRecommendation =>
        !!r.game && !ownedNames.has(r.game.name.toLowerCase()),
    );
  } catch (err) {
    console.error("AI recommendations failed:", err);
    return [];
  }
}
