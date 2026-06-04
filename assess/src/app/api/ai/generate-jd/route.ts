import { NextResponse } from "next/server";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Please enter a role prompt (e.g. Sales Executive with 1 year experience)" }, { status: 400 });
    }

    console.log(`[JD_GENERATOR] Synthesizing standardized schema template for prompt: "${prompt}"`);

    // Graceful presentation fallback if API keys are missing or credentials fail
    if (!openai || apiKey?.includes("your-actual-api-key")) {
      console.warn("[JD_GENERATOR] No OpenAI API Key found. Routing workspace to instant local fallback template.");
      return NextResponse.json({ jd: getFallbackJD(prompt) });
    }

    try {
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
            
            Do not write a conversational introduction or footer. Return ONLY the filled-out plain text template.`
          },
          {
            role: "user",
            content: `Create a structured JD template for: "${prompt}"`
          }
        ]
      });

      const generatedText = completion.choices[0].message.content;
      if (!generatedText) throw new Error("Empty payload returned from OpenAI channel.");

      return NextResponse.json({ jd: generatedText });

    } catch (apiError: any) {
      console.error(`[JD_GENERATOR_API_EXCEPTION] Direct API error: ${apiError.message}. Routing safely to fallback.`);
      return NextResponse.json({ jd: getFallbackJD(prompt) });
    }

  } catch (error: any) {
    console.error(`[JD_GENERATOR_CRITICAL_FAILURE] ${error.message}`);
    return NextResponse.json({ error: "Failed to generate structured JD template." }, { status: 500 });
  }
}

// Fallback template builder matching the exact schema checklist parameters
function getFallbackJD(prompt: string): string {
  const cleanPrompt = prompt.toLowerCase();
  
  if (cleanPrompt.includes("sales") || cleanPrompt.includes("executive")) {
    return `JOB TITLE: Sales Executive
EXPERIENCE REQUIRED: 1-2 years in B2B/SaaS or direct sales

KEY RESPONSIBILITIES:
- Source and qualify corporate pipeline leads through structured outbound tracks
- Present remote product demonstrations highlighting business value propositions
- Close standard contract values and manage basic onboarding handoffs

REQUIRED SKILLS:
- Core consultative selling methodologies
- High-rejection resilient workflow execution
- CRM pipeline discipline and documentation

PREFERRED SKILLS:
- Negotiation strategy execution
- Inbound product marketing alignment

TOOLS & SOFTWARE KNOWLEDGE:
- CRM Platforms (Salesforce, HubSpot, or Zoho)
- Communication Hubs (Slack, Microsoft Teams, Zoom)

COMMUNICATION REQUIREMENTS:
- Excellent bilingual verbal presentation capabilities in corporate business environments

ASSESSMENT FOCUS AREAS:
- Lead qualification methodologies
- Overcoming structural customer objections
- CRM management & sales pipeline velocity metrics`;
  }

  return `JOB TITLE: ${prompt} Specialist
EXPERIENCE REQUIRED: 2-3 years of active execution

KEY RESPONSIBILITIES:
- Drive core project deliverables safely within scheduled milestones
- Analyze system requirements and propose clean, modular implementation paths
- Coordinate cross-functionally to clear production blocks

REQUIRED SKILLS:
- Core domain problem-solving capabilities
- Structured workflow documentation
- High operational ownership indicators

PREFERRED SKILLS:
- Agile methodology orchestration
- Collaborative review processes

TOOLS & SOFTWARE KNOWLEDGE:
- Professional Domain Tool suites (e.g. Git, Figma, JIRA, or Excel)
- Shared workspace cloud hubs

COMMUNICATION REQUIREMENTS:
- Standard clear verbal and written reporting structures across team stakeholders

ASSESSMENT FOCUS AREAS:
- Domain syntax & tool execution
- System diagnostic workflows
- Standard troubleshooting methodologies`;
}