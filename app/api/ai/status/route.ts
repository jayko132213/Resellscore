import { NextResponse } from "next/server";
import { getConfiguredAiProvider } from "@/lib/ai";

export async function GET() {
  const provider = getConfiguredAiProvider();

  return NextResponse.json({
    aiEnabled: provider !== "fallback",
    provider,
    openaiEnabled: provider === "openai",
    geminiEnabled: provider === "gemini"
  });
}
