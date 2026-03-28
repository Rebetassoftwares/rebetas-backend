const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html }) {
  try {
    const response = await resend.emails.send({
      from: `Rebetas <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    // 🔥 LOG FULL RESPONSE
    console.log("📧 RESEND RESPONSE:", response);

    // ✅ CHECK SUCCESS PROPERLY
    if (response?.data?.id) {
      console.log("✅ Email sent:", response.data.id);
    } else {
      console.error("❌ Email failed:", response);
    }
  } catch (error) {
    console.error("❌ Email error:", error);
  }
}

module.exports = { sendEmail };
