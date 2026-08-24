import fs from "fs";

// Load environment variables from .env.local
const envFile = fs.readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  if (line.trim() && !line.startsWith("#")) {
    const [key, ...values] = line.split("=");
    if (key && values.length > 0) {
      process.env[key.trim()] = values.join("=").trim().replace(/(^"|"$)/g, "");
    }
  }
}

async function testOpenAI() {
  console.log("Testing Document Generation...");
  try {
    const response = await fetch("http://localhost:3000/api/v1/generate/document", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customPrompt: "Write a short 2-sentence creative brief for a commercial about a flying dog.",
        docType: "script"
      }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log("✅ Success! Generated Document:\n");
      console.log(data.data.document);
    } else {
      console.error("❌ Error response from server:", data);
    }
  } catch (error) {
    console.error("❌ Failed to fetch. Is your Next.js development server running on port 3000?", error.message);
  }
}

testOpenAI();
