import Task from "@/app/api/models/task";
import getAuthUser from "@/app/api/utils/auth";
import {
  sendBadRequestResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "@/app/api/utils/responses";

export const GET = async (req, context) => {
  try {
    const user = await getAuthUser(req, context);
    if (!user) return sendBadRequestResponse("unauthenticated");

    const { id: userId } = await context.params;

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return sendBadRequestResponse("project identifier is missing");
    }

    const tasks = await Task.find({
      project: projectId,
      members: userId,
      // owner: user._id,
    })
      .populate("members", "firstName lastName email")
      .sort({ createdAt: -1 });

    console.log(tasks);

    return sendSuccessResponse("tasks retrieved", tasks);
  } catch (error) {
    console.error(error);
    return sendServerErrorResponse();
  }
};
