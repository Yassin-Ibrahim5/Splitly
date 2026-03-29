import {NextRequest, NextResponse} from "next/server";

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
    form.append("OCREngine", "2");
    form.append("isTable", "true");
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
// Step 2 — Parse OCR text with Gemini 2.0 Flash (free tier)
// Get your free key at: https://aistudio.google.com/app/apikey
// Free limits: 15 RPM, 1,500 req/day, 1M tokens/day
// ---------------------------------------------------------------------------
async function parseReceiptWithGemini(ocrText: string): Promise<{
    items: { name: string; price: number }[];
    tax: number;
    tip: number;
    total: number;
}> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

    // Build the prompt as a plain string to avoid template literal escaping issues
    const lines = [
        "You are an expert receipt parser. Below is raw OCR text extracted from a receipt image.",
        "Your job is to extract every purchased item AND every financial summary field.",
        "",
        "Return ONLY a raw JSON object. No markdown, no code fences, no explanation.",
        "",
        "Required JSON shape:",
        '{"items":[{"name":"string","price":0}],"tax":0,"tip":0,"total":0}',
        "",
        "CRITICAL — tax field:",
        "- Scan the ENTIRE text for any line containing: TAX, VAT, GST, HST, PST, SERVICE CHARGE, SURCHARGE",
        "- These lines look like: 'TAX: $1.92' or 'TAX 1.92' or 'VAT 2.50'",
        "- Extract the numeric amount and put it in the tax field",
        "- If multiple tax lines exist, sum them all",
        "- NEVER return 0 for tax if a tax line is visible in the text",
        "- Strip currency symbols ($, £, €, EGP) — return plain numbers only",
        "",
        "CRITICAL — tip field:",
        "- Look for lines containing: TIP, GRATUITY",
        "- A blank TIP line (e.g. 'TIP: ____') with no number means tip = 0",
        "- Only set tip > 0 if an actual number appears next to the tip label",
        "",
        "CRITICAL — total field:",
        "- Find the final TOTAL or AMOUNT DUE line",
        "- If two TOTAL lines exist (before and after tip), use the larger one",
        "- Strip currency symbols — return a plain number",
        "",
        "Rules for items array:",
        "- Include EVERY food, drink, or product line item",
        "- Translate non-English names to English",
        "- If quantity shown (e.g. '1 Tacos Del Mal Shrimp'), keep it in the name",
        "- Use the line-item total (unit price x qty), not unit price alone",
        "- Do NOT put subtotal, total, tax, tip, or discounts inside items",
        "- Omit any item where you cannot determine a price",
        "",
        "If the text is completely unreadable return: {\"items\":[],\"tax\":0,\"tip\":0,\"total\":0}",
        "",
        "OCR TEXT:",
        "---",
        ocrText,
        "---",
    ];

    const prompt = lines.join("\n");

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                contents: [{parts: [{text: prompt}]}],
                generationConfig: {
                    temperature: 0,
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
            return NextResponse.json({error: "No image provided"}, {status: 400});
        }

        const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) {
            return NextResponse.json(
                {error: "Invalid image format — expected a base64 data URL"},
                {status: 400}
            );
        }

        const [, mimeType, base64] = match;

        // Step 1: OCR
        let ocrText: string;
        try {
            ocrText = await extractTextFromImage(base64, mimeType);
        } catch (err) {
            console.error("[extract] OCR failed:", err);
            return NextResponse.json(
                {error: "Could not read the receipt image. Try a clearer photo.", details: String(err)},
                {status: 422}
            );
        }

        console.log("[extract] OCR text:\n", ocrText);

        // Step 2: Parse with Gemini
        let parsed: Awaited<ReturnType<typeof parseReceiptWithGemini>>;
        try {
            parsed = await parseReceiptWithGemini(ocrText);
        } catch (err) {
            console.error("[extract] Gemini parsing failed:", err);
            return NextResponse.json(
                {error: "Could not parse receipt items. Check your GEMINI_API_KEY.", details: String(err)},
                {status: 500}
            );
        }

        const items: ExtractedItem[] = (parsed.items ?? [])
            .filter((item) => item.name?.trim() && Number(item.price) > 0)
            .map((item, i) => ({
                id: `item_${Date.now()}_${i}`,
                name: item.name.trim(),
                price: Number(item.price),
            }));

        const response: ExtractResponse = {
            items,
            tax: Number(parsed.tax) || 0,
            tip: Number(parsed.tip) || 0,
            total: Number(parsed.total) || 0,
        };

        console.log("[extract] Result:", JSON.stringify(response, null, 2));
        return NextResponse.json(response);
    } catch (err) {
        console.error("[extract] Unexpected error:", err);
        return NextResponse.json(
            {error: "Failed to extract receipt items", details: err instanceof Error ? err.message : "Unknown error"},
            {status: 500}
        );
    }
}