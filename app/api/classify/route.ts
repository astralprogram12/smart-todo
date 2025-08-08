import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { heuristicClassify } from "@/lib/auto-tag"

export async function POST(req: NextRequest) {
  const { title, description } = await req.json()

  const hasKey = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!hasKey) {
    const h = heuristicClassify({ title, description: description ?? "" })
    return NextResponse.json({ source: "heuristic", ...h })
  }

  const sys = `
You are an expert task classifier. Output strict JSON with keys:
category (one of: Work, Personal, Errands, Health, Learning, Finance, Home),
difficulty (easy|medium|hard),
tags (array of lowercase slugs),
listName (short human-friendly group name).
Only return JSON, no extra text.
  `.trim()

  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    system: sys,
    prompt: `Title: ${title}\nDescription: ${description ?? ""}\nReturn JSON:`,
    maxTokens: 200,
  })

  try {
    const parsed = JSON.parse(text)
    return NextResponse.json({ source: "ai", ...parsed })
  } catch {
    const h = heuristicClassify({ title, description: description ?? "" })
    return NextResponse.json({ source: "heuristic", ...h })
  }
}
