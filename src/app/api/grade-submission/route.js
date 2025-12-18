import { NextResponse } from "next/server";
import { getSession } from '@/lib/session';
import { getAWSCredentialsWithRefresh } from '@/lib/auth-helper';
import { putItem } from '@/lib/dynamodb';

// Get SYSTEM_PROMPT from environment variable
const SYSTEM_PROMPT =
  process.env.GRADING_SYSTEM_PROMPT;

export async function POST(request) {
  try {
    const body = await request.json();
    const { design, target, tohelp, screenshot, excalidrawData, model = "gpt-4" } = body;

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
        // Screenshot-based evaluation using Vision API
        userPrompt = `Evaluate this design submission:

        DESIGN CHALLENGE:
        DESIGN ${design}
        FOR ${target}
        TO HELP ${tohelp}

        Please analyze the provided screenshot of the Excalidraw design and provide your evaluation.`;

        requestPayload = {
        // Use gpt-4o or gpt-4o-mini for vision support
        model: model === "gpt-4" ? "gpt-4o-mini" : model === "gpt-4o-mini" ? "gpt-4o-mini" : model,
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
                  detail: "high",
                },
              },
            ],
          },
        ],
        temperature: 0.7,
        max_tokens: 4000, // Increased to ensure complete JSON response
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
    // Look for JSON in fenced code block labeled "json" (as per scoring_output_format)
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
      // Use a more robust regex that handles both complete and potentially truncated blocks
      let jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      
      // If not found, try to find a JSON block that might be at the end (truncated)
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
          // If parsing fails, try balanced extraction in case JSON is incomplete
          console.log("Direct parse failed, trying balanced extraction");
          const balancedJson = findJsonObject(jsonText);
          if (balancedJson) {
            evaluation = JSON.parse(balancedJson);
          } else {
            throw new Error("JSON in code block is invalid or truncated: " + e.message);
          }
        }
      } else {
        // Try to find JSON in ``` ... ``` block (without json label)
        const codeBlockMatches = content.match(/```[\s\S]*?```/g);
        if (codeBlockMatches && codeBlockMatches.length > 0) {
          // Get the last code block (most likely to contain the JSON)
          const lastBlock = codeBlockMatches[codeBlockMatches.length - 1];
          const codeContent = lastBlock.replace(/```/g, '').trim();
          // Remove "json" label if present at the start
          const jsonContent = codeContent.replace(/^json\s*/i, '').trim();
          try {
            console.log("Found JSON in code block (no label)");
            evaluation = JSON.parse(jsonContent);
          } catch (e) {
            console.log("Failed to parse code block content, trying balanced extraction");
            // Try to find balanced JSON in the code block
            const balancedJson = findJsonObject(jsonContent);
            if (balancedJson) {
              evaluation = JSON.parse(balancedJson);
            } else {
              throw new Error("JSON appears to be truncated or invalid: " + e.message);
            }
          }
        } else {
          // Check if there's a partial code block at the end
          const partialCodeBlock = content.match(/```json\s*([\s\S]*)$/);
          if (partialCodeBlock) {
            const jsonText = partialCodeBlock[1].trim();
            const balancedJson = findJsonObject(jsonText);
            if (balancedJson) {
              console.log("Found partial JSON block, extracted balanced JSON");
              evaluation = JSON.parse(balancedJson);
            } else {
              throw new Error("JSON response appears to be truncated. The response was cut off before completion. Try increasing max_tokens or check the API response limits.");
            }
          } else {
            // If still not parsed, try to find any JSON object in the content using balanced extraction
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
          rawContent: content.substring(0, 500) // Include first 500 chars for debugging
        },
        { status: 500 }
      );
    }

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
          
          // Extract scores from evaluation object
          // The evaluation has diagram_overall_score, technical_overall_score, etc.
          const scores = {
            diagramming: evaluation.diagram_overall_score ?? 0,
            technical: evaluation.technical_overall_score ?? 0,
            linguistics: evaluation.transcript_overall_score ?? 0,
            overall: evaluation.overall_score ?? 0,
          };
          
          // Extract breakdown from criteria (criteria contains diagramming, technical, linguistic arrays)
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
            // Evaluation results
            evaluation: evaluation,
            scores: scores,
            breakdown: breakdown,
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
          // Continue to return the evaluation even if DB save fails
        }
      } else {
        console.log("No session found, skipping DynamoDB save");
      }
    } catch (sessionError) {
      // Log error but don't fail the request - grading was successful
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

