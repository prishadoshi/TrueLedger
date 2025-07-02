import { GoogleGenerativeAI } from "@google/generative-ai";

const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  .getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(req) {
  try {
    const { base64, mimeType } = await req.json();

    

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - Type (one of: income, expense)
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (if Type is expense: (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense) 
                            else if Type is income: (one of: salary, freelance, investments, business, rental, other-income ))
      
      Only respond with valid JSON in this exact format:
      {
        "type": "string,
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If its not a recipt, return an empty object
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64,
          mimeType: mimeType,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();

    const json = JSON.parse(cleaned);
    return Response.json({
      type: json.type,
      amount: parseFloat(json.amount),
      date: json.date,
      description: json.description,
      category: json.category,
      merchantName: json.merchantName,
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    return new Response("Failed to scan receipt", { status: 500 });
  }
}
