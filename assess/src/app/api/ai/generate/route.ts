import { NextResponse } from "next/server";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const jd = typeof body.jd === "string" ? body.jd : "";
    const type = typeof body.type === "string" ? body.type : "";
    const roleTitle = typeof body.roleTitle === "string" ? body.roleTitle : undefined;
    const location = typeof body.location === "string" ? body.location : "";

    if (!jd || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`[AI_ROUTE] Initiating generation phase for type: ${type} (location: ${location})`);

    if (!openai || apiKey?.includes("your-actual-api-key")) {
      console.warn("[AI_ROUTE] Warning: Valid OPENAI_API_KEY not found in environment. Engaging hyper-fast local fallback simulation.");
      return NextResponse.json(getFallbackData(type, roleTitle));
    }

    // Small region-aware hint to make generated content culturally relevant
    const regionHint = location && /india|bangalore|bengaluru|ahmedabad|mumbai|delhi|kolkata|hyderabad/i.test(location)
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

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `${systemPrompt}\n\n${expectedStructure}\n\nRespond only in valid JSON, no markdown fences, no preamble.`
          },
          {
            role: "user",
            content: `Job Description:\n\n${jd}`
          }
        ],
      });

      const responseContent = completion.choices[0].message.content;
      if (!responseContent) throw new Error("Empty payload returned from OpenAI network node.");

      return NextResponse.json(JSON.parse(responseContent));
    } catch (apiError) {
      console.error(`[OPENAI_LIVE_EXCEPTION] Direct API error: ${getErrorMessage(apiError)}. Safely routing workspace to fallback asset engine.`);
      return NextResponse.json(getFallbackData(type, roleTitle));
    }
  } catch (error) {
    const message = getErrorMessage(error);
    console.error(`[AI_GENERATE_CRITICAL_ERROR] - ${message}`);
    return NextResponse.json({ error: "Failed to generate artifact", details: message }, { status: 500 });
  }
}

function getFallbackData(type: string, roleTitle?: string) {
  if (type === "interview") {
    return {
      questions: [
        { id: "i1", competency: "System Architecture", question: `How would you scale a distributed delivery hub tracking real-time locations across Indian tier-1 infrastructure grid systems?`, followUpProbe: "What caching topology guarantees sub-50ms sync thresholds under peak loads?", signalToLookFor: "Looks for horizontal partitioning methodologies and Redis pub/sub layer familiarity." }
      ]
    };
  }

  return {
    questions: [
      {
        id: "q1",
        section: type === "aptitude" ? "General Reasoning" : "Domain Execution",
        text: type === "aptitude"
          ? "A delivery platform scales active operations across 5 metropolitan clusters in India. If traffic scales quadratically relative to grid density, how many clusters are active when capacity utilization increases 400%?"
          : `In a production setup built for ${roleTitle || "Frontend Tasks"}, which optimization strategy reduces hydration bottlenecks on slow mobile networks in sub-optimal cellular environments?`,
        options: [
          { id: "o1", text: type === "aptitude" ? "10 active clusters" : "Incremental static regeneration paired with partial structural hydration primitives", isCorrect: true },
          { id: "o2", text: type === "aptitude" ? "15 active clusters" : "Client-side lazy state replication models", isCorrect: false },
          { id: "o3", text: type === "aptitude" ? "20 active clusters" : "Monolithic layout rendering bypass arrays", isCorrect: false },
          { id: "o4", text: type === "aptitude" ? "25 active clusters" : "Synchronous context payload propagation parameters", isCorrect: false },
        ],
      }
    ]
  };
}