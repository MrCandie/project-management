import Task from "@/app/api/models/task";
import Project from "@/app/api/models/project";
import getAuthUser from "@/app/api/utils/auth";
import {
  sendBadRequestResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "@/app/api/utils/responses";
import TaskHistory from "@/app/api/models/task-history";

export const POST = async (req, context) => {
  try {
    const user = await getAuthUser(req);

    if (!user) {
      return sendBadRequestResponse("unauthenticated");
    }

    const { id: taskId } = await context.params;
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!taskId || !projectId) {
      return sendBadRequestResponse("Task or project identifier is missing");
    }

    const project = await Project.findOne({
      _id: projectId,
      owner: user._id,
    });

    if (!project) {
      return sendBadRequestResponse("Project not found", {}, 404);
    }

    const task = await Task.findOneAndDelete({
      _id: taskId,
      project: projectId,
      owner: user._id,
    });

    if (!task) {
      return sendBadRequestResponse("Task not found", {}, 404);
    }

    await TaskHistory.create({
      actor: user._id,
      task: task._id,
      action: `${user.email} deleted task`,
      project: projectId,
    });

    return sendSuccessResponse("Task deleted successfully", task);
  } catch (error) {
    return sendServerErrorResponse();
  }
};
