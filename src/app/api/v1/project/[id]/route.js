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
    if (!user) return sendBadRequestResponse("unauthenticated");

    const { id: projectId } = await context.params;

    if (!projectId) {
      return sendBadRequestResponse("project identifier is missing");
    }

    const project = await Project.findOne({
      _id: projectId,
      members: user._id,
      // owner: user._id,
    });

    if (!project) {
      return sendBadRequestResponse("project not found", {}, 404);
    }

    return sendSuccessResponse("Project retrived successfully", project);
  } catch (error) {
    return sendServerErrorResponse();
  }
};

export const POST = async (req, context) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return sendBadRequestResponse("unauthenticated");

    const { id: projectId } = await context.params;
    const { name, description } = await req.json();

    if (!projectId) {
      return sendBadRequestResponse("project identifier is missing");
    }

    if (name === undefined && description === undefined) {
      return sendBadRequestResponse("Nothing to update");
    }

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return sendBadRequestResponse("Project name is required");
    }

    if (description !== undefined && typeof description !== "string") {
      return sendBadRequestResponse("Invalid project description");
    }

    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();

    const project = await Project.findOneAndUpdate(
      { _id: projectId, owner: user._id },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!project) {
      return sendBadRequestResponse("project not found", {}, 404);
    }

    return sendSuccessResponse("Project updated successfully", project);
  } catch (error) {
    return sendServerErrorResponse();
  }
};

export const DELETE = async (req, context) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return sendBadRequestResponse("unauthenticated");

    const { id: projectId } = await context.params;

    if (!projectId) {
      return sendBadRequestResponse("project identifier is missing");
    }

    const project = await Project.findOneAndDelete({
      _id: projectId,
      owner: user._id,
    });

    if (!project) {
      return sendBadRequestResponse("project not found", {}, 404);
    }

    return sendSuccessResponse("Project deleted successfully", {}, 204);
  } catch (error) {
    return sendServerErrorResponse();
  }
};
