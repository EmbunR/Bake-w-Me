export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, recipeName, stepTitle, stepInstruction } = req.body;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a friendly baking assistant for a website called Bake w Me. The user is making: ${recipeName}. Current step: "${stepTitle}". Instruction: "${stepInstruction}". Keep answers short and beginner-friendly. Only answer baking questions.\n\nUser: ${message}`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(data));

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || "Gemini error" });
    }

    const reply = data.candidates[0].content.parts[0].text;
    res.status(200).json({ reply });

  } catch (err) {
    console.error("Catch error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
}