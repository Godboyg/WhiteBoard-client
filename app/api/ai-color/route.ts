import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { prompt }: { prompt: string } = await req.json();

    console.log("prompt",prompt);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const res = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Convert the color description "${prompt}" into a valid hex code like #RRGGBB. Only return the hex code.`,
      });

    const hex: string | undefined= res.text;
    console.log("hes",hex);

    return NextResponse.json({ hex });
  } catch (err) {
    console.error("Error in AI-color route:", err);
    return NextResponse.json({ hex: "#000000" }, { status: 500 });
  }
}