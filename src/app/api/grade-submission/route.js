import { NextResponse } from "next/server";

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
                },
              },
            ],
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
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
      return NextResponse.json(
        { error: "No content received from OpenAI" },
        { status: 500 }
      );
    }

    // Try to parse JSON from the response
    // Look for JSON in fenced code block labeled "json" (as per scoring_output_format)
    let evaluation;
    try {
      // First try to find JSON in ```json ... ``` block
      const jsonBlockMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonBlockMatch) {
        evaluation = JSON.parse(jsonBlockMatch[1]);
      } else {
        // Fallback: try to find any JSON object in the content
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          evaluation = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      }
    } catch (parseError) {
      return NextResponse.json(
        { error: "Failed to parse evaluation response", details: parseError.message },
        { status: 500 }
      );
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

