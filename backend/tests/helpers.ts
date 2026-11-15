import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import bcrypt from "bcryptjs";
import { vi, type Mock } from "vitest";
import { createApp } from "../src/app";
import { User } from "../src/models/User";
import * as email from "../src/services/email.service";

let mongod: MongoMemoryServer;
export const app = createApp();

export async function startDb() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await mongoose.syncIndexes();
}
export async function stopDb() { await mongoose.disconnect(); await mongod.stop(); }
export async function clearDb() { for (const c of Object.values(mongoose.connection.collections)) await c.deleteMany({}); vi.clearAllMocks(); }

export const lastOtp = () => (email.sendOtpEmail as unknown as Mock).mock.calls.at(-1)![2] as string;
export const lastResetLink = () => (email.sendResetEmail as unknown as Mock).mock.calls.at(-1)![2] as string;

export const PASSWORD = "Passw0rd123";
export async function registerVerified(emailAddr: string, name = "Test User") {
  await request(app).post("/api/v1/auth/register").send({ name, email: emailAddr, password: PASSWORD }).expect(201);
  await request(app).post("/api/v1/auth/verify-email").send({ email: emailAddr, otp: lastOtp() }).expect(200);
}
export async function loginAs(emailAddr: string) {
  const res = await request(app).post("/api/v1/auth/login").send({ email: emailAddr, password: PASSWORD }).expect(200);
  return { token: res.body.data.accessToken as string, cookies: res.headers["set-cookie"] as unknown as string[], user: res.body.data.user };
}
export async function makeUser(emailAddr: string, role: "ADMIN" | "SUPER_ADMIN", permissions: string[] = []) {
  await User.create({ name: role, email: emailAddr, passwordHash: await bcrypt.hash(PASSWORD, 4), role, permissions, isEmailVerified: true });
  return loginAs(emailAddr);
}
export const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
