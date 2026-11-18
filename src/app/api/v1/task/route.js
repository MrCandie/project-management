import Project from "../../models/project";
import Task from "../../models/task";
import TaskHistory from "../../models/task-history";
import getAuthUser from "../../utils/auth";
import {
  sendBadRequestResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "../../utils/responses";

export const GET = async (req) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return sendBadRequestResponse("unauthenticated");

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return sendBadRequestResponse("project identifier is missing");
    }

    const tasks = await Task.find({
      project: projectId,
      $or: [{ members: user._id }, { owner: user._id }],
    })
      .populate("members", "firstName lastName email")
      .sort({ createdAt: -1 });

    return sendSuccessResponse("tasks retrieved", tasks);
  } catch (error) {
    return sendServerErrorResponse();
  }
};

export const POST = async (req) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return sendBadRequestResponse("unauthenticated");

    const {
      title,
      description,
      startDate,
      endDate,
      priority,
      status,
      projectId,
    } = await req.json();

    if (!title) return sendBadRequestResponse("title is required");
    if (!projectId) return sendBadRequestResponse("project not found", {}, 404);

    const project = await Project.findOne({
      owner: user._id,
      _id: projectId,
    });

    if (!project) {
      return sendBadRequestResponse("project not found", {}, 404);
    }

    const task = await Task.create({
      name: title,
      description,
      startDate,
      endDate,
      priority,
      status,
      owner: user._id,
      project: project._id,
    });

    await TaskHistory.create({
      actor: user._id,
      task: task._id,
      action: `${user.email} created task`,
      project: projectId,
    });

    return sendSuccessResponse("task created");
  } catch (error) {
    console.error(error);
    return sendServerErrorResponse();
  }
};
