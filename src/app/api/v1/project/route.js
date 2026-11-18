import xss from "xss";
import Project from "../../models/project";
import getAuthUser from "../../utils/auth";
import {
  sendBadRequestResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "../../utils/responses";

export const GET = async (req) => {
  try {
    const user = await getAuthUser(req);
    console.log("user", user);
    if (!user) return sendBadRequestResponse("unauthenticated", {}, 401);

    const projects = await Project.find({
      members: user._id,
    });

    return sendSuccessResponse("projects retrieved", projects);
  } catch (error) {
    return sendServerErrorResponse();
  }
};

export const POST = async (req) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return sendBadRequestResponse("unauthenticated", {}, 401);

    const { name, description } = await req.json();
    if (!name) return sendBadRequestResponse("name is required");

    await Project.create({
      name: xss(name),
      description: xss(description || ""),
      owner: user._id,
      members: [user._id],
    });

    return sendSuccessResponse("project created", {}, 201);
  } catch (error) {
    console.error(error);
    return sendServerErrorResponse();
  }
};
