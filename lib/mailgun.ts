import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
if (!MAILGUN_API_KEY) {
  throw new Error('MAILGUN_API_KEY environment variable is not set');
}

export const mg = mailgun.client({
  username: 'api',
  key: MAILGUN_API_KEY,
});

export const sendOtpToEmail = async ({
  email,
  name,
  otpCode
}: {
  email: string;
  name: string;
  otpCode: string;
}) => {
  const htmlContent = `
      <div style="font-family: Arial, sans-serif; background:#f6f9fc; padding:24px;">
        <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px; box-shadow:0 2px 6px rgba(0,0,0,0.08);">
          <h2 style="margin:0 0 8px 0; color:#333;">Mã xác thực (OTP)</h2>
          <p style="margin:0 0 16px 0; color:#555;">
            Xin chào ${name || 'quý khách hàng'},<br />
            Hệ thống Hoteloka đã gửi cho quý khách mã OTP gồm 6 chữ số để xác thực.
          </p>

          <div style="display:flex; align-items:center; justify-content:center; margin:18px 0;">
            <span style="font-size:28px; letter-spacing:4px; font-weight:700; background:#f1f5f9; padding:12px 20px; border-radius:6px; color:#111;">
              ${otpCode}
            </span>
          </div>

          <p style="margin:0 0 8px 0; color:#555;">
            Mã có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.
          </p>
        </div>
      </div>
  `;

  const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
  if (!MAILGUN_DOMAIN) {
    throw new Error('MAILGUN_DOMAIN environment variable is not set');
  }

  try {
    const result = await mg.messages.create(MAILGUN_DOMAIN, {
      from: `Hoteloka <no-reply@${MAILGUN_DOMAIN}>`,
      to: email,
      subject: 'Mã OTP Xác Thực Tài Khoản',
      html: htmlContent,
    });
    console.log('OTP email sent successfully');
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send OTP email', { cause: error });
  }
};