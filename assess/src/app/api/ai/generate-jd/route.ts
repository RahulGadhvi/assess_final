import { NextResponse } from "next/server";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const prompt = typeof body.prompt === "string" ? body.prompt : "";

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    if (!openai) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured." },
        { status: 503 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are an elite corporate technical recruiter. Generate a concise, highly structured Job Description template based on the user's role request.

You MUST follow this exact, clean structure. Keep each section short, focused, and directly measurable:

JOB TITLE: [Insert Title]
EXPERIENCE REQUIRED: [Insert Experience]

KEY RESPONSIBILITIES:
- [Responsibility 1 - clear & measurable]
- [Responsibility 2]
- [Responsibility 3]

REQUIRED SKILLS:
- [Core technical/professional skill 1]
- [Core technical/professional skill 2]
- [Core technical/professional skill 3]

PREFERRED SKILLS:
- [Value-add skill 1]
- [Value-add skill 2]

TOOLS & SOFTWARE KNOWLEDGE:
- [Specific software, platforms, or tools 1]
- [Specific software, platforms, or tools 2]

COMMUNICATION REQUIREMENTS:
- [Clear expectation of communications, stakeholders, or language]

ASSESSMENT FOCUS AREAS:
- [Focus area 1 optimized for multiple choice testing]
- [Focus area 2 optimized for multiple choice testing]
- [Focus area 3 optimized for multiple choice testing]

Do not write a conversational introduction or footer. Return ONLY the filled-out plain text template.`,
        },
        {
          role: "user",
          content: `Create a structured JD template for: "${prompt}"`,
        },
      ],
    });

    const generatedText = completion.choices[0].message.content;
    if (!generatedText) {
      return NextResponse.json({ error: "Empty response from AI." }, { status: 502 });
    }

    return NextResponse.json({ jd: generatedText });
  } catch {
    return NextResponse.json({ error: "Failed to generate JD." }, { status: 500 });
  }
}
