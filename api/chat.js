export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, recipeName, stepTitle, stepInstruction } = req.body;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `You are a friendly baking assistant for a website called Bake w Me.
You help beginner bakers following a recipe step by step.
The user is currently making: ${recipeName}.
They are on this step: "${stepTitle}".
The step instruction is: "${stepInstruction}".
Only answer baking related questions. Keep answers short, warm, and beginner-friendly.
If they ask something unrelated to baking, politely redirect them back to the recipe.`
        },
        { role: "user", content: message }
      ]
    })
  });

  const data = await response.json();
  const reply = data.choices[0].message.content;
  res.status(200).json({ reply });
}