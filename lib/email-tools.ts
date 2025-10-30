/**
 * 邮件发送工具
 * 使用 Nodemailer
 */

/**
 * 发送邮件
 */
export async function sendEmail(
  to: string,
  subject: string,
  content: string,
  options?: {
    from?: string;
    cc?: string;
    bcc?: string;
    attachments?: Array<{ filename: string; path: string }>;
    html?: boolean;
  }
): Promise<any> {
  try {
    // 检查邮件配置
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return {
        error: "邮件未配置",
        message: "请在 .env.local 中配置邮件服务器信息",
        requiredEnv: ["EMAIL_HOST", "EMAIL_PORT", "EMAIL_USER", "EMAIL_PASS"],
        note: "💡 配置示例：EMAIL_HOST=smtp.gmail.com, EMAIL_PORT=587, EMAIL_USER=your@email.com, EMAIL_PASS=your_password",
      };
    }

    const nodemailer = require('nodemailer');

    // 创建传输器
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 邮件选项
    const mailOptions = {
      from: options?.from || process.env.EMAIL_USER,
      to: to,
      cc: options?.cc,
      bcc: options?.bcc,
      subject: subject,
      text: options?.html ? undefined : content,
      html: options?.html ? content : undefined,
      attachments: options?.attachments,
    };

    // 发送邮件
    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
      to: to,
      subject: subject,
      note: `✅ 邮件已发送到 ${to}`,
    };
  } catch (error: any) {
    return {
      error: "邮件发送失败",
      message: error.message,
      to: to,
      note: "请检查邮件配置或网络连接",
    };
  }
}

/**
 * 发送带附件的邮件
 */
export async function sendEmailWithAttachment(
  to: string,
  subject: string,
  content: string,
  attachmentPath: string
): Promise<any> {
  const path = require('path');
  const filename = path.basename(attachmentPath);

  return await sendEmail(to, subject, content, {
    attachments: [{ filename, path: attachmentPath }],
  });
}




