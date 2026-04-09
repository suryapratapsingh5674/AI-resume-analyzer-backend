import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import puppeteer from "puppeteer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .min(0)
    .max(100)
    .describe("Overall fit score between candidate and job."),
  technicalQuestion: z
    .array(
      z.object({
        question: z.string().describe("Interview question to ask candidate."),
        intention: z.string().describe("Why this question is being asked."),
        answer: z
          .string()
          .describe("Good sample answer aligned to profile and role."),
      }),
    )
    .length(6)
    .describe(
      "technical question that can be asked in interview with intention of intervier for asking that perticular question",
    ),
  behavioralQuestion: z
    .array(
      z.object({
        question: z.string().describe("Interview question to ask candidate."),
        intention: z.string().describe("Why this question is being asked."),
        answer: z
          .string()
          .describe("Good sample answer aligned to profile and role."),
      }),
    )
    .length(4)
    .describe(
      "behavioral question that can be asked in interview with intention of intervier for asking that perticular question",
    ),
  skillGap: z
    .array(
      z.object({
        skill: z.string().describe("Missing or weak skill."),
        severity: z
          .enum(["low", "medium", "high"])
          .describe("How serious the gap is for the target role."),
      }),
    )
    .min(3)
    .max(6)
    .describe("list of skill gap in candidate profile and there severity."),
  preparetionPlan: z
    .array(
      z.object({
        day: z
          .number()
          .int()
          .min(1)
          .max(7)
          .describe("Day number in preparation plan."),
        focus: z.string().describe("Main focus area for the day."),
        tasks: z
          .array(z.string())
          .min(1)
          .describe("Actionable tasks for the day."),
      }),
    )
    .length(7)
    .describe("a day wise preparetion plan for candidate to follow"),
});

const responseSchema = (() => {
  const schema = z.toJSONSchema(interviewReportSchema);
  delete schema.$schema;
  return schema;
})();

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const prompt = `Generate interview preparation data using the provided candidate context.
Keep content specific to the role and candidate, practical, and realistic.

Constraints:
- technicalQuestion: 6 items
- behavioralQuestion: 4 items
- skillGap: 3 to 6 items
- preparetionPlan: 7 items with day values 1..7 in order
- Do not use null values in any field

Candidate context:
resume: ${resume || "Not provided"}
selfDescription: ${selfDescription || "Not provided"}
jobDescription: ${jobDescription || "Not provided"}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  const parsedJson = JSON.parse(response.text);
  const result = interviewReportSchema.parse(parsedJson);
  return result;
}

async function generatePdfFromHtml(htmlContent) {
  const launchOptions = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--no-zygote",
    ],
    timeout: 30000,
  };

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "16mm",
        bottom: "16mm",
        left: "12mm",
        right: "12mm",
      },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

const stripHtml = (html) =>
  html
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const wrapText = (text, maxCharsPerLine = 90) => {
  const words = text.split(" ");
  const lines = [];
  let line = "";

  for (const word of words) {
    if (!line) {
      line = word;
      continue;
    }

    if (`${line} ${word}`.length > maxCharsPerLine) {
      lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`;
    }
  }

  if (line) {
    lines.push(line);
  }

  return lines;
};

async function generateFallbackPdfFromHtml(htmlContent) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595.28, 841.89]);

  const fontSize = 11;
  const lineHeight = 15;
  const marginX = 50;
  const marginTop = 60;
  const marginBottom = 60;
  const text = stripHtml(htmlContent);
  const lines = wrapText(text, 95);

  let y = page.getHeight() - marginTop;

  page.drawText("AI Generated Resume", {
    x: marginX,
    y,
    size: 16,
    font,
    color: rgb(0.07, 0.07, 0.07),
  });

  y -= 28;

  for (const line of lines) {
    if (y < marginBottom) {
      break;
    }

    page.drawText(line, {
      x: marginX,
      y,
      size: fontSize,
      font,
      color: rgb(0.12, 0.12, 0.12),
    });

    y -= lineHeight;
  }

  return Buffer.from(await pdfDoc.save());
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const resumePdfSchema = z.object({
    html: z
      .string()
      .describe(
        "The HTML content of resume which can be conevrted to pdf using any library like puppeteer",
      ),
  });

  const responseSchema = (() => {
    const schema = z.toJSONSchema(resumePdfSchema);
    delete schema.$schema;
    return schema;
  })();

  const prompt = `Generate a resume for a candidate with the following details:
Resume: ${resume || "Not provided"}
selfDescription: ${selfDescription || "Not provided"}
jobDescription: ${jobDescription || "Not provided"}

The resume should be in HTML format and should be suitable for conversion to PDF.
the resume should highlight the candidate's strengths and be tailored to the job description.
the content of resume should not be sound like ai generated and should be practical and realistic.
content should be an ATS friendly and try to use keywords from job description in resume content.
and try to give style to resume content that can be fit within 1 page when converted to pdf.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  const parsedJson = JSON.parse(response.text);
  const result = resumePdfSchema.parse(parsedJson);

  try {
    const pdfBuffer = await generatePdfFromHtml(result.html);
    return pdfBuffer;
  } catch (error) {
    console.error("Puppeteer PDF generation failed, using fallback:", error);
    const fallbackBuffer = await generateFallbackPdfFromHtml(result.html);
    return fallbackBuffer;
  }
}

export { generateInterviewReport, generateResumePdf };
