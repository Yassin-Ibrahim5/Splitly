import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('[extract] Starting extraction with OCR.space...');

    const body = await req.json();
    const imageUrl = body.imageUrl as string | null;

    if (!imageUrl) {
      console.error('[extract] No image URL provided');
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    console.log('[extract] Image URL length:', imageUrl.length);

    // Extract base64 data from data URL
    const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      console.error('[extract] Invalid image format');
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    const base64 = base64Match[2];
    console.log('[extract] Base64 data length:', base64.length);

    // Use OCR.space free API with free API key (helloworld - 25k requests/month)
    // Get your own free key at: https://ocr.space/ocrapi
    const apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';

    const formData = new FormData();
    formData.append('base64Image', `data:image/jpeg;base64,${base64}`);
    formData.append('apikey', apiKey);
    formData.append('isTable', 'true'); // Enable receipt/table mode
    formData.append('OCREngine', '2'); // Use engine 2 for better accuracy
    formData.append('scale', 'true'); // Auto-scale for better results
    formData.append('detectOrientation', 'true');

    console.log('[extract] Calling OCR.space API with key:', apiKey.substring(0, 5) + '...');

    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData,
    });

    if (!ocrResponse.ok) {
      throw new Error(`OCR API failed: ${ocrResponse.statusText}`);
    }

    const ocrData = await ocrResponse.json();
    console.log('[extract] OCR response received');

    if (ocrData.IsErroredOnProcessing) {
      throw new Error(`OCR processing error: ${ocrData.ErrorMessage}`);
    }

    const extractedText = ocrData.ParsedResults?.[0]?.ParsedText || '';
    console.log('[extract] Extracted text length:', extractedText.length);
    console.log('[extract] Extracted text:\n', extractedText);

    // Parse the extracted text to find items and prices
    const items = parseReceiptText(extractedText);
    console.log('[extract] Parsed items:', items.length);
    console.log('[extract] Items:', JSON.stringify(items, null, 2));

    const withIDs = items.map((item, index) => ({
      id: `item_${Date.now()}_${index}`,
      name: item.name,
      price: item.price,
    }));

    console.log('[extract] Returning', withIDs.length, 'items');
    return NextResponse.json({ items: withIDs });
  } catch (e) {
    console.error('[extract] ERROR:', e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to extract receipt items', details: errorMessage },
      { status: 500 }
    );
  }
}

// Parse OCR text to extract items and prices
function parseReceiptText(text: string): { name: string; price: number }[] {
  const items: { name: string; price: number }[] = [];
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);

  // Common receipt keywords to skip
  const skipKeywords = [
    'subtotal',
    'total',
    'tax',
    'tip',
    'gratuity',
    'service charge',
    'discount',
    'amount due',
    'balance',
    'payment',
    'change',
    'cash',
    'credit',
    'visa',
    'mastercard',
    'amex',
    'thank you',
    'receipt',
    'date',
    'time',
    'server',
    'table',
    'guest',
    'order',
    'invoice',
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();

    // Skip if line contains skip keywords
    if (skipKeywords.some((keyword) => line.includes(keyword))) {
      continue;
    }

    // Try to find price patterns: 123.45, 123,45, $123.45, EGP 123.45, etc.
    const priceMatch = lines[i].match(/(\d+[.,]\d{2}|\d+\.\d+|\d+)/g);

    if (priceMatch && priceMatch.length > 0) {
      // Get the last number as the price (usually the rightmost)
      const priceStr = priceMatch[priceMatch.length - 1];
      const price = parseFloat(priceStr.replace(',', '.'));

      if (price > 0 && price < 10000) {
        // Reasonable price range
        // Extract item name (everything before the price)
        const nameMatch = lines[i]
          .replace(/\d+[.,]\d{2}|\d+\.\d+|\d+/g, '')
          .replace(/[$€£¥₹EGP]/gi, '')
          .trim();

        if (nameMatch.length > 1) {
          // Must have at least 2 characters
          items.push({
            name: nameMatch,
            price: price,
          });
        }
      }
    }
  }

  return items;
}
