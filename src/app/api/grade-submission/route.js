import { NextResponse } from "next/server";
import { getSession } from '@/lib/session';
import { getAWSCredentialsWithRefresh } from '@/lib/auth-helper';
import { putItem } from '@/lib/dynamodb';
import { readFileSync } from 'fs';
import { join } from 'path';

// Get SYSTEM_PROMPT from file
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

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "OpenAI API key not configured",
          scores: {
            technical: 75,
            diagramming: 70,
            linguistics: 65,
          },
          breakdown: [
            {
              category: "Information Architecture",
              score: 75,
              feedback: "API key not configured. Please set OPENAI_API_KEY in your environment variables.",
            },
          ],
        },
        { status: 200 }
      );
    }

    // Use screenshot with vision API if screenshot is provided, otherwise fall back to JSON
    let userPrompt;
    let requestPayload;

    if (screenshot) {
        // Format conversation history/transcript if provided
        let transcriptText = '';
        if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
          transcriptText = '\n\nUSER TRANSCRIPT:\n';
          conversationHistory.forEach((msg, idx) => {
            if (msg.role === 'user' || msg.role === 'assistant') {
              transcriptText += `${msg.role === 'user' ? 'USER' : 'MODEL'}: ${msg.content || msg.text || ''}\n`;
            }
          });
        }

        // Format excalidraw data if provided (for text extraction)
        let whiteboardDataText = '';
        if (excalidrawData && excalidrawData.elements) {
          try {
            const elements = excalidrawData.elements;
            const textElements = elements.filter(el => el.type === 'text' || (el.type === 'freedraw' && el.text));
            if (textElements.length > 0) {
              whiteboardDataText = '\n\nWHITEBOARD TEXT ELEMENTS (from excalidrawData):\n';
              textElements.forEach((el, idx) => {
                if (el.text) {
                  whiteboardDataText += `[${idx + 1}] ${el.text}\n`;
                } else if (el.originalText) {
                  whiteboardDataText += `[${idx + 1}] ${el.originalText}\n`;
                }
              });
            }
          } catch (error) {
            console.error('Error parsing excalidrawData:', error);
          }
        }
        
        // Screenshot-based evaluation using Vision API
        userPrompt = `Evaluate this design submission:

        DESIGN CHALLENGE:
        DESIGN ${design}
        FOR ${target}
        TO HELP ${tohelp}${transcriptText}${whiteboardDataText}

        Please analyze the provided screenshot of the Excalidraw design and extract all text notes from the whiteboard. Categorize notes by phase (discovery, define, development, delivery) and include them in the whiteboard_notes section of your JSON response.`;

        // Determine the model to use
        const modelToUse = model === "gpt-4" ? "gpt-4o-mini" : model === "gpt-4o-mini" ? "gpt-4o-mini" : model;
        
        requestPayload = {
        // Use gpt-4o or gpt-4o-mini for vision support
        model: modelToUse,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${screenshot}`,
                  detail: "low", // Changed from "high" to "low" for faster processing (512x512 instead of high-res)
                },
              },
            ],
          },
        ],
        temperature: 0.3, // Reduced from 0.7 to 0.3 for faster, more focused responses
        max_tokens: 6000, // Increased for JSON output with partial credit evaluations
        // Request JSON format if model supports it (gpt-4o and gpt-4o-mini support this)
        ...(modelToUse.includes("gpt-4o") ? { response_format: { type: "json_object" } } : {}),
      };
    } else {
      return NextResponse.json(
        { error: "JSON-based evaluation is currently disabled. Please use screenshot submission." },
        { status: 400 }
      );
    }

    // Estimate token count (rough approximation: ~4 chars per token)
    const systemPromptTokens = Math.ceil((SYSTEM_PROMPT?.length || 0) / 4);
    const userPromptTokens = Math.ceil(userPrompt.length / 4);
    // Image tokens: base64 image size / 4 (rough estimate, actual is more complex)
    const imageTokens = screenshot ? Math.ceil(screenshot.length / 4) : 0;
    const totalEstimatedTokens = systemPromptTokens + userPromptTokens + imageTokens + 1500; // + max_tokens for response

    console.log("=== GRADING API REQUEST ===");
    console.log("Model:", requestPayload.model);
    console.log("Submission type:", screenshot ? "Screenshot (Vision API)" : "JSON");
    console.log("Estimated tokens:", totalEstimatedTokens);
    console.log("System prompt length:", SYSTEM_PROMPT?.length || 0, "chars");
    console.log("User prompt length:", userPrompt.length, "chars");
    if (screenshot) {
      console.log("Screenshot size:", (screenshot.length / 1024).toFixed(2), "KB (base64)");
    }
    console.log("\n--- User Prompt ---");
    console.log(userPrompt);
    console.log("\n--- Request Payload (messages preview) ---");
    console.log(JSON.stringify({
      system: SYSTEM_PROMPT?.substring(0, 200) + "...",
      user: {
        text: userPrompt,
        image: screenshot ? `[Base64 image, ${(screenshot.length / 1024).toFixed(2)} KB]` : "N/A",
      },
    }, null, 2));
    console.log("========================\n");

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
            details: errorData,
            retryAfter: retryAfter ? parseInt(retryAfter) : null,
          },
          { status: 429 }
        );
      }
      
      // Handle other OpenAI API errors
      return NextResponse.json(
        {
          error: "Failed to grade submission",
          message: errorData.error?.message || "An error occurred while grading your submission.",
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

    // Log the raw content for debugging
    console.log("=== RAW OPENAI RESPONSE ===");
    console.log(content);
    console.log("==========================\n");

    // Try to parse JSON from the response
    let parsedEvaluation = null;
    let parseError = null;
    
    try {
      // Try to extract JSON from the content (it might be wrapped in markdown code blocks or have extra text)
      let jsonString = content.trim();
      
      // Remove markdown code blocks if present
      if (jsonString.startsWith('```')) {
        const lines = jsonString.split('\n');
        const startIndex = lines.findIndex(line => line.trim().startsWith('```'));
        const endIndex = lines.findIndex((line, idx) => idx > startIndex && line.trim().startsWith('```'));
        if (startIndex !== -1 && endIndex !== -1) {
          jsonString = lines.slice(startIndex + 1, endIndex).join('\n');
        }
      }
      
      // Try to find JSON object in the content
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
      
      parsedEvaluation = JSON.parse(jsonString);
      console.log("=== PARSED JSON EVALUATION ===");
      console.log(JSON.stringify(parsedEvaluation, null, 2));
      console.log("=============================\n");
    } catch (error) {
      parseError = error.message;
      console.error("Failed to parse JSON from response:", error);
      console.log("Content that failed to parse:", content.substring(0, 500));
    }

    // Return evaluation with parsed JSON if available, otherwise return raw response
    const evaluation = {
      rawResponse: content,
      parsed: parsedEvaluation,
      parseError: parseError,
      timestamp: new Date().toISOString(),
    };

    // Save submission to DynamoDB after successful grading
    try {
      const session = await getSession();
      
      if (session && session.idToken) {
        try {
          // Get AWS credentials with automatic token refresh if needed
          const { credentials } = await getAWSCredentialsWithRefresh();
          
          // Create unique submission ID
          const submissionId = `submission-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
          const timestamp = new Date().toISOString();
          
          // Prepare submission item for DynamoDB
          // Using PK/SK pattern for single-table design
          const submissionItem = {
            PK: `USER#${session.sub}`,  // Partition key
            SK: `SUBMISSION#${submissionId}`,  // Sort key
            userId: session.sub,  // Keep for filtering/access control
            submissionId: submissionId,
            timestamp: timestamp,
            // Original submission data
            design: design,
            target: target,
            tohelp: tohelp,
            model: model,
            // Completion time
            completionTimeSeconds: completionTimeSeconds || null,
            completionTimeMinutes: completionTimeMinutes || null,
            // Evaluation results (raw text)
            evaluation: evaluation,
            // Store excalidraw JSON data (not screenshot - too large for DynamoDB)
            excalidrawData: excalidrawData ? JSON.stringify(excalidrawData) : null,
            // Note: Screenshot is not stored in DynamoDB due to size limits (400KB max)
            // Screenshot is only used for grading and not persisted
          };
          
          // Save to DynamoDB
          await putItem(credentials, submissionItem);
          console.log(`Submission saved to DynamoDB: ${submissionId}`);
        } catch (dbError) {
          // Log error but don't fail the request - grading was successful
          console.error("Error saving submission to DynamoDB:", dbError);
          
          // If it's a token expiration error, note that the next API call will trigger the redirect
          // Note: We don't return an error here because grading was successful
          // The client will get the evaluation, but the DB save failed
          // The next API call will trigger the redirect, and the client will handle storing the return URL
          if (dbError.code === 'TOKEN_EXPIRED' || dbError.requiresAuth || dbError.message?.includes('Token expired')) {
            // Client-side code will handle storing the return URL when it detects the 401
          }
          // Continue to return the evaluation even if DB save fails
        }
      } else {
        console.log("No session found, skipping DynamoDB save");
      }
    } catch (sessionError) {
      // Log error but don't fail the request - grading was successful
      console.error("Error getting session for DynamoDB save:", sessionError);
    }

    // Return raw text evaluation (no transformation)
    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Error grading submission:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

