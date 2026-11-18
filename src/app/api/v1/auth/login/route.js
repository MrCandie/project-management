import User from "@/app/api/models/user";
import { createToken } from "@/app/api/utils/jwt";
import connectDb from "@/app/api/utils/mongoose";
import {
  sendBadRequestResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "@/app/api/utils/responses";
import { verifyPassword } from "@/app/api/utils/verify-password";
import validator from "validator";

export async function OPTIONS(req) {
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("Origin");

    if (["http://localhost:3000"].includes(origin)) {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400", // optional, cache preflight for 1 day

          // Additional security headers
          "Content-Security-Policy":
            "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none';",
          "X-XSS-Protection": "1; mode=block", // Block reflected XSS attacks
          "X-Content-Type-Options": "nosniff", // Prevent browsers from interpreting files as a different MIME type
          "X-Frame-Options": "DENY", // Prevent clickjacking by disallowing iframes
          "Referrer-Policy": "strict-origin-when-cross-origin", // Restrict referrer information sent with requests
          "Strict-Transport-Security":
            "max-age=31536000; includeSubDomains; preload", // HSTS - enforce HTTPS
        },
      });
    } else {
      return sendBadRequestResponse("Forbidden", {}, 403);
    }
  }
}

export const POST = async (req) => {
  try {
    await connectDb();
    const { email, password } = await req.json();

    if (!email || !password)
      return sendBadRequestResponse("Email and Password are required!");

    const user = await User.findOne({ email }).select("+password");

    if (!user) return sendBadRequestResponse(`Invalid email provided`);

    const passwordValid = await verifyPassword(String(password), user.password);

    if (!passwordValid)
      return sendBadRequestResponse("Login details incorrect");

    const token = await createToken(user.id, "user");

    user.updatedAt = new Date();
    user.lastLogin = new Date(Date.now());

    await user.save();

    user.password = undefined;

    return sendSuccessResponse("Login successful", {
      token,
      user,
    });
  } catch (error) {
    console.log(error);
    return sendServerErrorResponse();
  }
};
