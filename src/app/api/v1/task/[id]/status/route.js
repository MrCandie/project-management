import Project from "@/app/api/models/project";
import Task from "@/app/api/models/task";
import TaskHistory from "@/app/api/models/task-history";
import getAuthUser from "@/app/api/utils/auth";
import {
  sendBadRequestResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "@/app/api/utils/responses";

export const POST = async (req, context) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return sendBadRequestResponse("unauthenticated");

    const { id: taskId } = await context.params;
    const { status, projectId } = await req.json();

    if (!projectId) {
      return sendBadRequestResponse("project identifier is missing");
    }

    const project = await Project.findOne({
      $or: [{ members: user._id }, { owner: user._id }],
      _id: projectId,
    });

    if (!project) {
      return sendBadRequestResponse("project not found", {}, 404);
    }

    if (!["pending", "ongoing", "completed", "overdue"].includes(status))
      return sendBadRequestResponse("invalid status");

    const task = await Task.findOne({
      $or: [{ members: user._id }, { owner: user._id }],
      project: projectId,
      _id: taskId,
    });

    if (!task) {
      return sendBadRequestResponse("task not found", {}, 404);
    }

    const prevStatus = task.status;

    task.status = status;
    await task.save();

    await TaskHistory.create({
      actor: user._id,
      task: task._id,
      project: projectId,
      action: `${user.email} updated task from ${prevStatus} to ${status}`,
    });

    return sendSuccessResponse("Members added successfully");
  } catch (error) {
    console.error(error);
    return sendServerErrorResponse();
  }
};
