import { Resend } from 'resend'

// Defer instantiation so Next.js build-time evaluation never runs the constructor
function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY')
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'tickets@goldenvalleymembers.com'

interface ReceiptEmailData {
  to: string
  buyerName: string
  ticketNumber: number
  paymentId: string
}

interface PendingZelleEmailData {
  to: string
  buyerName: string
}

interface Reminder24hEmailData {
  to: string
  buyerName: string
  paymentId: string
}

interface SellerWelcomeEmailData {
  to: string
  sellerName: string
  referralCode: string
  loginUrl: string
}

export async function sendReceiptEmail(data: ReceiptEmailData) {
  return getResend().emails.send({
    from: FROM,
    to: data.to,
    subject: `Your Golden Valley Ticket #${data.ticketNumber} is Confirmed!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { background: #0A0A0A; color: #F5F0E8; font-family: 'DM Sans', Arial, sans-serif; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; border-bottom: 1px solid rgba(201,168,76,0.3); padding-bottom: 30px; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: 700; letter-spacing: 0.15em; background: linear-gradient(135deg, #8B6914, #C9A84C, #E8CC7A); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .ticket-box { background: #1A1A1A; border: 2px solid #C9A84C; border-radius: 8px; padding: 40px; text-align: center; margin: 30px 0; }
    .ticket-label { font-size: 12px; letter-spacing: 0.2em; color: #A89F8F; text-transform: uppercase; margin-bottom: 8px; }
    .ticket-number { font-size: 80px; font-weight: 700; font-family: 'DM Mono', monospace; color: #C9A84C; line-height: 1; }
    .buyer-name { font-size: 22px; margin-top: 16px; color: #F5F0E8; }
    .section { background: #111111; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .section-title { font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #A89F8F; margin-bottom: 10px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #2A2A2A; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #A89F8F; }
    .detail-value { color: #F5F0E8; font-weight: 500; }
    .terms { font-size: 11px; color: #A89F8F; line-height: 1.6; margin-top: 30px; border-top: 1px solid #2A2A2A; padding-top: 20px; }
    .footer { text-align: center; font-size: 12px; color: #A89F8F; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">GOLDEN VALLEY MEMBERS</div>
      <p style="color: #A89F8F; margin-top: 8px; font-size: 14px;">Exclusive Members Raffle</p>
    </div>

    <p style="text-align: center; font-size: 18px; margin-bottom: 0;">Your ticket is confirmed, ${data.buyerName.split(' ')[0]}.</p>

    <div class="ticket-box">
      <div class="ticket-label">Your Ticket Number</div>
      <div class="ticket-number">#${String(data.ticketNumber).padStart(4, '0')}</div>
      <div class="buyer-name">${data.buyerName}</div>
    </div>

    <div class="section">
      <div class="section-title">Ticket Details</div>
      <div class="detail-row">
        <span class="detail-label">Ticket Price</span>
        <span class="detail-value">$500.00 USD</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status</span>
        <span class="detail-value" style="color: #2D6A4F;">Confirmed ✓</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Reference</span>
        <span class="detail-value" style="font-size: 12px; font-family: monospace;">${data.paymentId.slice(0, 8).toUpperCase()}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">How the Draw Works</div>
      <p style="font-size: 14px; color: #F5F0E8; line-height: 1.6; margin: 0;">
        The draw occurs automatically when ticket <strong style="color: #C9A84C;">#1,000</strong> is sold.
        The winner is selected by random draw and announced publicly.
        As a ticket holder, you will be notified immediately by email.
      </p>
    </div>

    <div class="terms">
      <strong>Summary of Terms:</strong> Ticket price of $500 USD is non-refundable after confirmation.
      The draw occurs at ticket #1,000. Winner is selected by random draw. Prize is non-transferable.
      Winner is responsible for applicable taxes. By participating you confirm you are 18+ years old.
    </div>

    <div class="footer">
      <p>Golden Valley Members LLC</p>
      <p style="margin-top: 4px;">Questions? Reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  })
}

export async function sendPendingZelleEmail(data: PendingZelleEmailData) {
  return getResend().emails.send({
    from: FROM,
    to: data.to,
    subject: 'Golden Valley — Payment Receipt Received (Under Review)',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  body { background: #0A0A0A; color: #F5F0E8; font-family: Arial, sans-serif; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .logo { font-size: 22px; font-weight: 700; letter-spacing: 0.15em; color: #C9A84C; }
  .box { background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 8px; padding: 24px; margin: 24px 0; }
</style>
</head>
<body>
<div class="container">
  <div class="logo">GOLDEN VALLEY MEMBERS</div>
  <h2 style="margin-top: 24px;">Hi ${data.buyerName.split(' ')[0]},</h2>
  <p>We received your Zelle payment receipt and it's currently under review.</p>
  <div class="box">
    <strong style="color: #C9A84C;">What happens next:</strong>
    <ul style="margin-top: 12px; line-height: 2;">
      <li>Our team will verify your payment within 24–48 hours</li>
      <li>Once verified, you'll receive your official ticket number by email</li>
      <li>Your ticket number is assigned in the order payments are confirmed</li>
    </ul>
  </div>
  <p style="color: #A89F8F; font-size: 13px;">If you have questions, reply to this email.</p>
  <p style="color: #A89F8F; font-size: 12px; margin-top: 32px;">Golden Valley Members LLC</p>
</div>
</body>
</html>
    `.trim(),
  })
}

export async function sendReminder24hEmail(data: Reminder24hEmailData) {
  return getResend().emails.send({
    from: FROM,
    to: data.to,
    subject: 'Golden Valley — Your ticket is still waiting for payment',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  body { background: #0A0A0A; color: #F5F0E8; font-family: Arial, sans-serif; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .logo { font-size: 22px; font-weight: 700; letter-spacing: 0.15em; color: #C9A84C; }
  .zelle-box { background: #1A1A1A; border: 1px solid #C9A84C; border-radius: 8px; padding: 24px; margin: 24px 0; }
  .btn { display: inline-block; background: linear-gradient(135deg, #8B6914, #C9A84C); color: #0A0A0A; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: 700; margin-top: 16px; }
</style>
</head>
<body>
<div class="container">
  <div class="logo">GOLDEN VALLEY MEMBERS</div>
  <h2 style="margin-top: 24px;">Your spot is still reserved!</h2>
  <p>You started a ticket purchase 24 hours ago but we haven't received payment yet. Tickets are going fast — complete your purchase to secure your number.</p>
  <div class="zelle-box">
    <strong style="color: #C9A84C;">Send $500 via Zelle:</strong>
    <p style="margin-top: 12px;">📱 Phone: ${process.env.GVM_ZELLE_PHONE ?? 'See website'}</p>
    <p>Name: Golden Valley Members LLC</p>
    <p style="color: #A89F8F; font-size: 13px; margin-top: 8px;">After sending, upload your receipt at goldenvalleymembers.com</p>
  </div>
  <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://goldenvalleymembers.com'}" class="btn">Complete My Purchase →</a>
  <p style="color: #A89F8F; font-size: 12px; margin-top: 32px;">Reference: ${data.paymentId.slice(0, 8).toUpperCase()} — Golden Valley Members LLC</p>
</div>
</body>
</html>
    `.trim(),
  })
}

export async function sendSellerWelcomeEmail(data: SellerWelcomeEmailData) {
  return getResend().emails.send({
    from: FROM,
    to: data.to,
    subject: 'Welcome to the Golden Valley Members Seller Program',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  body { background: #0A0A0A; color: #F5F0E8; font-family: Arial, sans-serif; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .logo { font-size: 22px; font-weight: 700; letter-spacing: 0.15em; color: #C9A84C; }
  .code-box { background: #1A1A1A; border: 2px solid #C9A84C; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0; }
  .code { font-size: 32px; font-family: monospace; color: #C9A84C; font-weight: 700; letter-spacing: 0.2em; }
  .commission-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  .commission-table td { padding: 10px 8px; border-bottom: 1px solid #2A2A2A; font-size: 14px; }
  .btn { display: inline-block; background: linear-gradient(135deg, #8B6914, #C9A84C); color: #0A0A0A; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: 700; }
</style>
</head>
<body>
<div class="container">
  <div class="logo">GOLDEN VALLEY MEMBERS</div>
  <h2 style="margin-top: 24px;">Welcome, ${data.sellerName}!</h2>
  <p>You've been added to the Golden Valley Members seller program. Here's everything you need to get started.</p>

  <div class="code-box">
    <div style="font-size: 12px; letter-spacing: 0.2em; color: #A89F8F; margin-bottom: 8px;">YOUR REFERRAL CODE</div>
    <div class="code">${data.referralCode}</div>
    <div style="margin-top: 12px; font-size: 13px; color: #A89F8F;">Share this link: ${process.env.NEXT_PUBLIC_APP_URL ?? 'https://goldenvalleymembers.com'}/?ref=${data.referralCode}</div>
  </div>

  <h3 style="color: #C9A84C;">Your Commission Structure</h3>
  <table class="commission-table">
    <tr><td style="color: #A89F8F;">Ticket Price</td><td style="text-align: right;">$500</td></tr>
    <tr><td style="color: #A89F8F;">Your commission (direct sale)</td><td style="text-align: right; color: #C9A84C; font-weight: 700;">$100</td></tr>
    <tr><td style="color: #A89F8F;">Your commission (if you recruit a seller who sells)</td><td style="text-align: right; color: #C9A84C;">$25</td></tr>
    <tr><td style="color: #A89F8F;">Prize pool (accumulated per sale)</td><td style="text-align: right;">$25</td></tr>
  </table>

  <a href="${data.loginUrl}" class="btn">Access Your Dashboard →</a>

  <p style="color: #A89F8F; font-size: 12px; margin-top: 32px;">Golden Valley Members LLC — Seller Program</p>
</div>
</body>
</html>
    `.trim(),
  })
}
