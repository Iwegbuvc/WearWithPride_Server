const { getDatTimeUTC } = require("./dateHelper");
const forgotPasswordMail = (firstName, resetPasswordToken) => {
  const date = getDatTimeUTC();
  return `
        <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - Wear With Pride</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5; color: #333;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto;">
        <!-- Header -->
        <tr>
            <td style="background-color: #FFD700; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Wear With Pride</h1>
                <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px;">Secure Your Account</p>
            </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
            <td style="background-color: #ffffff; padding: 30px;">
                <h2 style="color: #FFD700; margin: 0 0 20px 0;">Reset Your Password</h2>
                <p style="line-height: 1.6; margin: 0 0 20px 0;">
                    Hello ${firstName},<br><br>
                    We received a request to reset your Wear With Pride account password on 
                    <strong>${date}</strong>. Click the button below to verify and set a new password:
                </p>
                
                <!-- Reset Password Button -->
                <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 20px;">
                    <tr>
                        <td style="background-color: #FFD700; border-radius: 5px;">
                            <a href="${
                              process.env.FRONTEND_URL
                            }/reset-password?token=${resetPasswordToken}" 
                               style="display: inline-block; padding: 14px 35px; color: #ffffff; 
                                      text-decoration: none; font-weight: bold; font-size: 16px;">
                                Reset Password
                            </a>
                        </td>
                    </tr>
                </table>
                
                <p style="line-height: 1.6; margin: 0 0 20px 0; font-size: 14px;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${
                      process.env.FRONTEND_URL
                    }/reset-password?token=${resetPasswordToken}" style="color: #FFD700; word-break: break-all;">${
                      process.env.FRONTEND_URL
                    }/reset-password?token=${resetPasswordToken}</a>
                </p>
                
                <p style="line-height: 1.6; margin: 0; color: #666; font-size: 12px;">
                    This link expires in 1 hour. If you didn’t request a password reset, 
                    please ignore this email or contact support immediately.
                </p>
            </td>
        </tr>
        
        <!-- Security Tip -->
        <tr>
            <td style="background-color: #fff5f0; padding: 20px; font-size: 14px;">
                <p style="margin: 0; line-height: 1.6;">
                    <strong style="color: #FFD700;">Tip:</strong> Choose a strong, unique password 
                    to keep your Wear With Pride account secure.
                </p>
            </td>
        </tr>
        
    </table>
</body>
</html>
    `;
};

const generatePasswordResetMail = (firstName) => {
  const date = getDatTimeUTC();
  return `
        <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Changed - Wear With Pride</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5; color: #333;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto;">
        <!-- Header -->
        <tr>
            <td style="background-color: #FFD700; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Wear With Pride</h1>
                <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px;">Your Account is Secure</p>
            </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
            <td style="background-color: #ffffff; padding: 30px; text-align: center;">
                <h2 style="color: #FFD700; margin: 0 0 20px 0;">Password Changed Successfully!</h2>
                
                <!-- Success Icon -->
                <div style="font-size: 48px; margin: 20px 0;">🔒</div>
                
                <p style="line-height: 1.6; margin: 0 0 20px 0;">
                    Hello ${firstName},<br><br>
                    Great news! Your Wear With Pride account password was successfully updated 
                    on ${date}. You’re all set to continue trading with enhanced security.
                </p>
                
                <!-- Login Button -->
                <table border="0" cellpadding="0" cellspacing="0" style="margin: 20px auto;">
                    <tr>
                        <td style="background-color: #FFD700; border-radius: 5px;">
                            <a href="${process.env.FRONTEND_URL}" 
                               style="display: inline-block; padding: 14px 35px; color: #ffffff; 
                                      text-decoration: none; font-weight: bold; font-size: 16px;">
                                Log In Now
                            </a>
                        </td>
                    </tr>
                </table>
                
                <p style="line-height: 1.6; margin: 0 0 20px 0; font-size: 14px; color: #666;">
                    If you didn’t make this change, please contact us immediately.
                </p>
            </td>
        </tr>
        
        <!-- Security Tip -->
        <tr>
            <td style="background-color: #fff5f0; padding: 20px; font-size: 14px;">
                <p style="margin: 0; line-height: 1.6;">
                    <strong style="color: #FFD700;">Security Tip:</strong> Keep your account safe 
                    by using a unique password and never sharing it with anyone.
                </p>
            </td>
        </tr>
        
       
    </table>
</body>
</html>
    `;
};

module.exports = { forgotPasswordMail, generatePasswordResetMail };
