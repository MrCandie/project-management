import Token from "../models/token";
import User from "../models/user";
import connectDb from "./mongoose";
import { sendServerErrorResponse } from "./responses";

async function getAuthUser(req, type = "user") {
  try {
    await connectDb();
    console.log(req.headers);
    const userId = req.headers.get("user");
    const authToken = req.headers.get("token");
    const usertype = req.headers.get("usertype");

    if (!userId || !authToken || !usertype) return null;

    const tokenValid = await Token.findOne({
      token: authToken,
      userId: userId,
      usertype: usertype,
      status: "active",
      expiry: { $gt: new Date() },
    });

    if (!tokenValid) return null;

    let user = await User.findById(userId).select("+password");

    if (!user) return null;

    return user;
  } catch (error) {
    console.log(error);
    return sendServerErrorResponse("authentication issue");
  }
}

export default getAuthUser;
