import { randomBytes } from "crypto";
import getAuthUser from "@/app/api/utils/auth";
import {
  sendBadRequestResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "@/app/api/utils/responses";
import User from "@/app/api/models/user";
import Project from "@/app/api/models/project";
import { sendEmail } from "@/app/api/utils/send-email";
import { hashPin } from "@/app/api/utils/hash-password";

export const POST = async (req, context) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return sendBadRequestResponse("unauthenticated", {}, 401);

    const { id: projectId } = await context.params;
    const { members } = await req.json();

    if (!Array.isArray(members) || !members.length) {
      return sendBadRequestResponse("Members must be a non-empty array");
    }

    if (!projectId) {
      return sendBadRequestResponse("project identifier is missing");
    }

    const project = await Project.findOne({
      owner: user._id,
      _id: projectId,
    });

    if (!project) {
      return sendBadRequestResponse("project not found", {}, 404);
    }

    const emails = [
      ...new Set(
        members
          .filter((email) => typeof email === "string")
          .map((email) => email.trim().toLowerCase()),
      ),
    ];

    if (emails.length !== members.length || emails.some((email) => !email)) {
      return sendBadRequestResponse("Invalid email list");
    }

    const addedMembers = [];

    for (const email of emails) {
      let member = await User.findOne({ email });
      let isNewUser = false;
      let password;

      if (!member) {
        password = randomBytes(32).toString("hex");

        member = await User.create({
          email,
          password: await hashPin(password),
        });

        isNewUser = true;
      }

      await Promise.all([
        Project.updateOne(
          { _id: projectId },
          { $addToSet: { members: member._id } },
        ),
        User.updateOne(
          { _id: member._id },
          { $addToSet: { projects: projectId } },
        ),
      ]);

      await sendEmail({
        to: member.email,
        subject: `You've been added to ${project.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px;">
            <h2>You've been invited to a project!</h2>
            <p>Hello ${member.firstName || "there"},</p>
            <p><strong>${user.firstName || user.email}</strong> has invited you to collaborate on <strong>${project.name}</strong>.</p>
            ${
              isNewUser
                ? `
                  <p>Your account has been created successfully.</p>
                  <p><strong>Email:</strong> ${member.email}</p>
                  <p><strong>Temporary password:</strong> ${password}</p>
                  <p>Please change your password after your first login.</p>
                `
                : ""
            }
            <p>Click the button below to view your project.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects/${projectId}" style="display: inline-block; padding: 12px 24px; background: #FF4500; color: white; text-decoration: none; border-radius: 6px;">
              View Project
            </a>
          </div>
        `,
      });

      addedMembers.push({
        email,
        userId: member._id,
        isNewUser,
        ...(isNewUser && { password }),
      });
    }

    return sendSuccessResponse("Invitations sent", addedMembers);
  } catch (error) {
    console.error(error);
    return sendServerErrorResponse();
  }
};
