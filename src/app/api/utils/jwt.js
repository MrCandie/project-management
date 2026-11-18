import * as jose from "jose";
import Token from "../models/token";

export async function createToken(id, usertype, expiry = 30, type) {
  const token = await new jose.SignJWT({ id, usertype })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));

  const expiryTime = new Date();
  expiryTime.setDate(expiryTime.getDate() + expiry);

  if (type && type === "admin") {
    expiryTime.setTime(expiryTime.getTime() + 30 * 60 * 1000);
  }

  // await Token.deleteMany({ userId: id });

  await Token.create({
    token,
    expiry: expiryTime,
    user: id,
    userId: id,
    usertype,
  });

  return token;
}
