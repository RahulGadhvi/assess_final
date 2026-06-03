import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client safely
const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jd, type, roleTitle } = body;

    if (!jd || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Capture logs directly in your development terminal window
    console.log(`[AI_ROUTE] Initiating generation phase for type: ${type}`);

    if (!openai || apiKey?.includes("your-actual-api-key")) {
      console.warn("[AI_ROUTE] Warning: Valid OPENAI_API_KEY not found in environment. Engaging hyper-fast local fallback simulation.");
      return NextResponse.json(getFallbackData(type, roleTitle));
    }

    let systemPrompt = "";
    let expectedStructure = "";

    if (type === "aptitude") {
      systemPrompt = `You are an expert IO Psychologist. Generate a 20-question cognitive aptitude test based on the seniority and requirements of this job description. Distribution: 30% General Reasoning, 50% Math/Data, 20% Communication.`;
      expectedStructure = `Return strictly in this JSON format: { "questions": [ { "id": "q1", "section": "General Reasoning", "text": "...", "options": [ { "id": "o1", "text": "...", "isCorrect": true }, { "id": "o2", "text": "...", "isCorrect": false }, { "id": "o3", "text": "...", "isCorrect": false }, { "id": "o4", "text": "...", "isCorrect": false } ] } ] }`;
    } else if (type === "domain") {
      systemPrompt = `You are a strict technical hiring manager. Generate a 20-question domain-specific multiple choice test testing deep, practical knowledge required for the role of ${roleTitle || "the given JD"}. Focus on the specific tech stack and responsibilities mentioned in the JD.`;
      expectedStructure = `Return strictly in this JSON format: { "questions": [ { "id": "q1", "section": "Domain Knowledge", "text": "...", "options": [ { "id": "o1", "text": "...", "isCorrect": true }, { "id": "o2", "text": "...", "isCorrect": false }, { "id": "o3", "text": "...", "isCorrect": false }, { "id": "o4", "text": "...", "isCorrect": false } ] } ] }`;
    } else if (type === "interview") {
      systemPrompt = `You are an executive recruiter. Extract the key competencies from the JD and generate a structured 10-question interview script for the hiring manager. Focus on technical depth, situational judgment, and culture fit.`;
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

    } catch (apiError: any) {
      console.error(`[OPENAI_LIVE_EXCEPTION] Direct API error: ${apiError.message}. Safely routing workspace to fallback asset engine.`);
      return NextResponse.json(getFallbackData(type, roleTitle));
    }

  } catch (error: any) {
    console.error(`[AI_GENERATE_CRITICAL_ERROR] - ${error.message}`);
    return NextResponse.json(
      { error: "Failed to generate artifact", details: error.message }, 
      { status: 500 }
    );
  }
}

// Resilient Fallback Engine to guarantee seamless end-to-end sandbox walkthroughs
function getFallbackData(type: string, roleTitle: string) {
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