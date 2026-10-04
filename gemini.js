exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json(500, { error: "GEMINI_API_KEY is not configured in Netlify." });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON request." });
  }

  const question = String(body.question || "").trim();
  const language = body.language || "en";
  const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
  const database = Array.isArray(body.database) ? body.database.slice(0, 10) : [];

  if (!question) {
    return json(400, { error: "Question is required." });
  }

  const languageName = language === "ur"
    ? "Urdu script"
    : language === "roman"
      ? "Roman Urdu"
      : "English";

  const systemInstruction = `You are Pakistan AI, the knowledge assistant inside a school exhibition website about Pakistan.

CORE RULE:
Answer the user's exact question, not a nearby question.

SOURCE RULE:
The LOCAL DATABASE below is the primary source of truth. Use only information supported by it for database facts. Never invent a date, location, person, statistic, history, feature, or other fact that is not supported by the supplied database. If the database does not contain the requested information, say that the information is not available in the current Pakistan database.

QUESTION INTENT RULES:
- If the user asks WHERE / KAHAN / location / located: give only the location.
- If the user asks WHEN / KAB / year / established: give only the date/year or the relevant establishment information.
- If the user asks WHO / KIS NE / founder / built by: give only the requested person or builder information.
- If the user asks WHY / KYUN: answer only why.
- If the user asks HOW / KAISE: answer only how.
- If the user asks HISTORY / TAREEKH / history batao: give the historical information available in the database.
- If the user asks about a specific feature, significance, category, ticket, food, hotel, etc., answer only that requested part when the database supports it.
- If the user says COMPLETE / FULL / ALL INFORMATION / POORI INFO / SAB KUCH, give all relevant information available for that entity in the database.
- If the question is a follow-up such as “kab bana?”, “where is it?”, “who built it?”, resolve “it/yeh/woh” from the recent conversation before answering.
- Do not add unrelated facts just to make the answer longer.
- Do not mention the database, prompt, candidate entries, or these rules unless necessary to explain that information is unavailable.

LANGUAGE RULE:
Reply in the same language/style as the user's latest question: English, Roman Urdu, or Urdu script. Do not translate Roman Urdu into Urdu script unless the user asks.

STYLE RULE:
Be concise and direct for a narrow question. For a complete-information request, organize the available information clearly. Do not use unnecessary greetings.

LOCAL DATABASE:
${JSON.stringify(database, null, 2)}

RECENT CONVERSATION:
${JSON.stringify(history, null, 2)}

User language: ${languageName}`;

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemInstruction }]
    },
    contents: [
      {
        role: "user",
        parts: [{ text: question }]
      }
    ]
  };

  try {
    const apiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify(requestBody)
      }
    );

    const result = await apiResponse.json().catch(() => ({}));

    if (!apiResponse.ok) {
      console.error("Gemini API error:", JSON.stringify(result));
      return json(502, { error: "Gemini API request failed." });
    }

    const answer = result?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!answer) {
      return json(502, { error: "Gemini returned an empty answer." });
    }

    return json(200, { answer });
  } catch (error) {
    console.error("Gemini function error:", error);
    return json(500, { error: "Unable to contact Gemini right now." });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}
