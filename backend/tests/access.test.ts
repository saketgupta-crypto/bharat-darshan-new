import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app, auth, clearDb, loginAs, makeUser, registerVerified, startDb, stopDb } from "./helpers";
import { User } from "../src/models/User";

vi.mock("../src/services/email.service", () => ({
  sendEmail: vi.fn(async () => {}), sendOtpEmail: vi.fn(async () => {}), sendResetEmail: vi.fn(async () => {}), sendContactConfirmation: vi.fn(async () => {}),
}));
beforeAll(startDb); afterAll(stopDb); beforeEach(clearDb);
const api = "/api/v1";
const dest = { name: "Test Fort", description: "A really old fort for testing.", state: "Rajasthan", category: "Heritage", averageBudget: 9000 };

describe("authorization", () => {
  it("normal users and anonymous callers cannot reach admin APIs", async () => {
    await registerVerified("u@test.com");
    const { token } = await loginAs("u@test.com");
    for (const path of ["/admin/dashboard", "/admin/users", "/super-admin/admins", "/super-admin/settings"]) {
      await request(app).get(api + path).set(auth(token)).expect(403);
      await request(app).get(api + path).expect(401);
    }
    await request(app).post(`${api}/destinations`).set(auth(token)).send(dest).expect(403);
  });

  it("admin needs the specific permission; super admin can grant it", async () => {
    const admin = await makeUser("a@test.com", "ADMIN", []);
    const sa = await makeUser("sa@test.com", "SUPER_ADMIN");
    await request(app).post(`${api}/destinations`).set(auth(admin.token)).send(dest).expect(403);
    await request(app).get(`${api}/admin/users`).set(auth(admin.token)).expect(403);
    const adminId = (await User.findOne({ email: "a@test.com" }))!.id;
    await request(app).patch(`${api}/super-admin/users/${adminId}/access`).set(auth(sa.token)).send({ permissions: ["destinations:write"] }).expect(200);
    const relog = await loginAs("a@test.com"); // old session was revoked, so sign in again
    await request(app).post(`${api}/destinations`).set(auth(relog.token)).send(dest).expect(201);
    await request(app).get(`${api}/admin/users`).set(auth(relog.token)).expect(403); // still lacks users:manage
  });

  it("admins cannot touch other admins; nobody can create or change a SUPER_ADMIN via the API", async () => {
    const a1 = await makeUser("a1@test.com", "ADMIN", ["users:manage"]);
    await makeUser("a2@test.com", "ADMIN");
    const sa = await makeUser("sa@test.com", "SUPER_ADMIN");
    const a2 = await User.findOne({ email: "a2@test.com" });
    const saDoc = await User.findOne({ email: "sa@test.com" });
    await request(app).patch(`${api}/admin/users/${a2!.id}/status`).set(auth(a1.token)).send({ accountStatus: "DISABLED" }).expect(403);
    await request(app).patch(`${api}/super-admin/users/${saDoc!.id}/access`).set(auth(sa.token)).send({ role: "USER" }).expect(403);
    await request(app).patch(`${api}/super-admin/users/${a2!.id}/access`).set(auth(sa.token)).send({ role: "SUPER_ADMIN" }).expect(400);
    await request(app).patch(`${api}/super-admin/users/${a2!.id}/access`).set(auth(a1.token)).send({ role: "ADMIN" }).expect(403);
  });

  it("disabled users lose access immediately", async () => {
    await registerVerified("d@test.com");
    const { token } = await loginAs("d@test.com");
    const sa = await makeUser("sa@test.com", "SUPER_ADMIN");
    const id = (await User.findOne({ email: "d@test.com" }))!.id;
    await request(app).patch(`${api}/admin/users/${id}/status`).set(auth(sa.token)).send({ accountStatus: "DISABLED" }).expect(200);
    await request(app).get(`${api}/auth/me`).set(auth(token)).expect(401);
    await request(app).post(`${api}/auth/login`).send({ email: "d@test.com", password: "Passw0rd123" }).expect(403);
  });
});

describe("destinations, hotels, guides, reviews, contact", () => {
  it("public listing hides inactive items; supports search, filter and pagination", async () => {
    const sa = await makeUser("sa@test.com", "SUPER_ADMIN");
    for (const n of ["Alpha Fort", "Beta Beach", "Gamma Fort"]) {
      await request(app).post(`${api}/destinations`).set(auth(sa.token)).send({ ...dest, name: n, category: n.includes("Beach") ? "Beach" : "Heritage" }).expect(201);
    }
    const all = await request(app).get(`${api}/destinations?limit=2`).expect(200);
    expect(all.body.data).toHaveLength(2); expect(all.body.meta.total).toBe(3);
    expect((await request(app).get(`${api}/destinations?category=Beach`)).body.data).toHaveLength(1);
    expect((await request(app).get(`${api}/destinations?q=fort`)).body.data).toHaveLength(2);
    expect((await request(app).get(`${api}/destinations?q=${encodeURIComponent(".*")}`)).body.data).toHaveLength(0); // regex is escaped
    const id = all.body.data[0]._id;
    await request(app).patch(`${api}/destinations/${id}/status`).set(auth(sa.token)).send({ status: "INACTIVE" }).expect(200);
    expect((await request(app).get(`${api}/destinations`)).body.meta.total).toBe(2);
    await request(app).post(`${api}/destinations`).set(auth(sa.token)).send({ name: "x" }).expect(400);
  });

  it("one review per user per target; average rating is recomputed; only owner can edit", async () => {
    const sa = await makeUser("sa@test.com", "SUPER_ADMIN");
    const d = (await request(app).post(`${api}/destinations`).set(auth(sa.token)).send(dest).expect(201)).body.data;
    await registerVerified("r1@test.com"); await registerVerified("r2@test.com");
    const u1 = await loginAs("r1@test.com"); const u2 = await loginAs("r2@test.com");
    const body = { targetType: "Destination", target: d._id, rating: 5, comment: "Wonderful place" };
    const rv = (await request(app).post(`${api}/reviews`).set(auth(u1.token)).send(body).expect(201)).body.data;
    await request(app).post(`${api}/reviews`).set(auth(u1.token)).send(body).expect(409);
    await request(app).post(`${api}/reviews`).set(auth(u2.token)).send({ ...body, rating: 3 }).expect(201);
    expect((await request(app).get(`${api}/destinations/${d.slug}`)).body.data.avgRating).toBe(4);
    await request(app).patch(`${api}/reviews/${rv._id}`).set(auth(u2.token)).send({ comment: "hijack" }).expect(404);
    await request(app).delete(`${api}/reviews/${rv._id}`).set(auth(u2.token)).expect(404);
    await request(app).post(`${api}/reviews`).set(auth(u1.token)).send({ ...body, rating: 9 }).expect(400);
  });

  it("contact form validates, stores, and silently drops honeypot spam", async () => {
    await request(app).post(`${api}/contacts`).send({ name: "A", email: "bad", message: "hi" }).expect(400);
    await request(app).post(`${api}/contacts`).send({ name: "Ravi", email: "ravi@test.com", message: "I would like to know more." }).expect(201);
    await request(app).post(`${api}/contacts`).send({ name: "Bot", email: "bot@test.com", message: "buy cheap stuff now", website: "http://spam" }).expect(201);
    const sa = await makeUser("sa@test.com", "SUPER_ADMIN");
    expect((await request(app).get(`${api}/admin/contacts`).set(auth(sa.token))).body.meta.total).toBe(1);
  });

  it("hotel filters work", async () => {
    const sa = await makeUser("sa@test.com", "SUPER_ADMIN");
    for (const [n, p] of [["Cheap Inn", 2000], ["Grand Palace", 25000]] as const) await request(app).post(`${api}/hotels`).set(auth(sa.token)).send({ name: n, location: "Agra", pricePerNight: p, amenities: ["Pool", "Wifi"] }).expect(201);
    expect((await request(app).get(`${api}/hotels?maxPrice=10000`)).body.data).toHaveLength(1);
    expect((await request(app).get(`${api}/hotels?amenities=pool,wifi`)).body.data).toHaveLength(2);
    expect((await request(app).get(`${api}/hotels?amenities=spa`)).body.data).toHaveLength(0);
  });
});
