import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { text, voiceId = "21m00Tcm4TlvDq8ikWAM" } = body; // Default 11Labs voice ID

    // Validate required fields
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid required field: text" },
        { status: 400 }
      );
    }

    // Check if 11Labs API key is configured
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "11Labs API key not configured",
          message: "Please set ELEVENLABS_API_KEY in your environment variables.",
        },
        { status: 500 }
      );
    }

    // Validate voice ID format (11Labs voice IDs are typically alphanumeric)
    if (!voiceId || typeof voiceId !== "string") {
      return NextResponse.json(
        { error: "Invalid voice ID" },
        { status: 400 }
      );
    }

    // Prepare request payload for 11Labs API
    // Using eleven_multilingual_v2 which is available on free tier
    // (eleven_monolingual_v1 and eleven_multilingual_v1 were deprecated and removed)
    const requestPayload = {
      text: text.trim(),
      model_id: "eleven_multilingual_v2", // Free tier compatible model
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    };

    // Call 11Labs API with retry logic for rate limits
    let response;
    let retries = 0;
    const maxRetries = 3;

    while (retries <= maxRetries) {
      response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
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

      // Handle quota exceeded
      if (response.status === 403) {
        return NextResponse.json(
          {
            error: "Quota exceeded",
            message: "Your 11Labs API quota has been exceeded. Please check your account limits.",
          },
          { status: 403 }
        );
      }

      // Handle other 11Labs API errors
      return NextResponse.json(
        {
          error: "Failed to generate audio",
          message: errorData.detail?.message || errorData.message || "An error occurred while generating audio.",
          details: errorData,
        },
        { status: response.status }
      );
    }

    // Get audio blob from response
    const audioBlob = await response.blob();

    if (!audioBlob || audioBlob.size === 0) {
      return NextResponse.json(
        { error: "Empty audio response", message: "The TTS API returned an empty audio file." },
        { status: 500 }
      );
    }

    // Convert blob to base64 for easier transmission
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    return NextResponse.json({
      success: true,
      audio: base64Audio,
      mimeType: audioBlob.type || "audio/mpeg",
      size: audioBlob.size,
    });
  } catch (error) {
    console.error("Error in TTS generate endpoint:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message || "An unexpected error occurred while generating audio.",
      },
      { status: 500 }
    );
  }
}

