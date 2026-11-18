import Project from "@/app/api/models/project";
import Task from "@/app/api/models/task";
import TaskHistory from "@/app/api/models/task-history";
import User from "@/app/api/models/user";
import getAuthUser from "@/app/api/utils/auth";
import {
  sendBadRequestResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "@/app/api/utils/responses";
import { sendEmail } from "@/app/api/utils/send-email";

export const POST = async (req, context) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return sendBadRequestResponse("unauthenticated");

    const { id: taskId } = await context.params;
    const { members, projectId } = await req.json();

    if (!projectId) {
      return sendBadRequestResponse("project identifier is missing");
    }

    if (!Array.isArray(members) || !members.length) {
      return sendBadRequestResponse("Members must be a non-empty array");
    }

    const project = await Project.findOne({
      owner: user._id,
      _id: projectId,
    });

    if (!project) {
      return sendBadRequestResponse("project not found", {}, 404);
    }

    const task = await Task.findOne({
      owner: user._id,
      project: projectId,
      _id: taskId,
    });

    if (!task) {
      return sendBadRequestResponse("task not found", {}, 404);
    }

    const projectMembers = new Set(
      project.members.map((member) => member.toString()),
    );

    const invalidMembers = members.filter(
      (member) => !projectMembers.has(member.toString()),
    );

    if (invalidMembers.length) {
      return sendBadRequestResponse(
        "Some members do not belong to this project",
        { invalidMembers },
      );
    }

    const existingMembers = new Set(
      task.members.map((member) => member.toString()),
    );

    const newMembers = [
      ...new Set(members.map((member) => member.toString())),
    ].filter((member) => !existingMembers.has(member));

    if (!newMembers.length) {
      return sendBadRequestResponse("All members are already assigned");
    }

    await Task.updateOne(
      { _id: taskId },
      { $addToSet: { members: { $each: newMembers } } },
    );

    const addedUsers = await User.find({
      _id: { $in: newMembers },
    }).select("firstName lastName email");

    await Promise.all(
      addedUsers.map((member) => {
        sendEmail({
          to: member.email,
          subject: `You've been assigned a task in ${project.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px;">
              <h2>You've been assigned a new task!</h2>
              <p>Hello ${member.firstName || "there"},</p>
              <p>You have been added to a task in <strong>${project.name}</strong>.</p>
              <p>Log in to your account to view the task and collaborate with your team.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects/${projectId}/tasks/${taskId}" style="display: inline-block; padding: 12px 24px; background: #FF4500; color: white; text-decoration: none; border-radius: 6px;">
                View Task
              </a>
            </div>
          `,
        });
      }),
    );

    const updatedTask = await Task.findById(taskId).populate(
      "members",
      "firstName lastName email",
    );

    await TaskHistory.create({
      actor: user._id,
      task: task._id,
      project: projectId,
      action: `${user.email} added ${members.join(", ")} to task`,
    });

    return sendSuccessResponse("Members added successfully", updatedTask);
  } catch (error) {
    return sendServerErrorResponse();
  }
};

export const PATCH = async (req, context) => {
  try {
    const user = await getAuthUser(req);

    if (!user) {
      return sendBadRequestResponse("unauthenticated", {}, 401);
    }

    const { id: taskId } = await context.params;

    if (!taskId) {
      return sendBadRequestResponse("task identifier is missing");
    }

    const { title, description, startDate, endDate, priority, status } =
      await req.json();

    const task = await Task.findById(taskId);

    if (!task) {
      return sendBadRequestResponse("task not found", {}, 404);
    }

    const project = await Project.findOne({
      _id: task.project,
      owner: user._id,
    });

    if (!project) {
      return sendBadRequestResponse("project not found", {}, 404);
    }

    const updates = {};

    if (title !== undefined) updates.name = title;
    if (description !== undefined) updates.description = description;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) updates.status = status;

    if (title !== undefined && !title.trim()) {
      return sendBadRequestResponse("title cannot be empty");
    }

    if (!Object.keys(updates).length) {
      return sendBadRequestResponse("No fields provided for update");
    }

    Object.assign(task, updates);
    await task.save();

    await TaskHistory.create({
      actor: user._id,
      task: task._id,
      action: `${user.email} updated task`,
      project: task.project,
    });

    return sendSuccessResponse("Task updated successfully", task);
  } catch (error) {
    console.error(error);
    return sendServerErrorResponse();
  }
};
