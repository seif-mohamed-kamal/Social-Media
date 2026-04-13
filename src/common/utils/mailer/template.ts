export const otpEmailTemplate = ({
  otp,
  subject,
}: {
  otp: string;
  subject: string;
}): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Verification Code</title>
    </head>
  
    <body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;">
      
      <table width="100%" cellspacing="0" cellpadding="0" style="padding:40px 0;">
        <tr>
          <td align="center">
            
            <table width="500" cellspacing="0" cellpadding="0" 
            style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 8px 25px rgba(0,0,0,0.05);">
  
              <tr>
                <td align="center">
                  <h1 style="color:#333;margin-bottom:10px;">${subject}</h1>
                  <p style="color:#777;font-size:15px;">
                    Use the verification code below to continue.
                  </p>
                </td>
              </tr>
  
              <tr>
                <td align="center" style="padding:30px 0;">
                  
                  <div style="
                    background:#f1f4ff;
                    color:#4f46e5;
                    font-size:32px;
                    font-weight:bold;
                    letter-spacing:6px;
                    padding:15px 30px;
                    border-radius:8px;
                    display:inline-block;
                  ">
                    ${otp}
                  </div>
  
                </td>
              </tr>
  
              <tr>
                <td align="center">
                  <p style="color:#666;font-size:14px;">
                    This code will expire in <strong>2 minutes</strong>.
                  </p>
                </td>
              </tr>
  
              <tr>
                <td align="center" style="padding-top:20px;">
                  <p style="color:#999;font-size:12px;">
                    If you didn't request this email, you can safely ignore it.
                  </p>
                </td>
              </tr>
  
            </table>
  
            <p style="margin-top:20px;color:#aaa;font-size:12px;">
              © ${new Date().getFullYear()} SARA7A App
            </p>
  
          </td>
        </tr>
      </table>
  
    </body>
    </html>
    `;
};
