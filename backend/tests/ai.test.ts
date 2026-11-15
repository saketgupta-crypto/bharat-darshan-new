import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app, auth, clearDb, loginAs, registerVerified, startDb, stopDb } from "./helpers";

vi.mock("../src/services/email.service", () => ({
  sendEmail: vi.fn(async () => {}), sendOtpEmail: vi.fn(async () => {}), sendResetEmail: vi.fn(async () => {}), sendContactConfirmation: vi.fn(async () => {}),
}));
beforeAll(startDb); afterAll(stopDb); beforeEach(clearDb); afterEach(() => vi.unstubAllGlobals());
const api = "/api/v1";
const input = { startingLocation: "Lucknow", destination: "Agra", duration: 2, adults: 2, children: 0, budget: 30000, travelStyle: "Historical" };
const plan = (days: number) => ({
  title: "Agra Heritage Trip", overview: "o", destinationSummary: "s", estimatedTotalBudget: 20000, tips: ["t"], safety: ["s"], accommodationSuggestions: ["a"],
  dailyPlans: Array.from({ length: days }, (_, i) => ({ day: i + 1, title: `Day ${i + 1}`, morning: [{ time: "9am", title: "Taj Mahal", description: "d", estimatedCost: 1100, estimatedTravelTime: "20 min" }], afternoon: [], evening: [], places: ["Taj"], food: ["Petha"], transport: "Auto", estimatedDailyCost: 5000 })),
});
const okFetch = (content: string) => vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content } }] }), text: async () => "" }));

async function user(email: string) { await registerVerified(email); return loginAs(email); }

describe("AI planner", () => {
  it("requires login and validates input", async () => {
    await request(app).post(`${api}/ai/generate-itinerary`).send(input).expect(401);
    const { token } = await user("ai@test.com");
    await request(app).post(`${api}/ai/generate-itinerary`).set(auth(token)).send({ ...input, travelStyle: "Chaos" }).expect(400);
    await request(app).post(`${api}/ai/generate-itinerary`).set(auth(token)).send({ ...input, duration: undefined }).expect(400);
    await request(app).post(`${api}/ai/generate-itinerary`).set(auth(token)).send({ ...input, adults: 0 }).expect(400);
  });

  it("generates, validates and saves an itinerary (JSON wrapped in markdown is accepted)", async () => {
    const f = okFetch("```json\n" + JSON.stringify(plan(2)) + "\n```"); vi.stubGlobal("fetch", f);
    const { token } = await user("ai@test.com");
    const res = await request(app).post(`${api}/ai/generate-itinerary`).set(auth(token)).send(input).expect(201);
    expect(res.body.data.dailyPlans).toHaveLength(2);
    expect(res.body.data.disclaimer).toMatch(/estimates/i);
    const sent = JSON.parse((f.mock.calls[0] as unknown as [string, { body: string }])[1].body);
    expect(sent.model).toBe("test/model");
    expect(JSON.stringify((f.mock.calls[0] as unknown as [string, { headers: object }])[1].headers)).toContain("Bearer test-key"); // key only server-side
    expect((await request(app).get(`${api}/itineraries`).set(auth(token))).body.data).toHaveLength(1);
  });

  it("malformed AI output and upstream failures return clean errors and do not crash the server", async () => {
    const { token } = await user("ai@test.com");
    vi.stubGlobal("fetch", okFetch("this is not json at all"));
    await request(app).post(`${api}/ai/generate-itinerary`).set(auth(token)).send(input).expect(502);
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, text: async () => "boom", json: async () => ({}) })));
    await request(app).post(`${api}/ai/generate-itinerary`).set(auth(token)).send(input).expect(502);
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    await request(app).post(`${api}/ai/generate-itinerary`).set(auth(token)).send(input).expect(502);
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 429, text: async () => "", json: async () => ({}) })));
    await request(app).post(`${api}/ai/generate-itinerary`).set(auth(token)).send(input).expect(429);
    await request(app).get(`${api}/health`).expect(200); // still alive
  });

  it("a user cannot read, change, share, download, regenerate or delete another user's itinerary", async () => {
    vi.stubGlobal("fetch", okFetch(JSON.stringify(plan(2))));
    const a = await user("a@test.com"); const b = await user("b@test.com");
    const id = (await request(app).post(`${api}/ai/generate-itinerary`).set(auth(a.token)).send(input).expect(201)).body.data._id;
    await request(app).get(`${api}/itineraries/${id}`).set(auth(a.token)).expect(200);
    await request(app).get(`${api}/itineraries/${id}`).set(auth(b.token)).expect(404);
    await request(app).get(`${api}/itineraries/${id}/pdf`).set(auth(b.token)).expect(404);
    await request(app).patch(`${api}/itineraries/${id}`).set(auth(b.token)).send({ title: "pwned" }).expect(404);
    await request(app).post(`${api}/itineraries/${id}/share`).set(auth(b.token)).send({ enable: true }).expect(404);
    await request(app).post(`${api}/ai/regenerate-itinerary`).set(auth(b.token)).send({ itineraryId: id }).expect(404);
    await request(app).post(`${api}/ai/modify-itinerary`).set(auth(b.token)).send({ itineraryId: id, instruction: "make it shorter" }).expect(404);
    await request(app).delete(`${api}/itineraries/${id}`).set(auth(b.token)).expect(404);
    expect((await request(app).get(`${api}/itineraries`).set(auth(b.token))).body.data).toHaveLength(0);
    await request(app).delete(`${api}/itineraries/${id}`).set(auth(a.token)).expect(200);
  });

  it("owner can share via link (public read, no owner data), download PDF, regenerate a day and modify", async () => {
    const { token } = await user("own@test.com");
    vi.stubGlobal("fetch", okFetch(JSON.stringify(plan(2))));
    const id = (await request(app).post(`${api}/ai/generate-itinerary`).set(auth(token)).send(input).expect(201)).body.data._id;
    const sh = await request(app).post(`${api}/itineraries/${id}/share`).set(auth(token)).send({ enable: true }).expect(200);
    const pub = await request(app).get(`${api}/itineraries/shared/${sh.body.data.shareToken}`).expect(200);
    expect(pub.body.data.user).toBeUndefined();
    await request(app).post(`${api}/itineraries/${id}/share`).set(auth(token)).send({ enable: false }).expect(200);
    await request(app).get(`${api}/itineraries/shared/${sh.body.data.shareToken}`).expect(404);
    const pdf = await request(app).get(`${api}/itineraries/${id}/pdf`).set(auth(token)).buffer().expect(200);
    expect(pdf.headers["content-type"]).toMatch(/pdf/);
    vi.stubGlobal("fetch", okFetch(JSON.stringify({ title: "x", dailyPlans: [{ ...plan(1).dailyPlans[0], title: "Replaced day" }] })));
    const rg = await request(app).post(`${api}/ai/regenerate-itinerary`).set(auth(token)).send({ itineraryId: id, day: 2 }).expect(200);
    expect(rg.body.data.dailyPlans[1].title).toBe("Replaced day"); expect(rg.body.data.dailyPlans[1].day).toBe(2); expect(rg.body.data.dailyPlans[0].title).toBe("Day 1");
    await request(app).post(`${api}/ai/regenerate-itinerary`).set(auth(token)).send({ itineraryId: id, day: 9 }).expect(400);
    vi.stubGlobal("fetch", okFetch(JSON.stringify({ ...plan(2), title: "Modified Trip" })));
    expect((await request(app).post(`${api}/ai/modify-itinerary`).set(auth(token)).send({ itineraryId: id, instruction: "more food stops" }).expect(200)).body.data.title).toBe("Modified Trip");
  });
});
