function money(amount, currency = "USD") {
  const value = Number(amount || 0);

  return `${currency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function baseEmailTemplate({ fullName, title, message, actionText }) {
  const year = new Date().getFullYear();

  return `
  <div style="font-family: Arial, sans-serif; background:#f4f6fb; padding:30px 15px;">
    <div style="max-width:560px; margin:auto; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">
      <div style="background:#4b0082; padding:24px; text-align:center;">
        <h2 style="color:#ffffff; margin:0;">Rebetas AutoPilot</h2>
      </div>

      <div style="padding:28px;">
        <h3 style="color:#222; margin-top:0;">${title}</h3>

        <p style="font-size:15px; color:#444;">
          Hello ${fullName || "Valued User"},
        </p>

        <p style="font-size:15px; color:#444; line-height:1.6;">
          ${message}
        </p>

        ${
          actionText
            ? `<p style="font-size:15px; color:#444; line-height:1.6;">${actionText}</p>`
            : ""
        }

        <p style="font-size:14px; color:#666; margin-top:25px;">
          Thank you for using Rebetas.
        </p>
      </div>

      <div style="background:#f0edf7; padding:16px; text-align:center; color:#777; font-size:12px;">
        © ${year} Rebetas. All rights reserved.
      </div>
    </div>
  </div>
  `;
}

const notificationTemplates = {
  PAYMENT_INITIALIZED: ({ user, data = {} }) => ({
    type: "payment_initialized",
    title: "Package Payment Started",
    message: `Your AutoPilot Package payment has been started for ${money(
      data.amount,
      data.currency,
    )}.`,
    email: false,
  }),

  PAYMENT_SUCCESSFUL: ({ user, data = {} }) => ({
    type: "payment_successful",
    title: "Package Payment Successful",
    message: `Your AutoPilot Package payment of ${money(
      data.amount,
      data.currency,
    )} was successful.`,
    email: true,
    emailSubject: "Your AutoPilot Package Payment Was Successful",
    emailHtml: baseEmailTemplate({
      fullName: user.fullName,
      title: "Package Payment Successful",
      message: `Your AutoPilot Package payment of ${money(
        data.amount,
        data.currency,
      )} was successful.`,
      actionText:
        "Your AutoPilot account will be activated and managed from your dashboard.",
    }),
  }),

  ACCOUNT_ACTIVATED: ({ user, data = {} }) => ({
    type: "package_activation",
    title: "AutoPilot Account Activated",
    message: `Your AutoPilot account has been activated successfully.`,
    email: true,
    emailSubject: "Your AutoPilot Account Is Now Active",
    emailHtml: baseEmailTemplate({
      fullName: user.fullName,
      title: "AutoPilot Account Activated",
      message:
        "Your AutoPilot account has been activated successfully. You can now monitor your Capital Balance and Profit Balance from your dashboard.",
    }),
  }),

  PROFIT_CREDIT: ({ user, data = {} }) => ({
    type: "profit_credit",
    title: "Profit Credit Added",
    message: `A Profit Credit of ${money(
      data.amount,
      data.currency,
    )} has been added to your Profit Balance.`,
    email: false,
  }),

  COMPOUND_PROFIT: ({ user, data = {} }) => ({
    type: "compound_profit",
    title: "Compound Profit Successful",
    message: `Your Compound Profit of ${money(
      data.amount,
      data.currency,
    )} was successful.`,
    email: false,
  }),

  PROFIT_WITHDRAWAL_REQUESTED: ({ user, data = {} }) => ({
    type: "profit_withdrawal",
    title: "Profit Withdrawal Submitted",
    message: `Your Profit Withdrawal request of ${money(
      data.amount,
      data.currency,
    )} has been submitted successfully.`,
    email: true,
    emailSubject: "Profit Withdrawal Submitted",
    emailHtml: baseEmailTemplate({
      fullName: user.fullName,
      title: "Profit Withdrawal Submitted",
      message: `Your Profit Withdrawal request of ${money(
        data.amount,
        data.currency,
      )} has been submitted successfully.`,
      actionText:
        "Our team will review and process it according to the withdrawal timeline.",
    }),
  }),

  REFERRAL_BONUS: ({ user, data = {} }) => ({
    type: "referral_bonus",
    title: "Referral Bonus Added",
    message: `A referral bonus of ${money(
      data.amount,
      data.currency,
    )} has been added to your Referral Balance.`,
    email: false,
  }),

  COMPOUND_REFERRAL: ({ user, data = {} }) => ({
    type: "referral_compound",
    title: "Referral Balance Compounded",
    message: `Your Referral Balance of ${money(
      data.amount,
      data.currency,
    )} was moved to your Capital Balance successfully.`,
    email: false,
  }),

  REFERRAL_WITHDRAWAL_REQUESTED: ({ user, data = {} }) => ({
    type: "referral_withdrawal",
    title: "Referral Withdrawal Submitted",
    message: `Your Referral Withdrawal request of ${money(
      data.amount,
      data.currency,
    )} has been submitted successfully.`,
    email: true,
    emailSubject: "Referral Withdrawal Submitted",
    emailHtml: baseEmailTemplate({
      fullName: user.fullName,
      title: "Referral Withdrawal Submitted",
      message: `Your Referral Withdrawal request of ${money(
        data.amount,
        data.currency,
      )} has been submitted successfully.`,
      actionText:
        "Our team will review and process it according to the withdrawal timeline.",
    }),
  }),

  CAPITAL_WITHDRAWAL_REQUESTED: ({ user, data = {} }) => ({
    type: "capital_withdrawal",
    title: "Capital Withdrawal Submitted",
    message: `Your Capital Withdrawal request of ${money(
      data.amount,
      data.currency,
    )} has been submitted successfully.`,
    email: true,
    emailSubject: "Capital Withdrawal Submitted",
    emailHtml: baseEmailTemplate({
      fullName: user.fullName,
      title: "Capital Withdrawal Submitted",
      message: `Your Capital Withdrawal request of ${money(
        data.amount,
        data.currency,
      )} has been submitted successfully.`,
      actionText:
        "Our team will review and process it according to the withdrawal timeline.",
    }),
  }),

  WITHDRAWAL_APPROVED: ({ user, data = {} }) => ({
    type: "withdrawal_approved",
    title: "Withdrawal Approved",
    message: `Your ${data.withdrawalType || "Withdrawal"} request of ${money(
      data.amount,
      data.currency,
    )} has been approved.`,
    email: true,
    emailSubject: "Your Withdrawal Has Been Approved",
    emailHtml: baseEmailTemplate({
      fullName: user.fullName,
      title: "Withdrawal Approved",
      message: `Your ${data.withdrawalType || "Withdrawal"} request of ${money(
        data.amount,
        data.currency,
      )} has been approved.`,
    }),
  }),

  WITHDRAWAL_REJECTED: ({ user, data = {} }) => ({
    type: "withdrawal_rejected",
    title: "Withdrawal Rejected",
    message: `Your ${data.withdrawalType || "Withdrawal"} request of ${money(
      data.amount,
      data.currency,
    )} was rejected.${data.reason ? ` Reason: ${data.reason}` : ""}`,
    email: true,
    emailSubject: "Your Withdrawal Was Rejected",
    emailHtml: baseEmailTemplate({
      fullName: user.fullName,
      title: "Withdrawal Rejected",
      message: `Your ${data.withdrawalType || "Withdrawal"} request of ${money(
        data.amount,
        data.currency,
      )} was rejected.${data.reason ? ` Reason: ${data.reason}` : ""}`,
    }),
  }),

  WITHDRAWAL_PAID: ({ user, data = {} }) => ({
    type: "withdrawal_paid",
    title: "Withdrawal Paid",
    message: `Your ${data.withdrawalType || "Withdrawal"} of ${money(
      data.amount,
      data.currency,
    )} has been paid successfully.`,
    email: true,
    emailSubject: "Your Withdrawal Has Been Paid",
    emailHtml: baseEmailTemplate({
      fullName: user.fullName,
      title: "Withdrawal Paid",
      message: `Your ${data.withdrawalType || "Withdrawal"} of ${money(
        data.amount,
        data.currency,
      )} has been paid successfully.`,
    }),
  }),

  MANUAL_PROFIT_CREDIT: ({ user, data = {} }) => ({
    type: "manual_profit_credit",
    title: "Profit Credit Added",
    message: `A Profit Credit of ${money(
      data.amount,
      data.currency,
    )} has been added to your Profit Balance.`,
    email: false,
  }),

  MAINTENANCE_UPDATE: ({ user, data = {} }) => ({
    type: "maintenance",
    title: data.title || "Service Update",
    message:
      data.message ||
      "We are working to bring all Rebetas services back fully and better.",
    email: true,
    emailSubject: data.emailSubject || "Important Rebetas Service Update",
    emailHtml: baseEmailTemplate({
      fullName: user.fullName,
      title: data.title || "Service Update",
      message:
        data.message ||
        "We are working to bring all Rebetas services back fully and better.",
    }),
  }),
};

function getNotificationTemplate(event, payload) {
  const template = notificationTemplates[event];

  if (!template) {
    throw new Error(`Unknown notification event: ${event}`);
  }

  return template(payload);
}

module.exports = {
  getNotificationTemplate,
};
