import { NextResponse } from "next/server";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const jd = typeof body.jd === "string" ? body.jd : "";
    const type = typeof body.type === "string" ? body.type : "";
    const roleTitle = typeof body.roleTitle === "string" ? body.roleTitle : undefined;
    const location = typeof body.location === "string" ? body.location : "";

    if (!jd || !type) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!openai) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured." },
        { status: 503 }
      );
    }

    const regionHint =
      location &&
      /india|bangalore|bengaluru|ahmedabad|mumbai|delhi|kolkata|hyderabad/i.test(location)
        ? "Tailor examples and contexts to Indian candidates; prefer local scenarios, units, and culturally familiar references where appropriate."
        : "";

    let systemPrompt = "";
    let expectedStructure = "";

    if (type === "aptitude") {
      systemPrompt = `You are an expert Industrial & Organizational Psychologist. Generate a 20-question cognitive aptitude test based on the seniority and requirements of this job description. Distribution: 30% General Reasoning, 50% Math/Data, 20% Communication. For each question, specify difficulty (easy/medium/hard) and ensure options are unambiguous; distractors must be plausible but clearly incorrect. ${regionHint}`;
      expectedStructure = `Return strictly in this JSON format: { "questions": [ { "id": "q1", "section": "General Reasoning", "difficulty": "medium", "text": "...", "options": [ { "id": "o1", "text": "...", "isCorrect": true }, { "id": "o2", "text": "...", "isCorrect": false }, { "id": "o3", "text": "...", "isCorrect": false }, { "id": "o4", "text": "...", "isCorrect": false } ] } ] }`;
    } else if (type === "domain") {
      systemPrompt = `You are a strict technical hiring manager. Generate a 20-question domain-specific multiple choice test testing practical, hands-on knowledge required for the role of ${roleTitle || "the given JD"}. Use real-world scenarios, short code or configuration snippets where relevant, and ensure at least 40% of questions map directly to technologies or responsibilities in the JD. Provide one clearly correct answer and three plausible distractors. ${regionHint}`;
      expectedStructure = `Return strictly in this JSON format: { "questions": [ { "id": "q1", "section": "Domain Knowledge", "difficulty": "hard", "text": "...", "options": [ { "id": "o1", "text": "...", "isCorrect": true }, { "id": "o2", "text": "...", "isCorrect": false }, { "id": "o3", "text": "...", "isCorrect": false }, { "id": "o4", "text": "...", "isCorrect": false } ] } ] }`;
    } else if (type === "interview") {
      systemPrompt = `You are an experienced hiring manager and executive recruiter. Extract key competencies from the JD and generate a structured 10-question interview script prioritizing technical depth, situational judgment, and cultural fit. For each question include a concise follow-up probe and a clear signal the interviewer should look for in answers. ${regionHint}`;
      expectedStructure = `Return strictly in this JSON format: { "questions": [ { "id": "i1", "competency": "Technical Capability", "question": "...", "followUpProbe": "...", "signalToLookFor": "..." } ] }`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `${systemPrompt}\n\n${expectedStructure}\n\nRespond only in valid JSON, no markdown fences, no preamble.`,
        },
        {
          role: "user",
          content: `Job Description:\n\n${jd}`,
        },
      ],
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      return NextResponse.json({ error: "Empty response from AI." }, { status: 502 });
    }

    return NextResponse.json(JSON.parse(responseContent));
  } catch {
    return NextResponse.json({ error: "Failed to generate content." }, { status: 500 });
  }
}
