import connectDb from "@/app/api/utils/mongoose";
import {
  sendBadRequestResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "@/app/api/utils/responses";
import ShortUniqueId from "short-unique-id";
import xss from "xss";
import validator from "validator";
import {
  isValidNigerianPhone,
  normalizeNigerianPhone,
} from "@/app/api/utils/format-phone";
import User from "@/app/api/models/user";
import { hashPin } from "@/app/api/utils/hash-password";
import { createToken } from "@/app/api/utils/jwt";

const username = new ShortUniqueId({ length: 6 });

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
          "Access-Control-Max-Age": "86400",
          "Content-Security-Policy":
            "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none';",
          "X-XSS-Protection": "1; mode=block",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "Strict-Transport-Security":
            "max-age=31536000; includeSubDomains; preload",
        },
      });
    } else {
      return sendBadRequestResponse("Forbidden", {}, 403);
    }
  }
}

export const POST = async (req) => {
  try {
    const body = await req.json();

    await connectDb();

    const { email, phone, password, firstName, lastName } = body;
    if (!email || !password)
      return sendBadRequestResponse("Kindly fill out all fields!");

    if (password.length < 8)
      return sendBadRequestResponse(
        "Password cannot be less than 8 characters",
      );

    if (!validator.isEmail(email))
      return sendBadRequestResponse("Invalid email format");

    if (phone && !isValidNigerianPhone(phone))
      return sendBadRequestResponse("Invalid phone number format");

    const userExists = await User.findOne({ email });

    if (userExists)
      return sendBadRequestResponse(
        "User with this email address exists already",
      );

    const hashedPassword = await hashPin(String(password));
    const data = {
      email: xss(email.toLowerCase()),
      password: hashedPassword,
      username: username.rnd(),
      firstName: xss(firstName?.toLowerCase()),
      lastName: xss(lastName?.toLowerCase()),
      phone: xss(phone ? normalizeNigerianPhone(phone) : ""),
    };

    const [user] = await Promise.all([User.create(data)]);

    const token = await createToken(user.id, "user");

    user.password = undefined;

    return sendSuccessResponse("Signup successful", { token, user }, 201);
  } catch (error) {
    console.error(error);
    return sendServerErrorResponse(error);
  }
};
