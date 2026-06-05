const { Resend } = require("resend");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendInvoiceCreatedEmail = async ({ clientEmail, clientName, businessName, amount, dueDate, invoiceId, paymentUrl }) => {
  try {
    await resend.emails.send({
      from: "Pave <onboarding@resend.dev>",
      to: clientEmail,
      subject: `Invoice from ${businessName} — $${amount} USDC due ${dueDate}`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; background: #060d1c; color: #ffffff;">
          <h1 style="font-size: 24px; font-weight: 500; color: #ffffff; margin-bottom: 8px;">
            You have a new invoice
          </h1>
          <p style="color: rgba(255,255,255,0.6); margin-bottom: 32px;">
            ${businessName} has sent you an invoice for payment.
          </p>

          <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
              <span style="color: rgba(255,255,255,0.5); font-size: 13px;">Amount due</span>
              <span style="color: #ffffff; font-size: 18px; font-weight: 500;">$${amount} USDC</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
              <span style="color: rgba(255,255,255,0.5); font-size: 13px;">Due date</span>
              <span style="color: #ffffff; font-size: 14px;">${dueDate}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: rgba(255,255,255,0.5); font-size: 13px;">From</span>
              <span style="color: #ffffff; font-size: 14px;">${businessName}</span>
            </div>
          </div>

          <a href="${paymentUrl}" style="display: block; background: #4A9EFF; color: #ffffff; text-align: center; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 500; margin-bottom: 32px;">
            Pay now — $${amount} USDC
          </a>

          <p style="color: rgba(255,255,255,0.4); font-size: 12px; text-align: center;">
            Powered by Pave · Settled instantly on Arc blockchain
          </p>
        </div>
      `,
    });
    console.log("Invoice created email sent to:", clientEmail);
  } catch (err) {
    console.error("Failed to send invoice created email:", err);
  }
};

const sendPaymentConfirmationEmail = async ({ sellerEmail, clientEmail, businessName, clientName, amount, txHash, invoiceId }) => {
  try {
    const explorerUrl = `https://testnet.arcscan.app/tx/${txHash}`;

    const emailContent = (recipientName) => `
      <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; background: #060d1c; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="width: 56px; height: 56px; background: rgba(109,234,170,0.15); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <span style="font-size: 24px;">✓</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 500; color: #ffffff; margin-bottom: 8px;">
            Payment confirmed
          </h1>
          <p style="color: rgba(255,255,255,0.6);">
            $${amount} USDC has been settled on Arc
          </p>
        </div>

        <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
            <span style="color: rgba(255,255,255,0.5); font-size: 13px;">Amount</span>
            <span style="color: #6DEAAA; font-size: 18px; font-weight: 500;">$${amount} USDC</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
            <span style="color: rgba(255,255,255,0.5); font-size: 13px;">From</span>
            <span style="color: #ffffff; font-size: 14px;">${clientName}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: rgba(255,255,255,0.5); font-size: 13px;">Settlement</span>
            <span style="color: #6DEAAA; font-size: 13px;">Instant · Arc Testnet</span>
          </div>
        </div>

        <a href="${explorerUrl}" style="display: block; background: rgba(255,255,255,0.08); color: #ffffff; text-align: center; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; margin-bottom: 32px; border: 1px solid rgba(255,255,255,0.15);">
          View on Arc Explorer →
        </a>

        <p style="color: rgba(255,255,255,0.4); font-size: 12px; text-align: center;">
          Powered by Pave · Settled instantly on Arc blockchain
        </p>
      </div>
    `;

    // Send to seller
    if (sellerEmail) {
      await resend.emails.send({
        from: "Pave <onboarding@resend.dev>",
        to: sellerEmail,
        subject: `Payment received — $${amount} USDC from ${clientName}`,
        html: emailContent(businessName),
      });
    }

    // Send to client
    if (clientEmail) {
      await resend.emails.send({
        from: "Pave <onboarding@resend.dev>",
        to: clientEmail,
        subject: `Payment confirmed — $${amount} USDC to ${businessName}`,
        html: emailContent(clientName),
      });
    }

    console.log("Payment confirmation emails sent");
  } catch (err) {
    console.error("Failed to send payment confirmation email:", err);
  }
};

const sendPaymentReminderEmail = async ({ clientEmail, clientName, businessName, amount, dueDate, paymentUrl, daysUntilDue }) => {
  try {
    await resend.emails.send({
      from: "Pave <onboarding@resend.dev>",
      to: clientEmail,
      subject: `Payment reminder — $${amount} USDC due in ${daysUntilDue} days`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; background: #060d1c; color: #ffffff;">
          <h1 style="font-size: 24px; font-weight: 500; color: #ffffff; margin-bottom: 8px;">
            Payment reminder
          </h1>
          <p style="color: rgba(255,255,255,0.6); margin-bottom: 32px;">
            Your invoice from ${businessName} is due in ${daysUntilDue} days.
          </p>

          <div style="background: rgba(250,166,35,0.1); border: 1px solid rgba(250,166,35,0.3); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: rgba(255,255,255,0.5); font-size: 13px;">Amount due</span>
              <span style="color: #ffffff; font-size: 18px; font-weight: 500;">$${amount} USDC</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: rgba(255,255,255,0.5); font-size: 13px;">Due date</span>
              <span style="color: #FAA623; font-size: 14px;">${dueDate}</span>
            </div>
          </div>

          <a href="${paymentUrl}" style="display: block; background: #4A9EFF; color: #ffffff; text-align: center; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 500;">
            Pay now — $${amount} USDC
          </a>
        </div>
      `,
    });
    console.log("Reminder email sent to:", clientEmail);
  } catch (err) {
    console.error("Failed to send reminder email:", err);
  }
};

const sendOverdueEmail = async ({ clientEmail, businessName, amount, daysOverdue, paymentUrl }) => {
  try {
    await resend.emails.send({
      from: "Pave <onboarding@resend.dev>",
      to: clientEmail,
      subject: `Overdue invoice — $${amount} USDC (${daysOverdue} days overdue)`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; background: #060d1c; color: #ffffff;">
          <h1 style="font-size: 24px; font-weight: 500; color: #ff8070; margin-bottom: 8px;">
            Invoice overdue
          </h1>
          <p style="color: rgba(255,255,255,0.6); margin-bottom: 32px;">
            Your invoice from ${businessName} is ${daysOverdue} days overdue.
          </p>

          <div style="background: rgba(255,100,80,0.1); border: 1px solid rgba(255,100,80,0.3); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: rgba(255,255,255,0.5); font-size: 13px;">Amount due</span>
              <span style="color: #ffffff; font-size: 18px; font-weight: 500;">$${amount} USDC</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: rgba(255,255,255,0.5); font-size: 13px;">Days overdue</span>
              <span style="color: #ff8070; font-size: 14px;">${daysOverdue} days</span>
            </div>
          </div>

          <a href="${paymentUrl}" style="display: block; background: #ff8070; color: #ffffff; text-align: center; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 500;">
            Pay now — $${amount} USDC
          </a>
        </div>
      `,
    });
    console.log("Overdue email sent to:", clientEmail);
  } catch (err) {
    console.error("Failed to send overdue email:", err);
  }
};

module.exports = {
  sendInvoiceCreatedEmail,
  sendPaymentConfirmationEmail,
  sendPaymentReminderEmail,
  sendOverdueEmail,
};
