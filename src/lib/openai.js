import { OpenAI } from "openai";
import { Laminar } from "@lmnr-ai/lmnr";

// Patch OpenAI for Laminar tracing - must happen before creating client
Laminar.patch({ OpenAI: OpenAI });

const openai = new OpenAI();

export { openai };
