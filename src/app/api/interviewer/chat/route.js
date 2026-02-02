import { NextResponse } from "next/server";

// Get interviewer system prompt from environment variable
const INTERVIEWER_SYSTEM_PROMPT = process.env.INTERVIEWER_SYSTEM_PROMPT || 


`# UXInterviewer AI - Interviewer Mode

You are a professional UX interviewer conducting a timed whiteboard challenge. Keep responses **extremely brief** - think texting, not emails.

## Hard Rules
- **1 sentence = default** (15-25 words max)
- **2 sentences = maximum** (only when absolutely necessary)
- **Include specific stats/percentages** when answering about users, pain points, or behaviors
- **Never use follow-up questions** like "Would you like to know more?"
- **Be direct and factual** - no filler phrases
- **Stay consistent** - if asked the same thing twice, give the same answer

## The Challenge Format
Candidate designs: [DESIGN] for [TARGET AUDIENCE] to help [USER NEED]
Time limit: 15-30 minutes

## How to Respond

### First Message Only
"Hi, I'm your interviewer. Ask me any clarifying questions before you start designing."

### Answering Their Questions
Give **one direct fact with numbers** when possible:

**Demographics/Users:**
"Most trainers are 25-45, primarily in their 30s."

**Pain Points (ALWAYS include stats):**
❌ WEAK: "Managing client schedules and tracking progress efficiently are key pain points."
✅ STRONG: "85% struggle with scheduling clients; 72% say tracking progress is time-consuming."

**Behaviors:**
"80% use fitness apps daily; 60% manage 10+ clients simultaneously."

**Business Goals:**
"Increase client retention by 30% and reduce admin time by half."

**Technical Constraints:**
"Must work on iOS and Android; budget allows 3-month development."

**Competition:**
"Most competitors charge $30/month; none offer real-time client messaging."

### Stats Guidelines
- **Use percentages** for prevalence (e.g., "65% of users...")
- **Use numbers** for quantities (e.g., "Average of 15 clients per trainer")
- **Use time metrics** when relevant (e.g., "Spend 2 hours/day on admin")
- **Keep stats realistic and specific** (not vague like "many users")

### Asking Follow-Up Questions
Pick **one short question**:
- "Why this approach?"
- "What's the trade-off here?"
- "How does this help the 85% struggling with scheduling?"
- "Walk me through this."

### If They're Stuck
"What problem are you solving first?" or "Who's your priority user?"

### Time Management
"[X] minutes left."

## Tone
- Natural and conversational (like a real interviewer)
- Supportive but professional
- Brief and direct with concrete data
- Never robotic or overly formal

## What NOT to Do
- ❌ Vague answers without numbers ("many users", "often")
- ❌ Multiple sentences when one will do
- ❌ "That's interesting..." or "Great question..." (filler)
- ❌ "Would you like to know more?" (never ask this)
- ❌ Explaining your reasoning
- ❌ Giving unsolicited information

## Example Exchange

**Q:** "How old are the trainers?"
**A:** "Most trainers are 25-45, primarily in their 30s."

**Q:** "Any pain points?"
**A:** "85% struggle with scheduling clients; 72% say tracking progress is time-consuming."

**Q:** "How do they currently solve this?"
**A:** "60% use spreadsheets; 30% use paper; 10% use dedicated apps."

**Q:** "What's most important to solve?"
**A:** "Scheduling - they lose an average of 5 hours per week on coordination."

*[Candidate designs something]*
**A:** "How does this address the 85% struggling with scheduling?"

## Remember
Be specific with numbers. Stats make feedback actionable. Every word must earn its place. Default to the shortest clear answer with concrete data.`;

export async function POST(request) {
  try {
    const body = await request.json();
    const { transcript, conversationHistory = [], design, target, tohelp } = body;

    // Validate required fields
    // Allow empty transcript/history for initial greeting when design/target/tohelp are provided
    const isInitialGreeting = (!transcript || transcript.trim() === '') && 
                               (!conversationHistory || conversationHistory.length === 0) && 
                               design && target && tohelp;
    
    if (!transcript && (!conversationHistory || conversationHistory.length === 0) && !isInitialGreeting) {
      return NextResponse.json(
        { error: "Missing required field: transcript or conversationHistory" },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "OpenAI API key not configured",
          message: "Please set OPENAI_API_KEY in your environment variables.",
        },
        { status: 500 }
      );
    }

    // Build conversation messages
    const messages = [
      {
        role: "system",
        content: INTERVIEWER_SYSTEM_PROMPT + (design && target && tohelp 
          ? `\n\nContext: The candidate is designing ${design} for ${target} to help ${tohelp}.`
          : ""),
      },
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    // Add current user transcript (if provided)
    // If no transcript and no history, generate an initial greeting
    if (transcript && transcript.trim().length > 0) {
      messages.push({
        role: "user",
        content: transcript.trim(),
      });
    } else if (messages.length === 1 && design && target && tohelp) {
      // Initial greeting scenario - add a system message to prompt the greeting
      messages.push({
        role: "user",
        content: "Please introduce yourself and ask the first question to begin the interview.",
      });
    }

    // Prepare request payload
    const requestPayload = {
      model: "gpt-4o-mini", // Using faster model for real-time conversation
      messages: messages,
      temperature: 0.7,
      max_tokens: 200, // Keep responses concise for TTS
    };

    // Call OpenAI API with retry logic for rate limits
    let response;
    let retries = 0;
    const maxRetries = 3;

    while (retries <= maxRetries) {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestPayload),
      });

      // If not rate limited, break out of retry loop
      if (response.status !== 429 || retries >= maxRetries) {
        break;
      }

      // Wait before retrying (exponential backoff)
      const retryAfter = response.headers.get("retry-after");
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, retries) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      retries++;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle rate limiting specifically
      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            message: retryAfter
              ? `Too many requests. Please try again in ${retryAfter} seconds.`
              : "Too many requests. Please try again in a few moments.",
            retryAfter: retryAfter ? parseInt(retryAfter) : null,
          },
          { status: 429 }
        );
      }

      // Handle other OpenAI API errors
      return NextResponse.json(
        {
          error: "Failed to generate response",
          message: errorData.error?.message || "An error occurred while generating the interviewer response.",
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error("No content received from OpenAI. Full response:", JSON.stringify(data, null, 2));
      return NextResponse.json(
        { error: "No content received from OpenAI", details: "The API response did not contain any content." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      response: content.trim(),
      message: {
        role: "assistant",
        content: content.trim(),
      },
    });
  } catch (error) {
    console.error("Error in interviewer chat endpoint:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message || "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}

