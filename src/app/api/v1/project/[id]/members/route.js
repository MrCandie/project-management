import Project from "@/app/api/models/project";
import getAuthUser from "@/app/api/utils/auth";
import {
  sendBadRequestResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "@/app/api/utils/responses";

export const GET = async (req, context) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return sendBadRequestResponse("unauthenticated", {}, 401);

    const { id: projectId } = await context.params;

    const project = await Project.findOne({
      members: user._id,
      _id: projectId,
    }).populate("members", "firstName lastName email");

    if (!project) {
      return sendBadRequestResponse("project not found", {}, 404);
    }

    return sendSuccessResponse("members retrived", project.members);
  } catch (error) {
    return sendServerErrorResponse();
  }
};
