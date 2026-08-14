export const recoveryCodeEmail = (recoverUrl: string) => {
    return {
        subject: 'Password recovery',
        text: `You requested to reset your password. 
    Please click the link below to reset it:
    
    ${recoverUrl}
    
    If you didn't request this, you can safely ignore this email.`,
        html: `
<div style="font-family: Arial, Helvetica, sans-serif; background:#f4f4f5; padding:40px 20px;">
  <div style="max-width:500px; margin:0 auto; background:white; padding:32px; border-radius:8px; border:1px solid #e4e4e7; text-align: center;">
    
    <h2 style="margin-top:0; color:#18181b; text-align: left;">Password Reset</h2>
    
    <p style="color:#3f3f46; line-height:1.5; text-align: left;">
      We received a request to reset your password. Click the button below to choose a new one:
    </p>

    <div style="margin: 32px 0;">
      <a href="${recoverUrl}" style="
        background-color: #18181b;
        color: white;
        padding: 14px 24px;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        display: inline-block;
      ">
        Reset Password
      </a>
    </div>

    <p style="color:#71717a; font-size:13px; line-height:1.5; text-align: left;">
      If the button doesn't work, copy and paste this link into your browser:
      <br />
      <span style="color: #3b82f6; word-break: break-all;">${recoverUrl}</span>
    </p>

    <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 24px 0;" />

    <p style="color:#a1a1aa; font-size:12px; text-align: left;">
      If you didn't request a password reset, you can safely ignore this email. This link will expire in 1 hour.
    </p>
  </div>
</div>
`
    }
}