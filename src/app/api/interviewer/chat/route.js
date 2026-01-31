import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

// Get interviewer system prompt from environment variable
const INTERVIEWER_SYSTEM_PROMPT = process.env.INTERVIEWER_SYSTEM_PROMPT || `You are a professional UX design interviewer conducting a design challenge interview. Your role is to:

1. Ask thoughtful, probing questions about the candidate's design process and decisions
2. Guide the conversation naturally, building on the candidate's responses
3. Keep questions concise (1-2 sentences) to maintain a conversational flow
4. Show interest in the candidate's work and ask follow-up questions
5. Avoid being overly formal - maintain a friendly, professional tone
6. Focus on understanding the candidate's design thinking, not just the final output
7. Ask about user needs, design constraints, trade-offs, and decision-making rationale

Remember: This is a real-time conversation. Keep your responses brief and conversational. Do not repeat questions that have already been asked. Build on previous responses to create a natural dialogue.`;

export async function POST(request) {
  try {
    const body = await request.json();
    const { transcript, conversationHistory = [], design, target, tohelp } = body;

    // Validate required fields
    if (!transcript && (!conversationHistory || conversationHistory.length === 0)) {
      return NextResponse.json(
        { error: "Missing required field: transcript or conversationHistory" },
        { status: 400 }
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

    // Call OpenAI API using SDK
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      console.error("No content received from OpenAI. Full response:", JSON.stringify(completion, null, 2));
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

    // Handle rate limiting
    if (error.status === 429) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again in a few moments.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message || "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}
