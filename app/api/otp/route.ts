import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { name, email } = await req.json();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
    });

    // TODO: Make email more specific about who I am.
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background:#f6f9fc; padding:24px;">
        <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px; box-shadow:0 2px 6px rgba(0,0,0,0.08);">
          <h2 style="margin:0 0 8px 0; color:#333;">Mã xác thực (OTP)</h2>
          <p style="margin:0 0 16px 0; color:#555;">
            Xin chào ${name || 'khách hàng'},<br />
            Hệ thống đã gửi cho bạn mã OTP gồm 6 chữ số để xác thực.
          </p>

          <div style="display:flex; align-items:center; justify-content:center; margin:18px 0;">
            <span style="font-size:28px; letter-spacing:4px; font-weight:700; background:#f1f5f9; padding:12px 20px; border-radius:6px; color:#111;">
              ${otp}
            </span>
          </div>

          <p style="margin:0 0 8px 0; color:#555;">
            Mã có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.
          </p>

          <hr style="border:none; border-top:1px solid #eee; margin:18px 0;" />

          <p style="margin:0; font-size:12px; color:#999;">
            Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email || process.env.GMAIL_USER,
      subject: `Mã OTP của bạn`,
      text: `Mã OTP của bạn là ${otp}. Mã có hiệu lực trong 5 phút.`,
      html: htmlContent,
    });

    return NextResponse.json({ message: "Success" });
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
