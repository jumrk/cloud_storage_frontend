import "dotenv/config";
import mongoose from "mongoose";
import { google } from "googleapis";

// Kết nối MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/cloud_website";
await mongoose.connect(MONGODB_URI, { bufferCommands: false });

// Định nghĩa schema DriveAccount (giống src/model/DriveAccount.js)
const DriveAccountSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    tokenExpiry: { type: Date },
    usedStorage: { type: Number, default: 0 },
    totalStorage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const DriveAccount =
  mongoose.models.DriveAccount ||
  mongoose.model("DriveAccount", DriveAccountSchema);

// Hàm kiểm tra refresh token
async function checkRefreshToken(account) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: account.refreshToken });

  try {
    await oauth2Client.getAccessToken();
    return { email: account.email, ok: true };
  } catch (err) {
    if (
      err.response &&
      err.response.data &&
      err.response.data.error === "invalid_grant"
    ) {
      return { email: account.email, ok: false, reason: "invalid_grant" };
    }
    return { email: account.email, ok: false, reason: err.message };
  }
}

// Chạy kiểm tra tất cả tài khoản
const accounts = await DriveAccount.find({});
console.log(`Tìm thấy ${accounts.length} tài khoản DriveAccount\n`);

for (const acc of accounts) {
  const result = await checkRefreshToken(acc);
  if (result.ok) {
    console.log(`✅ ${result.email}: Refresh token còn hoạt động`);
  } else {
    console.log(`❌ ${result.email}: LỖI (${result.reason})`);
  }
}

await mongoose.disconnect();
