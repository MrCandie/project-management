import Task from "@/app/api/models/task";
import TaskHistory from "@/app/api/models/task-history";
import getAuthUser from "@/app/api/utils/auth";
import {
  sendBadRequestResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "@/app/api/utils/responses";

export const GET = async (req, context) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return sendBadRequestResponse("unauthenticated");

    const { id: taskId } = await context.params;

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return sendBadRequestResponse("project identifier is missing");
    }

    const task = await Task.findOne({
      $or: [{ members: user._id }, { owner: user._id }],
      project: projectId,
      _id: taskId,
    });

    if (!task) {
      return sendBadRequestResponse("task not found", {}, 404);
    }

    const history = await TaskHistory.find({ task: task._id });

    return sendSuccessResponse("history retrieved", history);
  } catch (error) {
    console.error(error);
    return sendServerErrorResponse();
  }
};
