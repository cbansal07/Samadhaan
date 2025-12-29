

/**
 * Retries a fetch request with exponential backoff.
 */
async function fetchWithBackoff(url, options, retries = 5, delay = 1000) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        console.warn(`⚠️ Gemini rate limit hit. Retrying in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
        return fetchWithBackoff(url, options, retries - 1, delay * 2);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      console.warn(`⚠️ Network error: ${error.message}. Retrying in ${delay / 1000}s...`);
      await new Promise((res) => setTimeout(res, delay));
      return fetchWithBackoff(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * 🧠 Analyzes the grievance using Gemini AI
 */
export async function analyzeGrievanceWithAI(title, description) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const ALL_CATEGORIES = [
    'Roads & Infrastructure',
    'Water Supply',
    'Electricity',
    'Waste Management',
    'Public Safety',
    'Emergency Services',
    'Other',
  ];

  const AI_DEPARTMENT_MAPPING = {
    'Roads': 'Roads & Infrastructure',
    'Infrastructure': 'Roads & Infrastructure',
    'Roads & Infrastructure': 'Roads & Infrastructure',
    'Water': 'Water Supply',
    'Water Supply': 'Water Supply',
    'Electricity': 'Electricity',
    'Power': 'Electricity',
    'Waste': 'Waste Management',
    'Sanitation': 'Waste Management',
    'Garbage': 'Waste Management',
    'Waste Management': 'Waste Management',
    'Public Safety': 'Public Safety',
    'Safety': 'Public Safety',
    'Law and Order': 'Public Safety',
    'Emergency': 'Emergency Services',
    'Fire Department': 'Emergency Services',
    'Other': 'Other',
    'Unassigned': 'Other',
  };

  const validDepartments = ALL_CATEGORIES.join(', ');

  const systemPrompt = `
You are an AI assistant for a public grievance portal.
Analyze the grievance based on the title and description.

Decide and return:
1️⃣ **aiPriority** — one of: "Critical", "High", "Medium", or "Low".
2️⃣ **category** — the department that should handle it. MUST be one of the following exact strings: ${validDepartments}. If the issue doesn't clearly fit, use "Other".
3️⃣ **summary** — a short 1–2 sentence natural-language summary (20–30 words) describing the main issue and urgency clearly.

⚠️ Always return valid JSON only.
`;

  const userQuery = `
Grievance Title: "${title}"
Grievance Description: "${description}"

Return valid JSON ONLY like:
{
  "aiPriority": "Critical" | "High" | "Medium" | "Low",
  "category": "Roads & Infrastructure" | "Water Supply" | "Electricity" | "Waste Management" | "Public Safety" | "Emergency Services" | "Other",
  "summary": "Short AI-written summary"
}
`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\n${userQuery}` }],
      },
    ],
  };

  try {
    const data = await fetchWithBackoff(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    const cleanedText = rawText?.replace(/```json/i, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(cleanedText);
    console.log("✅ AI Response:", parsed);

    // CRUCIAL FIX: Map the AI's category to one of the valid departments
    const finalCategory = AI_DEPARTMENT_MAPPING[parsed.category] || parsed.category;
    
    // Final validation against the list
    const validatedCategory = ALL_CATEGORIES.includes(finalCategory) ? finalCategory : 'Other';

    return {
      aiPriority: parsed.aiPriority || "Low",
      category: validatedCategory,
      summary: parsed.summary || "No summary available yet.",
    };
  } catch (error) {
    console.error("❌ AI Analysis failed:", error);
    return { aiPriority: "Low", category: "Other", summary: "AI analysis failed." };
  }
}
