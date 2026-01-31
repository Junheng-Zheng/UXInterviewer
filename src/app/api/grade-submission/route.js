import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { getSession } from '@/lib/session';
import { getAWSCredentialsWithRefresh } from '@/lib/auth-helper';
import { putItem } from '@/lib/dynamodb';

// Get SYSTEM_PROMPT from environment variable
const SYSTEM_PROMPT =
  process.env.GRADING_SYSTEM_PROMPT;

export async function POST(request) {
  try {
    const body = await request.json();
    const { design, target, tohelp, screenshot, excalidrawData, model = "gpt-4", completionTimeSeconds, completionTimeMinutes } = body;

    // Check for screenshot (new method) or excalidrawData (old method)
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

    // Check if SYSTEM_PROMPT is configured
    if (!SYSTEM_PROMPT) {
      return NextResponse.json(
        {
          error: "GRADING_SYSTEM_PROMPT not configured",
          message: "Please set GRADING_SYSTEM_PROMPT in your environment variables.",
        },
        { status: 500 }
      );
    }

    // Use screenshot with vision API if screenshot is provided
    let userPrompt;
    let messages;

    if (screenshot) {
      // Screenshot-based evaluation using Vision API
      userPrompt = `Evaluate this design submission:

        DESIGN CHALLENGE:
        DESIGN ${design}
        FOR ${target}
        TO HELP ${tohelp}

        Please analyze the provided screenshot of the Excalidraw design and provide your evaluation.`;

      messages = [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${screenshot}`,
                detail: "low",
              },
            },
          ],
        },
      ];
    } else {
      return NextResponse.json(
        { error: "JSON-based evaluation is currently disabled. Please use screenshot submission." },
        { status: 400 }
      );
    }

    // Determine model to use
    const modelToUse = model === "gpt-4" ? "gpt-4o-mini" : model === "gpt-4o-mini" ? "gpt-4o-mini" : model;

    // Estimate token count (rough approximation: ~4 chars per token)
    const systemPromptTokens = Math.ceil((SYSTEM_PROMPT?.length || 0) / 4);
    const userPromptTokens = Math.ceil(userPrompt.length / 4);
    const imageTokens = screenshot ? Math.ceil(screenshot.length / 4) : 0;
    const totalEstimatedTokens = systemPromptTokens + userPromptTokens + imageTokens + 1500;

    console.log("=== GRADING API REQUEST ===");
    console.log("Model:", modelToUse);
    console.log("Submission type:", screenshot ? "Screenshot (Vision API)" : "JSON");
    console.log("Estimated tokens:", totalEstimatedTokens);
    console.log("System prompt length:", SYSTEM_PROMPT?.length || 0, "chars");
    console.log("User prompt length:", userPrompt.length, "chars");
    if (screenshot) {
      console.log("Screenshot size:", (screenshot.length / 1024).toFixed(2), "KB (base64)");
    }
    console.log("\n--- User Prompt ---");
    console.log(userPrompt);
    console.log("========================\n");

    // Call OpenAI API using SDK
    const completion = await openai.chat.completions.create({
      model: modelToUse,
      messages: messages,
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      console.error("No content received from OpenAI. Full response:", JSON.stringify(completion, null, 2));
      return NextResponse.json(
        { error: "No content received from OpenAI", details: "The API response did not contain any content." },
        { status: 500 }
      );
    }

    // Log the raw content for debugging
    console.log("=== RAW OPENAI RESPONSE ===");
    console.log(content);
    console.log("==========================\n");

    // Try to parse JSON from the response
    let evaluation;
    try {
      // Helper function to find balanced JSON object
      const findJsonObject = (text) => {
        let start = text.indexOf('{');
        if (start === -1) return null;

        let depth = 0;
        let inString = false;
        let escapeNext = false;

        for (let i = start; i < text.length; i++) {
          const char = text[i];

          if (escapeNext) {
            escapeNext = false;
            continue;
          }

          if (char === '\\') {
            escapeNext = true;
            continue;
          }

          if (char === '"') {
            inString = !inString;
            continue;
          }

          if (!inString) {
            if (char === '{') depth++;
            if (char === '}') {
              depth--;
              if (depth === 0) {
                return text.substring(start, i + 1);
              }
            }
          }
        }
        return null;
      };

      // First try to find JSON in ```json ... ``` block
      let jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);

      if (!jsonBlockMatch) {
        const jsonBlockAtEnd = content.match(/```json\s*([\s\S]*)$/);
        if (jsonBlockAtEnd) {
          console.log("Found JSON block at end (may be truncated)");
          jsonBlockMatch = jsonBlockAtEnd;
        }
      }

      if (jsonBlockMatch) {
        console.log("Found JSON in code block with json label");
        let jsonText = jsonBlockMatch[1].trim();
        try {
          evaluation = JSON.parse(jsonText);
        } catch (e) {
          console.log("Direct parse failed, trying balanced extraction");
          const balancedJson = findJsonObject(jsonText);
          if (balancedJson) {
            evaluation = JSON.parse(balancedJson);
          } else {
            throw new Error("JSON in code block is invalid or truncated: " + e.message);
          }
        }
      } else {
        const codeBlockMatches = content.match(/```[\s\S]*?```/g);
        if (codeBlockMatches && codeBlockMatches.length > 0) {
          const lastBlock = codeBlockMatches[codeBlockMatches.length - 1];
          const codeContent = lastBlock.replace(/```/g, '').trim();
          const jsonContent = codeContent.replace(/^json\s*/i, '').trim();
          try {
            console.log("Found JSON in code block (no label)");
            evaluation = JSON.parse(jsonContent);
          } catch (e) {
            console.log("Failed to parse code block content, trying balanced extraction");
            const balancedJson = findJsonObject(jsonContent);
            if (balancedJson) {
              evaluation = JSON.parse(balancedJson);
            } else {
              throw new Error("JSON appears to be truncated or invalid: " + e.message);
            }
          }
        } else {
          const partialCodeBlock = content.match(/```json\s*([\s\S]*)$/);
          if (partialCodeBlock) {
            const jsonText = partialCodeBlock[1].trim();
            const balancedJson = findJsonObject(jsonText);
            if (balancedJson) {
              console.log("Found partial JSON block, extracted balanced JSON");
              evaluation = JSON.parse(balancedJson);
            } else {
              throw new Error("JSON response appears to be truncated.");
            }
          } else {
            const balancedJson = findJsonObject(content);
            if (balancedJson) {
              console.log("Found JSON object using balanced extraction");
              evaluation = JSON.parse(balancedJson);
            } else {
              throw new Error("No valid JSON found in response. Content preview: " + content.substring(0, 200));
            }
          }
        }
      }
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError.message);
      console.error("Content that failed to parse:", content);
      return NextResponse.json(
        {
          error: "Failed to parse evaluation response",
          details: parseError.message,
          rawContent: content.substring(0, 500)
        },
        { status: 500 }
      );
    }

    // Save submission to DynamoDB after successful grading
    try {
      const session = await getSession();

      if (session && session.idToken) {
        try {
          const { credentials } = await getAWSCredentialsWithRefresh();

          const submissionId = `submission-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
          const timestamp = new Date().toISOString();

          const scores = {
            diagramming: evaluation.diagram_overall_score ?? 0,
            technical: evaluation.technical_overall_score ?? 0,
            linguistics: evaluation.transcript_overall_score ?? 0,
            overall: evaluation.overall_score ?? 0,
          };

          const breakdown = [];
          if (evaluation.criteria) {
            if (Array.isArray(evaluation.criteria.diagramming)) {
              breakdown.push(...evaluation.criteria.diagramming.map(item => ({ ...item, category: 'diagramming' })));
            }
            if (Array.isArray(evaluation.criteria.technical)) {
              breakdown.push(...evaluation.criteria.technical.map(item => ({ ...item, category: 'technical' })));
            }
            if (Array.isArray(evaluation.criteria.linguistic)) {
              breakdown.push(...evaluation.criteria.linguistic.map(item => ({ ...item, category: 'linguistic' })));
            }
          }

          const submissionItem = {
            PK: `USER#${session.sub}`,
            SK: `SUBMISSION#${submissionId}`,
            userId: session.sub,
            submissionId: submissionId,
            timestamp: timestamp,
            design: design,
            target: target,
            tohelp: tohelp,
            model: model,
            completionTimeSeconds: completionTimeSeconds || null,
            completionTimeMinutes: completionTimeMinutes || null,
            evaluation: evaluation,
            scores: scores,
            breakdown: breakdown,
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
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
