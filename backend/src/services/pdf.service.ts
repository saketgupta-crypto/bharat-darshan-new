import PDFDocument from "pdfkit";
import { Response } from "express";

interface Act { time?: string; title?: string; description?: string; estimatedCost?: number; estimatedTravelTime?: string }
interface Day { day: number; title?: string; morning?: Act[]; afternoon?: Act[]; evening?: Act[]; places?: string[]; food?: string[]; transport?: string; estimatedDailyCost?: number }
export interface PdfItinerary {
  title: string; destination: string; duration: number; overview?: string; destinationSummary?: string;
  dailyPlans: Day[]; accommodationSuggestions?: string[]; estimatedTotalBudget?: number; tips?: string[]; safety?: string[]; disclaimer?: string;
}

// Built-in PDF fonts lack the rupee glyph, so amounts are written as "INR 1,500".
const inr = (v?: number) => `INR ${Math.round(v ?? 0).toLocaleString("en-IN")}`;

export function streamItineraryPdf(it: PdfItinerary, res: Response, filename: string) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename.replace(/[^a-z0-9-_.]/gi, "_")}.pdf"`);
  doc.pipe(res);

  doc.fillColor("#c2410c").fontSize(11).text("BHARAT DARSHAN", { characterSpacing: 2 });
  doc.fillColor("#111").fontSize(22).text(it.title);
  doc.fontSize(11).fillColor("#555").text(`${it.destination} - ${it.duration} day${it.duration > 1 ? "s" : ""}`).moveDown();
  const section = (h: string) => doc.moveDown(0.5).fillColor("#7c2d12").fontSize(14).text(h).fillColor("#111").fontSize(10.5);
  if (it.overview) { section("Overview"); doc.text(it.overview); }
  if (it.destinationSummary) { section("About the destination"); doc.text(it.destinationSummary); }

  for (const d of it.dailyPlans) {
    section(`Day ${d.day}: ${d.title ?? ""}`);
    for (const [label, acts] of [["Morning", d.morning], ["Afternoon", d.afternoon], ["Evening", d.evening]] as const) {
      if (!acts?.length) continue;
      doc.font("Helvetica-Bold").text(label).font("Helvetica");
      for (const a of acts) doc.text(`- ${a.time ? a.time + ": " : ""}${a.title ?? ""}${a.description ? " - " + a.description : ""}${a.estimatedCost ? ` (est. ${inr(a.estimatedCost)})` : ""}${a.estimatedTravelTime ? ` [travel ~${a.estimatedTravelTime}]` : ""}`, { indent: 8 });
    }
    if (d.food?.length) doc.text(`Food: ${d.food.join(", ")}`);
    if (d.transport) doc.text(`Transport: ${d.transport}`);
    if (d.estimatedDailyCost) doc.font("Helvetica-Bold").text(`Estimated day cost: ${inr(d.estimatedDailyCost)}`).font("Helvetica");
  }
  if (it.accommodationSuggestions?.length) { section("Accommodation ideas"); it.accommodationSuggestions.forEach((a) => doc.text(`- ${a}`)); }
  if (it.estimatedTotalBudget) { section("Estimated total budget"); doc.text(inr(it.estimatedTotalBudget)); }
  if (it.tips?.length) { section("Travel tips"); it.tips.forEach((t) => doc.text(`- ${t}`)); }
  if (it.safety?.length) { section("Safety"); it.safety.forEach((t) => doc.text(`- ${t}`)); }
  doc.moveDown().fontSize(9).fillColor("#777").text(it.disclaimer ?? "Prices and travel times are AI-generated estimates. Verify before booking.");
  doc.end();
}
