// import { renderEmailTemplate } from "./render-email-template.js";
import nodemailerConfig from "./mail-config.js";
import axios from "axios";

export const sendEmail = async ({ data, html, to, subject }) => {
  try {
    // const html = await renderEmailTemplate(template, data);
    const payload = {
      to,
      subject,
      senderName: "Manage Project",
      senderEmail: "info@diagnoxa.com",
      replyTo: "support@diagnoxa.com",
      html,
      mailConfig: nodemailerConfig,
    };

    const res = await axios.post(
      `https://api.wakafoody.ng/api/diagnoxa/email`,
      payload,
    );

    return res;
  } catch (error) {
    console.error(error);
  }
};

export const sendEmailV2 = async ({ to, subject, html }) => {
  try {
    const payload = {
      to,
      subject,
      senderName: "WakaFoody",
      senderEmail: "info@wakafoody.ng",
      replyTo: "support@wakafoody.ng",
      html,
      mailConfig: nodemailerConfig,
    };

    const res = await axios.post(
      `https://wakafoody-user-backend.onrender.com/api/diagnoxa/email`,
      payload,
    );

    return res;
  } catch (error) {
    console.error(error);
  }
};
