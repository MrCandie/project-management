import getAuthUser from "@/app/api/utils/auth";
import {
  sendBadRequestResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "@/app/api/utils/responses";
import User from "@/app/api/models/user";
import Project from "@/app/api/models/project";

export const POST = async (req, context) => {
  try {
    const user = await getAuthUser(req);

    if (!user) {
      return sendBadRequestResponse("unauthenticated", {}, 401);
    }

    const { id: projectId } = await context.params;
    const { userId } = await req.json();

    if (!projectId) {
      return sendBadRequestResponse("project identifier is missing");
    }

    if (!userId) {
      return sendBadRequestResponse("user identifier is missing");
    }

    const project = await Project.findOne({
      _id: projectId,
      owner: user._id,
    });

    if (!project) {
      return sendBadRequestResponse("project not found", {}, 404);
    }

    if (project.owner.toString() === userId) {
      return sendBadRequestResponse("You cannot remove the project owner");
    }

    const memberExists = project.members.some(
      (memberId) => memberId.toString() === userId,
    );

    if (!memberExists) {
      return sendBadRequestResponse(
        "User is not a member of this project",
        {},
        404,
      );
    }

    await Promise.all([
      Project.updateOne({ _id: projectId }, { $pull: { members: userId } }),
      User.updateOne({ _id: userId }, { $pull: { projects: projectId } }),
    ]);

    return sendSuccessResponse("Member removed successfully", {
      userId,
      projectId,
    });
  } catch (error) {
    console.error(error);
    return sendServerErrorResponse();
  }
};
