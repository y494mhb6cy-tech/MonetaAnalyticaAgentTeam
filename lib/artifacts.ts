import { Document, Packer, Paragraph, TextRun } from "docx";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { StructuredOutput } from "./types";

export async function buildDocx(output: StructuredOutput) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Moneta Analytica", bold: true, size: 28 })]
          }),
          new Paragraph({ text: output.title, spacing: { after: 200 } }),
          new Paragraph({ text: today, spacing: { after: 400 } }),
          ...output.sections.flatMap((section) => [
            new Paragraph({ text: section.heading, spacing: { before: 200, after: 100 }, heading: "Heading2" }),
            new Paragraph({ text: section.narrative, spacing: { after: 100 } }),
            ...section.bullets.map((bullet) => new Paragraph({ text: `• ${bullet}` }))
          ]),
          new Paragraph({ text: "Risks", spacing: { before: 200, after: 100 }, heading: "Heading2" }),
          ...output.risks.map((risk) => new Paragraph({ text: `• ${risk}` })),
          new Paragraph({ text: "Next Actions", spacing: { before: 200, after: 100 }, heading: "Heading2" }),
          ...output.next_actions.map((action) => new Paragraph({ text: `• ${action}` })),
          new Paragraph({
            text: "Profit · Process · Objectivity",
            spacing: { before: 400 }
          })
        ]
      }
    ]
  });

  return Packer.toBuffer(doc);
}

export async function buildPdf(output: StructuredOutput) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();

  let y = height - 60;
  page.drawText("Moneta Analytica", {
    x: 50,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0.6, 0.85, 1)
  });
  y -= 30;
  page.drawText(output.title, { x: 50, y, size: 14, font: fontBold, color: rgb(1, 1, 1) });
  y -= 20;
  page.drawText(new Date().toLocaleDateString("en-US"), { x: 50, y, size: 10, font, color: rgb(0.8, 0.8, 0.8) });
  y -= 30;

  const drawParagraph = (text: string, bold = false) => {
    const lines = text.match(/.{1,90}/g) ?? [text];
    lines.forEach((line) => {
      page.drawText(line, { x: 50, y, size: 10, font: bold ? fontBold : font, color: rgb(1, 1, 1) });
      y -= 14;
    });
    y -= 6;
  };

  output.sections.forEach((section) => {
    drawParagraph(section.heading, true);
    drawParagraph(section.narrative);
    section.bullets.forEach((bullet) => drawParagraph(`• ${bullet}`));
  });

  drawParagraph("Risks", true);
  output.risks.forEach((risk) => drawParagraph(`• ${risk}`));

  drawParagraph("Next Actions", true);
  output.next_actions.forEach((action) => drawParagraph(`• ${action}`));

  drawParagraph("Profit · Process · Objectivity", true);

  return pdf.save();
}
