import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ExtractedItem {
  id: string;
  name: string;
  price: number;
}

interface ExtractResponse {
  items: ExtractedItem[];
  tax: number;
  tip: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Step 1 — OCR via OCR.space (free, 25k req/month)
// Default key "helloworld" works. Get your own at https://ocr.space/ocrapi
// ---------------------------------------------------------------------------
async function extractTextFromImage(base64: string, mimeType: string): Promise<string> {
  const apiKey = process.env.OCR_SPACE_API_KEY || "helloworld";

  const form = new FormData();
  form.append("base64Image", `data:${mimeType};base64,${base64}`);
  form.append("apikey", apiKey);
  form.append("OCREngine", "2");       // Engine 2 is better for receipts
  form.append("isTable", "true");      // Preserve column layout
  form.append("scale", "true");
  form.append("detectOrientation", "true");

  const res = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error(`OCR.space error: ${res.statusText}`);

  const data = await res.json();

  if (data.IsErroredOnProcessing) {
    throw new Error(`OCR processing failed: ${JSON.stringify(data.ErrorMessage)}`);
  }

  const text: string = data.ParsedResults?.[0]?.ParsedText ?? "";
  if (!text.trim()) throw new Error("OCR returned no text — try a clearer photo.");

  return text;
}

// ---------------------------------------------------------------------------
// Step 2 — Parse OCR text intelligently with Gemini 1.5 Flash (free tier)
// Get your free API key at: https://aistudio.google.com/app/apikey
// Free limits: 15 RPM, 1,500 requests/day, 1M tokens/day
// ---------------------------------------------------------------------------
async function parseReceiptWithGemini(ocrText: string): Promise<{
  items: { name: string; price: number }[];
  tax: number;
  tip: number;
  total: number;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set in your environment variables.");

  const prompt = `You are a receipt parser. Below is raw OCR text extracted from a receipt image.
Parse it carefully and return structured data about every purchased item.

Return ONLY a raw JSON object — no markdown, no code fences, no explanation whatsoever.

Required JSON shape:
{
  "items": [{ "name": "string", "price": number }],
  "tax": number,
  "tip": number,
  "total": number
}

Rules for "items":
- Include EVERY food, drink, or product line item on the receipt
- If the text contains Arabic or another non-English language, translate item names to English
- If a quantity is shown (e.g. "2x Coffee" or "Pepsi ×3"), keep the quantity in the name
- Use the line-item total price (unit price × quantity), NOT the unit price alone
- Do NOT include subtotal, total, tax, VAT, tip, service charge, or discounts in "items"

Rules for other fields:
- "tax": sum of ALL tax/VAT/service charge lines as a single number (0 if none)
- "tip": tip or gratuity amount (0 if none)
- "total": the final grand total shown on the receipt (0 if not visible)
- All prices must be plain numbers without currency symbols

If you cannot determine a price for an item, omit that item entirely.
If the text is unreadable, return: {"items":[],"tax":0,"tip":0,"total":0}

OCR TEXT:
---
${ocrText}
---`;

  const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,         // fully deterministic — we want consistent parsing
            maxOutputTokens: 2048,
          },
        }),
      }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  // Strip accidental markdown fences if the model added them
  const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

  return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const imageUrl = body.imageUrl as string | null;

    if (!imageUrl) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Parse the base64 data URL: "data:<mimeType>;base64,<data>"
    const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json(
          { error: "Invalid image format — expected a base64 data URL" },
          { status: 400 }
      );
    }

    const [, mimeType, base64] = match;

    // ── Step 1: OCR ──────────────────────────────────────────────────────────
    let ocrText: string;
    try {
      ocrText = await extractTextFromImage(base64, mimeType);
    } catch (err) {
      console.error("[extract] OCR failed:", err);
      return NextResponse.json(
          {
            error: "Could not read the receipt image. Try a clearer or better-lit photo.",
            details: String(err),
          },
          { status: 422 }
      );
    }

    console.log("[extract] OCR text:\n", ocrText);

    // ── Step 2: Parse with Gemini ─────────────────────────────────────────────
    let parsed: Awaited<ReturnType<typeof parseReceiptWithGemini>>;
    try {
      parsed = await parseReceiptWithGemini(ocrText);
    } catch (err) {
      console.error("[extract] Gemini parsing failed:", err);
      return NextResponse.json(
          {
            error: "Could not parse receipt items. Check your GEMINI_API_KEY.",
            details: String(err),
          },
          { status: 500 }
      );
    }

    // Attach stable IDs and filter out any zero-price junk
    const items: ExtractedItem[] = (parsed.items ?? [])
        .filter((item) => item.name?.trim() && Number(item.price) > 0)
        .map((item, i) => ({
          id: `item_${Date.now()}_${i}`,
          name: item.name.trim(),
          price: Number(item.price),
        }));

    const response: ExtractResponse = {
      items,
      tax:   Number(parsed.tax)   || 0,
      tip:   Number(parsed.tip)   || 0,
      total: Number(parsed.total) || 0,
    };

    console.log("[extract] Parsed result:", JSON.stringify(response, null, 2));
    return NextResponse.json(response);
  } catch (err) {
    console.error("[extract] Unexpected error:", err);
    return NextResponse.json(
        {
          error: "Failed to extract receipt items",
          details: err instanceof Error ? err.message : "Unknown error",
        },
        { status: 500 }
    );
  }
}