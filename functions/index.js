const { onRequest } = require("firebase-functions/https");
const { setGlobalOptions } = require("firebase-functions");

setGlobalOptions({ maxInstances: 10 });

exports.chat = onRequest({ cors: true }, async (req, res) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const { message, recipeName, stepTitle, stepInstruction } = req.body;

  // Your Claude API key — we'll add this properly as an environment variable next
  const OPENAI_API_KEY = "Enter-API-Key";

  try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 300,
        messages: [
        {
            role: "system",
            content: `You are a friendly baking assistant for a website called Bake w Me.
    You help beginner bakers who are currently following a recipe step by step.
    The user is currently making: ${recipeName}.
    They are on this step: "${stepTitle}".
    The step instruction is: "${stepInstruction}".
    Only answer questions related to baking and this recipe. Keep answers short, warm, and beginner-friendly.
    If they ask something unrelated to baking, politely redirect them back to the recipe.`
        },
        { role: "user", content: message }
        ]
    })
    });

    const data = await response.json();
    const reply = data.choices[0].message.content;
    res.status(200).json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});