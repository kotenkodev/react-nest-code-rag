export function formatErrorMessage(rawError?: string | null): string {
  if (!rawError) return "An unexpected error occurred.";

  const str = String(rawError).trim();

  // Rate limit
  if (
    str.includes("429") ||
    str.includes("RATE_TOKEN_LIMIT_EXCEEDED") ||
    str.toLowerCase().includes("rate limit exceeded")
  ) {
    return "AI Embedding rate limit reached (100,000 tokens/min). Please wait a moment and try again.";
  }

  // Token limit exceeded
  if (
    str.includes("INPUT_TOKEN_LIMIT_EXCEEDED") ||
    str.toLowerCase().includes("exceeds the model")
  ) {
    return "File content exceeded the maximum token limit for processing.";
  }

  // AI Model error
  if (str.includes("404") && str.toLowerCase().includes("model")) {
    return "The configured AI model is currently unavailable. Please check your provider settings.";
  }

  // Binary/Encoding error
  if (str.includes("22021") || str.includes("invalid byte sequence")) {
    return "Binary file encoding error detected during indexing.";
  }

  // Extract JSON message if embedded
  const jsonMatch = str.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.detail) {
        if (typeof parsed.detail === "string") return parsed.detail;
        if (parsed.detail.message) return parsed.detail.message;
      }
      if (parsed.message) return parsed.message;
      if (parsed.error?.message) return parsed.error.message;
    } catch {
      // Fallback
    }
  }

  // Clean up standard Error prefixes
  return str.replace(/^Error:\s*/i, "");
}
