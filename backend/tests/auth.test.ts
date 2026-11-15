import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app, auth, clearDb, lastOtp, lastResetLink, loginAs, PASSWORD, registerVerified, startDb, stopDb } from "./helpers";

vi.mock("../src/services/email.service", () => ({
  sendEmail: vi.fn(async () => {}), sendOtpEmail: vi.fn(async () => {}), sendResetEmail: vi.fn(async () => {}), sendContactConfirmation: vi.fn(async () => {}),
}));

beforeAll(startDb); afterAll(stopDb); beforeEach(clearDb);
const api = "/api/v1";

describe("authentication", () => {
  it("registers, requires email verification, then logs in; never returns secrets", async () => {
    await request(app).post(`${api}/auth/register`).send({ name: "Asha", email: "asha@test.com", password: PASSWORD }).expect(201);
    await request(app).post(`${api}/auth/login`).send({ email: "asha@test.com", password: PASSWORD }).expect(403); // unverified
    await request(app).post(`${api}/auth/verify-email`).send({ email: "asha@test.com", otp: "000000" }).expect(400);
    await request(app).post(`${api}/auth/verify-email`).send({ email: "asha@test.com", otp: lastOtp() }).expect(200);
    const res = await request(app).post(`${api}/auth/login`).send({ email: "asha@test.com", password: PASSWORD }).expect(200);
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/passwordHash|emailOtp|resetToken/);
    expect(res.headers["set-cookie"][0]).toMatch(/HttpOnly/);
    const me = await request(app).get(`${api}/auth/me`).set(auth(res.body.data.accessToken)).expect(200);
    expect(me.body.data.user.passwordHash).toBeUndefined();
  });

  it("rejects wrong password, weak password, bad email and duplicate email", async () => {
    await registerVerified("dup@test.com");
    await request(app).post(`${api}/auth/login`).send({ email: "dup@test.com", password: "WrongPass1" }).expect(401);
    await request(app).post(`${api}/auth/register`).send({ name: "A", email: "x@test.com", password: "short" }).expect(400);
    await request(app).post(`${api}/auth/register`).send({ name: "Abc", email: "not-an-email", password: PASSWORD }).expect(400);
    await request(app).post(`${api}/auth/register`).send({ name: "Abc", email: "dup@test.com", password: PASSWORD }).expect(409);
  });

  it("cannot self-assign a role at registration", async () => {
    await request(app).post(`${api}/auth/register`).send({ name: "Eve", email: "eve@test.com", password: PASSWORD, role: "SUPER_ADMIN" }).expect(201);
    await request(app).post(`${api}/auth/verify-email`).send({ email: "eve@test.com", otp: lastOtp() }).expect(200);
    const { user } = await loginAs("eve@test.com");
    expect(user.role).toBe("USER");
  });

  it("rejects missing/invalid/tampered access tokens", async () => {
    await request(app).get(`${api}/auth/me`).expect(401);
    await request(app).get(`${api}/auth/me`).set(auth("garbage")).expect(401);
    await registerVerified("t@test.com");
    const { token } = await loginAs("t@test.com");
    await request(app).get(`${api}/auth/me`).set(auth(token.slice(0, -3) + "abc")).expect(401);
  });

  it("rotates refresh tokens and revokes the family when an old one is reused", async () => {
    await registerVerified("r@test.com");
    const { cookies } = await loginAs("r@test.com");
    const first = cookies[0].split(";")[0];
    const r1 = await request(app).post(`${api}/auth/refresh`).set("Cookie", first).expect(200);
    const second = (r1.headers["set-cookie"] as unknown as string[])[0].split(";")[0];
    expect(second).not.toBe(first);
    await request(app).post(`${api}/auth/refresh`).set("Cookie", first).expect(401); // reuse → theft detection
    await request(app).post(`${api}/auth/refresh`).set("Cookie", second).expect(401); // whole family revoked
  });

  it("logout revokes the session", async () => {
    await registerVerified("l@test.com");
    const { cookies } = await loginAs("l@test.com");
    const c = cookies[0].split(";")[0];
    await request(app).post(`${api}/auth/logout`).set("Cookie", c).expect(200);
    await request(app).post(`${api}/auth/refresh`).set("Cookie", c).expect(401);
  });

  it("forgot/reset password works once and signs out other sessions", async () => {
    await registerVerified("f@test.com");
    const { cookies } = await loginAs("f@test.com");
    await request(app).post(`${api}/auth/forgot-password`).send({ email: "f@test.com" }).expect(200);
    const url = new URL(lastResetLink());
    const token = url.searchParams.get("token")!;
    await request(app).post(`${api}/auth/reset-password`).send({ email: "f@test.com", token, password: "NewPassw0rd9" }).expect(200);
    await request(app).post(`${api}/auth/reset-password`).send({ email: "f@test.com", token, password: "AnotherPass9" }).expect(400); // single use
    await request(app).post(`${api}/auth/refresh`).set("Cookie", cookies[0].split(";")[0]).expect(401);
    await request(app).post(`${api}/auth/login`).send({ email: "f@test.com", password: "NewPassw0rd9" }).expect(200);
    await request(app).post(`${api}/auth/forgot-password`).send({ email: "nobody@test.com" }).expect(200); // no enumeration
  });

  it("guide registration stays pending until approved", async () => {
    await request(app).post(`${api}/auth/register`).send({ name: "Guide G", email: "g@test.com", password: PASSWORD, asGuide: true, guide: { location: "Agra", languages: ["Hindi"], experienceYears: 3, pricePerDay: 2000 } }).expect(201);
    await request(app).post(`${api}/auth/verify-email`).send({ email: "g@test.com", otp: lastOtp() }).expect(200);
    const res = await request(app).post(`${api}/auth/login`).send({ email: "g@test.com", password: PASSWORD }).expect(403);
    expect(res.body.error.code).toBe("PENDING_APPROVAL");
    await request(app).get(`${api}/guides`).expect(200).then((r) => expect(r.body.data).toHaveLength(0)); // not public yet
  });
});

describe("profile", () => {
  it("cannot change role/permissions through the profile API", async () => {
    await registerVerified("p@test.com");
    const { token } = await loginAs("p@test.com");
    await request(app).patch(`${api}/users/profile`).set(auth(token)).send({ role: "SUPER_ADMIN" }).expect(400);
    await request(app).patch(`${api}/users/profile`).set(auth(token)).send({ permissions: ["users:manage"] }).expect(400);
    const ok = await request(app).patch(`${api}/users/profile`).set(auth(token)).send({ name: "New Name" }).expect(200);
    expect(ok.body.data.user.name).toBe("New Name");
    expect(ok.body.data.user.role).toBe("USER");
  });
  it("change-password requires the current password", async () => {
    await registerVerified("cp@test.com");
    const { token } = await loginAs("cp@test.com");
    await request(app).patch(`${api}/users/change-password`).set(auth(token)).send({ currentPassword: "Wrong1234", newPassword: "Brand1New99" }).expect(400);
    await request(app).patch(`${api}/users/change-password`).set(auth(token)).send({ currentPassword: PASSWORD, newPassword: "Brand1New99" }).expect(200);
  });
});
