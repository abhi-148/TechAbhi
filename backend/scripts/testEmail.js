import "dotenv/config";
import {
  verifyEmailConnection,
  sendEmail,
} from "../services/emailService.js";

async function main() {
  console.log("Checking Gmail SMTP connection...");

  await verifyEmailConnection();
  console.log("SMTP connection successful!");

  const result = await sendEmail({
    to: process.env.MAIL_USER,
    subject: "TechAbhi SMTP Test",
    text: "Congratulations! TechAbhi email setup is working.",
    html: "<h2>TechAbhi SMTP Test</h2><p>Email setup is working.</p>",
  });

  console.log("Email accepted by SMTP server:", result.messageId);
}

main().catch((error) => {
  console.error("Email test failed:", error.message);
  process.exitCode = 1;
});