import { BrevoClient } from "@getbrevo/brevo";

const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY || "" });

export const sendAdminNotification = async (
  adminEmail: string,
  ticketNumber: string,
  userEmail: string,
  ticketId: string,
  appUrl: string
): Promise<boolean> => {
  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: "GPS Prototype App",
        email: process.env.BREVO_FROM_EMAIL || "",
      },
      to: [{ email: adminEmail }],
      subject: `[Action Required] New Ticket Submitted: ${ticketNumber}`,
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;
                    border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
            New Ticket Approval Needed
          </h2>

          <p style="color: #334155; font-size: 16px;">Hello Admin,</p>
          <p style="color: #334155; font-size: 16px;">
            A new GPS &amp; Camera tracking ticket has been submitted and is waiting for your review.
          </p>

          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Ticket Number:</strong> ${ticketNumber}</p>
            <p style="margin: 5px 0;"><strong>Submitted By:</strong> ${userEmail}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong>
              <span style="color: #b45309; background: #fef3c7; padding: 3px 8px;
                           border-radius: 12px; font-weight: bold; font-size: 12px;">
                PENDING APPROVAL
              </span>
            </p>
          </div>

          <p style="color: #334155; font-size: 16px;">
            Please click the button below to view the evidence photos, GPS coordinates,
            and approve or reject this ticket.
          </p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${appUrl}/dashboard/ticket/${ticketId}"
               style="background-color: #2563eb; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; font-weight: bold;
                      font-size: 16px; display: inline-block;">
              View Details &amp; Process Ticket
            </a>
          </div>
        </div>
      `,
    });

    console.log(`[Email] ✅ Sent to ${adminEmail} | MessageId: ${result.messageId}`);
    return true;

  } catch (error: any) {
    console.error(`[Email] ❌ FAILED to send to ${adminEmail}`);
    console.error(`[Email]    Status: ${error?.statusCode} | Message: ${error?.message}`);
    return false;
  }
};
