import { NextResponse } from "next/server";
import { getSession } from '@/lib/session';
import { getAWSCredentialsWithRefresh } from '@/lib/auth-helper';
import { putItem } from '@/lib/dynamodb';
import { readFileSync } from 'fs';
import { join } from 'path';
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { Laminar, observe, getTracer } from "@lmnr-ai/lmnr";

let SYSTEM_PROMPT;
try {
  const promptPath = join(process.cwd(), 'prompts', 'grading-system-prompt.txt');
  SYSTEM_PROMPT = readFileSync(promptPath, 'utf-8');
  console.log('Loaded grading-system-prompt.txt from file, length:', SYSTEM_PROMPT.length);
  console.log('Prompt preview (first 200 chars):', SYSTEM_PROMPT.substring(0, 200));
} catch (error) {
  console.error('Failed to read grading-system-prompt.txt:', error.message);
  console.log('Falling back to environment variable GRADING_SYSTEM_PROMPT');
  SYSTEM_PROMPT = process.env.GRADING_SYSTEM_PROMPT;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { design, target, tohelp, screenshot, excalidrawData, conversationHistory, model = "gpt-4", completionTimeSeconds, completionTimeMinutes } = body;

    if (!design || !target || !tohelp) {
      return NextResponse.json(
        { error: "Missing required fields: design, target, tohelp" },
        { status: 400 }
      );
    }

    if (!screenshot && !excalidrawData) {
      return NextResponse.json(
        { error: "Missing required field: either screenshot or excalidrawData must be provided" },
        { status: 400 }
      );
    }

    if (!SYSTEM_PROMPT) {
      return NextResponse.json(
        { error: "GRADING_SYSTEM_PROMPT not configured", message: "Please set GRADING_SYSTEM_PROMPT in your environment variables." },
        { status: 500 }
      );
    }

    if (!screenshot) {
      return NextResponse.json(
        { error: "JSON-based evaluation is currently disabled. Please use screenshot submission." },
        { status: 400 }
      );
    }

    // Build transcript text
    let transcriptText = '';
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      transcriptText = '\n\nUSER TRANSCRIPT:\n';
      conversationHistory.forEach((msg) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          transcriptText += `${msg.role === 'user' ? 'USER' : 'MODEL'}: ${msg.content || msg.text || ''}\n`;
        }
      });
    }

    // Extract whiteboard text elements
    let whiteboardDataText = '';
    if (excalidrawData && excalidrawData.elements) {
      try {
        const textElements = excalidrawData.elements.filter(el => el.type === 'text' || (el.type === 'freedraw' && el.text));
        if (textElements.length > 0) {
          whiteboardDataText = '\n\nWHITEBOARD TEXT ELEMENTS (from excalidrawData):\n';
          textElements.forEach((el, idx) => {
            const text = el.text || el.originalText;
            if (text) whiteboardDataText += `[${idx + 1}] ${text}\n`;
          });
        }
      } catch (error) {
        console.error('Error parsing excalidrawData:', error);
      }
    }

    const userPrompt = `Evaluate this design submission:

        DESIGN CHALLENGE:
        DESIGN ${design}
        FOR ${target}
        TO HELP ${tohelp}${transcriptText}${whiteboardDataText}

        Please analyze the provided screenshot of the Excalidraw design and extract all text notes from the whiteboard. Categorize notes by phase (discovery, define, development, delivery) and include them in the whiteboard_notes section of your JSON response.`;

    const modelToUse = "gemini-2.5-flash";

    console.log("=== GRADING API REQUEST ===");
    console.log("Model:", modelToUse);
    console.log("System prompt length:", SYSTEM_PROMPT?.length || 0, "chars");
    console.log("User prompt length:", userPrompt.length, "chars");
    console.log("Screenshot size:", (screenshot.length / 1024).toFixed(2), "KB (base64)");
    console.log("\n--- User Prompt ---");
    console.log(userPrompt);
    console.log("========================\n");

    const { text: content } = await observe({ name: 'grade-submission' }, async () => {
      Laminar.setTraceMetadata({ type: 'grading' });
      return generateText({
        model: google(modelToUse, { thinkingConfig: { thinkingBudget: 8000 } }),
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image", image: screenshot, mimeType: "image/png" },
            ],
          },
        ],
        temperature: 0.3,
        maxTokens: 6000,
        experimental_telemetry: {
          isEnabled: true,
          tracer: getTracer(),
        },
      });
    });

    if (!content) {
      return NextResponse.json(
        { error: "No content received from OpenAI", details: "The API response did not contain any content." },
        { status: 500 }
      );
    }

    console.log("=== RAW OPENAI RESPONSE ===");
    console.log(content);
    console.log("==========================\n");

    let parsedEvaluation = null;
    let parseError = null;

    try {
      let jsonString = content.trim();

      if (jsonString.startsWith('```')) {
        const lines = jsonString.split('\n');
        const startIndex = lines.findIndex(line => line.trim().startsWith('```'));
        const endIndex = lines.findIndex((line, idx) => idx > startIndex && line.trim().startsWith('```'));
        if (startIndex !== -1 && endIndex !== -1) {
          jsonString = lines.slice(startIndex + 1, endIndex).join('\n');
        }
      }

      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonString = jsonMatch[0];

      parsedEvaluation = JSON.parse(jsonString);
      console.log("=== PARSED JSON EVALUATION ===");
      console.log(JSON.stringify(parsedEvaluation, null, 2));
      console.log("=============================\n");
    } catch (error) {
      parseError = error.message;
      console.error("Failed to parse JSON from response:", error);
    }

    const evaluation = {
      rawResponse: content,
      parsed: parsedEvaluation,
      parseError: parseError,
      timestamp: new Date().toISOString(),
    };

    // Save to DynamoDB
    try {
      const session = await getSession();

      if (session && session.idToken) {
        try {
          const { credentials } = await getAWSCredentialsWithRefresh();

          const submissionId = `submission-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
          const timestamp = new Date().toISOString();

          const submissionItem = {
            PK: `USER#${session.sub}`,
            SK: `SUBMISSION#${submissionId}`,
            userId: session.sub,
            submissionId,
            timestamp,
            design,
            target,
            tohelp,
            model,
            completionTimeSeconds: completionTimeSeconds || null,
            completionTimeMinutes: completionTimeMinutes || null,
            evaluation,
            excalidrawData: excalidrawData ? JSON.stringify(excalidrawData) : null,
          };

          await putItem(credentials, submissionItem);
          console.log(`Submission saved to DynamoDB: ${submissionId}`);
        } catch (dbError) {
          console.error("Error saving submission to DynamoDB:", dbError);
        }
      } else {
        console.log("No session found, skipping DynamoDB save");
      }
    } catch (sessionError) {
      console.error("Error getting session for DynamoDB save:", sessionError);
    }

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Error grading submission:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
