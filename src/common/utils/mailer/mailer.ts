import nodemailer from "nodemailer";
import { APP_GMAIL, APP_PASSWORD } from "../../../config/config.service";
import Mail from "nodemailer/lib/mailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: APP_GMAIL,
    pass: APP_PASSWORD,
  },
});

export const sendEmail = async ({
  to,
  cc,
  bcc,
  subject,
  html,
  attachments = [],
}:Mail.Options):Promise<void> => {
  try {
    const info = await transporter.sendMail({
      to,
      cc,
      bcc,
      subject,
      html,
      attachments,
      from: 'Social-Media✌️',

    });

    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Email error:", error);
    throw new Error("Failed to send OTP email");
  }
};
