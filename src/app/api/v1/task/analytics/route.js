import Task from "@/app/api/models/task";
import getAuthUser from "@/app/api/utils/auth";
import {
  sendBadRequestResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "@/app/api/utils/responses";

export const GET = async (req) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return sendBadRequestResponse("unauthenticated");

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return sendBadRequestResponse("project identifier is missing");
    }

    const analytics = await Task.aggregate([
      {
        $match: {
          project: projectId,
          members: user._id,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return sendSuccessResponse("task analytics retrieved", analytics);
  } catch (error) {
    return sendServerErrorResponse();
  }
};
