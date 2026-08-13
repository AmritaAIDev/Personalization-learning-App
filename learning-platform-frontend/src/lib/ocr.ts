/**
 * Client-side OCR for "photo-to-question" (AI Phase 2.6): a learner photographs
 * or uploads a question and the extracted text is dropped into the existing
 * doubts composer, which already solves/explains through the tutor pipeline —
 * no new backend model call or vision API needed. tesseract.js is loaded
 * dynamically so its WASM/language-data payload never lands in the main
 * bundle for learners who never use this feature.
 *
 * Failure here is always recoverable: the caller falls back to asking the
 * learner to type the question, per the roadmap's explicit fallback rule.
 */
export class OcrError extends Error {}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function recognizeQuestionImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new OcrError("Please choose an image file.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new OcrError("That image is too large (8MB max).");
  }

  let Tesseract: typeof import("tesseract.js");
  try {
    Tesseract = await import("tesseract.js");
  } catch {
    throw new OcrError("Text recognition could not load. Please type the question instead.");
  }

  try {
    const {
      data: { text },
    } = await Tesseract.recognize(file, "eng");
    const cleaned = text.trim().replace(/\n{3,}/g, "\n\n");
    if (cleaned.length < 4) {
      throw new OcrError(
        "Could not read any text from that image. Try a clearer photo, or type the question.",
      );
    }
    return cleaned;
  } catch (error) {
    if (error instanceof OcrError) throw error;
    throw new OcrError(
      "Could not read that image. Try a clearer photo, or type the question.",
    );
  }
}
