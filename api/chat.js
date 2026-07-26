export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, recipeName, stepTitle, stepInstruction } = req.body;

  try {
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
            content: `You are a friendly baking assistant for a website called Bake w Me. The user is making: ${recipeName}. Current step: "${stepTitle}". Instruction: "${stepInstruction}". Keep answers short and beginner-friendly. Only answer baking questions.`
          },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(data));

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || "OpenAI error" });
    }

    const reply = data.choices[0].message.content;
    res.status(200).json({ reply });

  } catch (err) {
    console.error("Catch error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
}