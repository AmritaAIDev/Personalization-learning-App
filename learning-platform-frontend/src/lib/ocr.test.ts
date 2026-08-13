import { afterEach, describe, expect, it, vi } from "vitest";

const recognizeMock = vi.fn();

vi.mock("tesseract.js", () => ({
  recognize: (...args: unknown[]) => recognizeMock(...args),
}));

function makeImageFile(sizeBytes = 1024): File {
  return new File([new Uint8Array(sizeBytes)], "question.png", {
    type: "image/png",
  });
}

describe("recognizeQuestionImage", () => {
  afterEach(() => {
    recognizeMock.mockReset();
  });

  it("returns the extracted, trimmed text on success", async () => {
    recognizeMock.mockResolvedValue({
      data: { text: "  What is the value of g on the Moon?  \n\n\n" },
    });
    const { recognizeQuestionImage } = await import("./ocr");

    const text = await recognizeQuestionImage(makeImageFile());

    expect(text).toBe("What is the value of g on the Moon?");
    expect(recognizeMock).toHaveBeenCalledWith(expect.any(File), "eng");
  });

  it("rejects a non-image file before ever calling tesseract", async () => {
    const { recognizeQuestionImage, OcrError } = await import("./ocr");
    const textFile = new File(["not an image"], "question.txt", {
      type: "text/plain",
    });

    await expect(recognizeQuestionImage(textFile)).rejects.toBeInstanceOf(
      OcrError,
    );
    expect(recognizeMock).not.toHaveBeenCalled();
  });

  it("rejects an oversized image before ever calling tesseract", async () => {
    const { recognizeQuestionImage, OcrError } = await import("./ocr");

    await expect(
      recognizeQuestionImage(makeImageFile(9 * 1024 * 1024)),
    ).rejects.toBeInstanceOf(OcrError);
    expect(recognizeMock).not.toHaveBeenCalled();
  });

  it("surfaces a fallback OcrError when no usable text is found", async () => {
    recognizeMock.mockResolvedValue({ data: { text: "  " } });
    const { recognizeQuestionImage, OcrError } = await import("./ocr");

    await expect(
      recognizeQuestionImage(makeImageFile()),
    ).rejects.toBeInstanceOf(OcrError);
  });

  it("wraps a tesseract failure in a recoverable OcrError", async () => {
    recognizeMock.mockRejectedValue(new Error("worker crashed"));
    const { recognizeQuestionImage, OcrError } = await import("./ocr");

    await expect(
      recognizeQuestionImage(makeImageFile()),
    ).rejects.toBeInstanceOf(OcrError);
  });
});
