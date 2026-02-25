// Import Brevo SDK for transactional emails (v4.x)
const { BrevoClient } = require("@getbrevo/brevo");

// Initialize BrevoClient with API key
const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

/**
 * sendMail - Send an email via Brevo SDK for Wear With Pride Platform
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML content of the email
 * @param {string} [toName] - Optional recipient name
 */

/**
 * sendMail - Send an email via Brevo SDK for Wear With Pride Platform
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML content of the email
 * @param {string} [toName] - Optional recipient name
 */
async function sendMail(to, subject, htmlContent, toName = "") {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not set in environment");
  }
  if (!process.env.BREVO_FROM_EMAIL) {
    throw new Error("BREVO_FROM_EMAIL is not set in environment");
  }

  try {
    // Replace all occurrences of 'crypto' (case-insensitive) with 'clothing' in the email content for branding consistency
    const replacedHtmlContent = (htmlContent || "").replace(
      /crypto/gi,
      "clothing",
    );
    // Remove HTML tags for plain text fallback
    const replacedTextContent = (replacedHtmlContent || "").replace(
      /<[^>]+>/g,
      "",
    );
    // Ensure name is always present and non-empty for Brevo API
    const recipientName =
      toName && typeof toName === "string" && toName.trim() !== ""
        ? toName
        : "Wear With Pride Customer";
    const payload = {
      sender: {
        email: process.env.BREVO_FROM_EMAIL,
        name: "Wear With Pride",
      },
      to: [{ email: to, name: recipientName }],
      subject,
      htmlContent: replacedHtmlContent,
      textContent: replacedTextContent, // fallback plain text
    };

    const result = await brevo.transactionalEmails.sendTransacEmail(payload);

    const messageId =
      result?.body?.messageId ?? result?.messageId ?? JSON.stringify(result);
    console.log("Email sent! Message ID:", messageId);

    return result;
  } catch (err) {
    console.error(
      "Brevo sendMail error:",
      err?.response?.body ?? err?.response ?? err?.message ?? err,
    );
    throw err;
  }
}

module.exports = sendMail;
