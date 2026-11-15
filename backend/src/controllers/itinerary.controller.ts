import { z } from "zod";
import { Itinerary } from "../models/Itinerary";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import { AppError } from "../utils/AppError";
import { randomToken } from "../utils/tokens";
import { AiResult, generateItinerary, modifyItinerary, PlanInput, planInputSchema, regenerateDay, resolveDuration } from "../services/ai.service";
import { streamItineraryPdf } from "../services/pdf.service";

// 404 (not 403) for other people's itineraries so ids cannot be probed.
async function owned(id: string, userId: string) {
  const it = await Itinerary.findOne({ _id: id, user: userId });
  if (!it) throw new AppError(404, "Itinerary not found", "NOT_FOUND");
  return it;
}

const toInput = (it: InstanceType<typeof Itinerary>): PlanInput => ({
  startingLocation: it.startingLocation || "India", destination: it.destination, startDate: it.travelDates?.start ?? undefined, endDate: it.travelDates?.end ?? undefined,
  duration: it.duration, adults: it.travellers?.adults ?? 1, children: it.travellers?.children ?? 0, budget: it.budget ?? 0,
  travelStyle: (it.travelStyle || "Cultural") as PlanInput["travelStyle"], transportation: it.transportation || "Any", accommodation: it.accommodation || "Any",
  interests: it.interests ?? [], dietary: it.dietary ?? "", specialRequirements: it.specialRequirements ?? "",
});
const toResult = (it: InstanceType<typeof Itinerary>) => ({
  title: it.title, overview: it.overview ?? "", destinationSummary: it.destinationSummary ?? "", dailyPlans: it.toObject().dailyPlans,
  accommodationSuggestions: it.accommodationSuggestions ?? [], estimatedTotalBudget: it.estimatedTotalBudget ?? 0, tips: it.tips ?? [], safety: it.safety ?? [],
}) as AiResult;
const applyResult = (it: InstanceType<typeof Itinerary>, r: AiResult) => {
  it.title = r.title; it.overview = r.overview; it.destinationSummary = r.destinationSummary;
  it.set("dailyPlans", r.dailyPlans); it.set("accommodationSuggestions", r.accommodationSuggestions); it.estimatedTotalBudget = r.estimatedTotalBudget;
  it.set("tips", r.tips); it.set("safety", r.safety);
};

export const generate = asyncHandler(async (req, res) => {
  const input = req.body as PlanInput;
  const { result, duration } = await generateItinerary(req.user!.id, input);
  const it = await Itinerary.create({
    user: req.user!.id, destination: input.destination, startingLocation: input.startingLocation, duration,
    travelDates: { start: input.startDate, end: input.endDate }, travellers: { adults: input.adults, children: input.children },
    budget: input.budget, travelStyle: input.travelStyle, transportation: input.transportation, accommodation: input.accommodation,
    interests: input.interests, dietary: input.dietary, specialRequirements: input.specialRequirements,
    aiGenerated: true, aiModel: process.env.OPENROUTER_MODEL, ...result,
  });
  ok(res, it, 201);
});

export const regenerate = asyncHandler(async (req, res) => {
  const { itineraryId, day } = req.body as { itineraryId: string; day?: number };
  const it = await owned(itineraryId, req.user!.id);
  if (day) {
    if (day < 1 || day > it.duration) throw new AppError(400, "Day out of range", "BAD_DAY");
    const newDay = await regenerateDay(req.user!.id, toInput(it), toResult(it), day);
    const plans = it.toObject().dailyPlans.map((d) => (d.day === day ? newDay : d));
    it.set("dailyPlans", plans);
  } else {
    const { result } = await generateItinerary(req.user!.id, toInput(it), "regenerate");
    applyResult(it, result);
  }
  await it.save();
  ok(res, it);
});

export const modify = asyncHandler(async (req, res) => {
  const { itineraryId, instruction } = req.body as { itineraryId: string; instruction: string };
  const it = await owned(itineraryId, req.user!.id);
  applyResult(it, await modifyItinerary(req.user!.id, toInput(it), toResult(it), instruction));
  await it.save();
  ok(res, it);
});

export const list = asyncHandler(async (req, res) => {
  const upcoming = req.query.upcoming === "true";
  ok(res, await Itinerary.find({ user: req.user!.id, ...(upcoming ? { "travelDates.start": { $gte: new Date() } } : {}) }).sort({ createdAt: -1 }).limit(100));
});
export const getOne = asyncHandler(async (req, res) => ok(res, await owned(req.params.id, req.user!.id)));

/** Manual edits (rename, change notes, reorder/modify activities) without calling the AI. */
export const update = asyncHandler(async (req, res) => {
  const it = await owned(req.params.id, req.user!.id);
  Object.assign(it, req.body);
  await it.save();
  ok(res, it);
});
export const remove = asyncHandler(async (req, res) => {
  const it = await Itinerary.findOneAndDelete({ _id: req.params.id, user: req.user!.id });
  if (!it) throw new AppError(404, "Itinerary not found", "NOT_FOUND");
  ok(res, { message: "Deleted" });
});

export const share = asyncHandler(async (req, res) => {
  const enable = z.object({ enable: z.boolean() }).parse(req.body).enable;
  const it = await owned(req.params.id, req.user!.id);
  it.isShared = enable;
  if (enable && !it.shareToken) it.shareToken = randomToken().slice(0, 24);
  await it.save();
  ok(res, { isShared: it.isShared, shareToken: it.isShared ? it.shareToken : null });
});

export const getShared = asyncHandler(async (req, res) => {
  const it = await Itinerary.findOne({ shareToken: req.params.token, isShared: true }).select("-user -shareToken");
  if (!it) throw new AppError(404, "Itinerary not found", "NOT_FOUND");
  ok(res, it);
});

export const pdf = asyncHandler(async (req, res) => {
  const it = await owned(req.params.id, req.user!.id);
  streamItineraryPdf(it.toObject() as never, res, it.title);
});

export const itineraryUpdateSchema = z.object({
  title: z.string().trim().min(2).max(150).optional(),
  status: z.enum(["DRAFT", "SAVED", "COMPLETED"]).optional(),
  dailyPlans: z.array(z.object({}).passthrough()).max(30).optional(),
  tips: z.array(z.string().max(300)).max(30).optional(),
}).strict();
export { planInputSchema, resolveDuration };
