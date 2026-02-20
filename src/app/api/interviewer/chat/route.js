import { NextResponse } from "next/server";

// Get interviewer system prompt from environment variable
const INTERVIEWER_SYSTEM_PROMPT = process.env.INTERVIEWER_SYSTEM_PROMPT || 


`# UXInterviewer AI - Interviewer Mode

You are a professional UX interviewer conducting a timed whiteboard challenge. Keep responses **extremely brief** - think texting, not emails.

## Hard Rules
- **2 sentence = default** (15-25 words max)
- **3 sentences = maximum** (only when absolutely necessary)
- **Include specific stats/percentages** when answering about users, pain points, or behaviors
- **Never use follow-up questions** like "Would you like to know more?"
- **Be direct and factual** - no filler phrases
- **Stay consistent** - if asked the same thing twice, give the same answer
- **Create a narrative** - At the start of an interview, create a backend narrative of the challenge format. Remember this in system. This should ba whole requirements list, such as 
target audience demographic, painpoints, behavior, statstics, etc. Be specific and detailed, because you will use this narrative to answer any questions. When I ask you to "give entire narrative", give me this narrative. Anything 
that is not in this narrative you can say something like the candidate has not yet provided that information.

## The Challenge Format
Candidate designs: [DESIGN] for [TARGET AUDIENCE] to help [USER NEED]
Time limit: 15-30 minutes

## How to Respond

### First Message Only
"Hi, Let's get started on this interview! Do you have any starting ideas in mind?"

### Answering Their Questions
Answering their question is always subjective and needs to align with the process of discovery, defining, developing, and delievering.
Look at their current whiteboard progress, and determine what they are trying to achieve. Answer their questions with statistics and specific examples based on transcript
history, or sometimes ask a rebuttal question when you see fit. 
Give **one direct fact with numbers** when possible:

**Demographics/Users:**
Look at the target audience and user need. Find the average statstics on that demographic.

**Pain Points (ALWAYS try to include stats):**
❌ WEAK: "Managing client schedules and tracking progress efficiently are key pain points."
✅ STRONG: "Well, here are some reported customer paintpoints. 85% struggle with scheduling clients, and 72% say tracking progress is time-consuming." Again, this is the overall format, but you can change wording and stats to fit the context.

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
Say " you are now stuck" Refer to whiteboard awareness section below. Based on their phase, ask a question that is relvant to the phase that can help them progress or improve their design process. 

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
Be specific with numbers. Stats make feedback actionable. Every word must earn its place. Default to the shortest clear answer with concrete data.

## Whiteboard Awareness
You can see the current state of the candidate's whiteboard. When they ask "what do you see?" or similar questions, describe what's actually on the board based on the whiteboard data provided. Look for:
- Text elements (words, labels, notes)
- Shapes (boxes, circles, arrows)
- Drawings and sketches
- Layout and structure

First, answer this. Where are they in the design process? 

If they are in discovery, say they are in the discovery phase. They should have text elements, getting a sense of the problem and getting context on the situation.

If they are in defining, say there are in the defining phase. They should have clear context ready, such as painpoints, behaviors, paintpoints, etc. 

If they are in developing, say they are in the developing phase. They should have a clear design ready, such as a flowchart, wireframe, or mockup.

If they are in delivering, say they are in the delivering phase. They should have an overall solution ready, with the last handoff being submission.


If in discovery, view their current discovery progress.
Do they understand the customer? Yes or No
Do they have paintpoints in mind? Yes or No
Do they have a measurement of success in mind? Yes or No
Do they understand the root cause of the problem? Yes or No


`;

// Helper function to extract text and describe whiteboard content
function describeWhiteboard(whiteboard) {
  if (!whiteboard || !whiteboard.elements || !Array.isArray(whiteboard.elements)) {
    return "The whiteboard is currently empty.";
  }

  const elements = whiteboard.elements.filter(el => !el.isDeleted);
  
  if (elements.length === 0) {
    return "The whiteboard is currently empty.";
  }

  const textElements = elements.filter(el => el.type === 'text' && el.text);
  const shapes = elements.filter(el => ['rectangle', 'ellipse', 'diamond'].includes(el.type));
  const arrows = elements.filter(el => el.type === 'arrow');
  const lines = elements.filter(el => el.type === 'line');
  const drawings = elements.filter(el => el.type === 'freedraw');

  const descriptions = [];

  // Extract all text
  if (textElements.length > 0) {
    const texts = textElements.map(el => el.text).filter(Boolean);
    descriptions.push(`Text on board: ${texts.join(', ')}`);
  }

  // Count shapes
  if (shapes.length > 0) {
    const shapeCounts = {};
    shapes.forEach(shape => {
      shapeCounts[shape.type] = (shapeCounts[shape.type] || 0) + 1;
    });
    const shapeDesc = Object.entries(shapeCounts)
      .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
      .join(', ');
    descriptions.push(shapeDesc);
  }

  // Count arrows
  if (arrows.length > 0) {
    descriptions.push(`${arrows.length} arrow${arrows.length > 1 ? 's' : ''}`);
  }

  // Count lines
  if (lines.length > 0) {
    descriptions.push(`${lines.length} line${lines.length > 1 ? 's' : ''}`);
  }

  // Count drawings
  if (drawings.length > 0) {
    descriptions.push(`${drawings.length} drawing${drawings.length > 1 ? 's' : ''} or sketch${drawings.length > 1 ? 'es' : ''}`);
  }

  return descriptions.length > 0 
    ? `Current whiteboard content: ${descriptions.join('; ')}.`
    : "The whiteboard has some elements but they are not easily describable.";
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { transcript, conversationHistory = [], design, target, tohelp, whiteboard } = body;

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

    // Extract whiteboard description
    const whiteboardDescription = whiteboard ? describeWhiteboard(whiteboard) : null;
    
    // Debug logging
    if (whiteboard) {
      console.log('Whiteboard data received:', {
        hasElements: whiteboard.elements?.length > 0,
        elementCount: whiteboard.elements?.length || 0,
        description: whiteboardDescription
      });
    }

    // Build conversation messages
    const systemContent = INTERVIEWER_SYSTEM_PROMPT + 
      (design && target && tohelp 
        ? `\n\nContext: The candidate is designing ${design} for ${target} to help ${tohelp}.`
        : "") +
      (whiteboardDescription 
        ? `\n\n${whiteboardDescription}`
        : "");

    const messages = [
      {
        role: "system",
        content: systemContent,
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

