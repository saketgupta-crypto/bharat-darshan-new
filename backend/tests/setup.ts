// Must run before any app module is imported (env.ts validates process.env on import).
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://localhost:27017/placeholder";
process.env.JWT_ACCESS_SECRET = "test-access-secret-0123456789abcdef";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-0123456789abcdef";
process.env.FRONTEND_URL = "http://localhost:5173";
process.env.OPENROUTER_API_KEY = "test-key";
process.env.OPENROUTER_MODEL = "test/model";
