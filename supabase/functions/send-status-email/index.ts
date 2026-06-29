import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const wrapInOfficialTemplate = (title: string, bodyHtml: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #f3f4f6;
      color: #1f2937;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border: 1px solid #e5e7eb;
    }
    .header {
      background-color: #0b0f19;
      padding: 24px;
      text-align: center;
      border-bottom: 2px solid #2563eb;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .content {
      padding: 32px 24px;
      line-height: 1.6;
    }
    .content h2 {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .content p {
      margin-top: 0;
      margin-bottom: 16px;
      font-size: 14px;
      color: #4b5563;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px 24px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #9ca3af;
    }
    .footer p {
      margin: 0 0 8px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ORBEM SOLUTIONS</h1>
    </div>
    <div class="content">
      <h2>${title}</h2>
      ${bodyHtml}
    </div>
    <div class="footer">
      <p><b>ORBEM Solutions Cargo Operations Control</b></p>
      <p>This is an automated notification. Please do not reply directly to this email.</p>
      <p>© 2026 ORBEM Solutions. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

const TEMPLATES: Record<string, (s: any) => { subject: string; html: string }> = {
  PENDING_DOCUMENTS: (s) => {
    const paymentMsg = s.payment_status === 'UNPAID' 
      ? '<p style="margin-top: 20px; padding: 12px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; color: #b45309; font-size: 13px;"><b>⚠️ Payment Pending:</b> Payment for this shipment is currently pending (UNPAID). Please complete the payment to prevent terminal routing delays.</p>' 
      : '<p style="margin-top: 20px; padding: 12px; background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; color: #15803d; font-size: 13px;"><b>✓ Payment Received:</b> Payment for this shipment has been completed successfully.</p>';
    
    return {
      subject: `Shipment ${s.awb_number} Registered — Action Required`,
      html: wrapInOfficialTemplate(
        `Consignment Intake Registered`,
        `<p>Dear Customer,</p>
         <p>Your shipment under Airway Bill (AWB) <b>${s.awb_number}</b> has been successfully registered on our portal.</p>
         <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
           <tr style="border-bottom: 1px solid #f3f4f6;"><td style="padding: 6px 0; color: #6b7280;">AWB Number:</td><td style="padding: 6px 0; font-weight: 600; color: #111827;">${s.awb_number}</td></tr>
           <tr style="border-bottom: 1px solid #f3f4f6;"><td style="padding: 6px 0; color: #6b7280;">Route:</td><td style="padding: 6px 0; font-weight: 600; color: #111827;">${s.origin_airport} ➔ ${s.destination_airport}</td></tr>
           <tr style="border-bottom: 1px solid #f3f4f6;"><td style="padding: 6px 0; color: #6b7280;">Package Count:</td><td style="padding: 6px 0; font-weight: 600; color: #111827;">${s.package_count} pkgs</td></tr>
         </table>
         <p>We are currently awaiting the upload and verification of the required compliance checksheets (Airway Bill Copy, Commercial Invoice, Packing List, ID Proof, Cargo Declaration) before your cargo can proceed for airline terminal routing.</p>
         ${paymentMsg}`
      )
    };
  },
  READY_FOR_HANDOVER: (s) => ({
    subject: `Shipment ${s.awb_number} — Ready for Airline Handover`,
    html: wrapInOfficialTemplate(
      `Compliance Check Approved`,
      `<p>Dear Customer,</p>
       <p>Great news! All required documents for shipment <b>${s.awb_number}</b> have been verified and approved by our compliance team.</p>
       <p>Your cargo is now cleared for terminal routing and is ready for airline handover.</p>
       <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
         <tr style="border-bottom: 1px solid #f3f4f6;"><td style="padding: 6px 0; color: #6b7280;">AWB Number:</td><td style="padding: 6px 0; font-weight: 600; color: #111827;">${s.awb_number}</td></tr>
         <tr style="border-bottom: 1px solid #f3f4f6;"><td style="padding: 6px 0; color: #6b7280;">Final Status:</td><td style="padding: 6px 0; font-weight: 600; color: #059669;">READY FOR HANDOVER</td></tr>
       </table>`
    )
  }),
  ON_HOLD: (s) => ({
    subject: `Action Required: Shipment ${s.awb_number} Placed On Hold`,
    html: wrapInOfficialTemplate(
      `Shipment Placed On Hold`,
      `<p>Dear Customer,</p>
       <p>Your shipment under Airway Bill (AWB) <b>${s.awb_number}</b> has been placed <b>ON HOLD</b> due to a compliance document mismatch or rejection.</p>
       <div style="padding: 16px; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; color: #991b1b; font-size: 13px; margin: 16px 0;">
         <p style="margin: 0 0 4px 0; font-weight: 600;">Rejection Reason:</p>
         <p style="margin: 0;">${s.hold_reason ?? 'A document failed validation checklist. Please review your portal documents.'}</p>
       </div>
       <p>Please log in to your portal dashboard and upload a corrected document to resume processing.</p>`
    )
  }),
  COMPLETED: (s) => ({
    subject: `Shipment ${s.awb_number} Dispatch Completed`,
    html: wrapInOfficialTemplate(
      `Cargo Dispatch Completed`,
      `<p>Dear Customer,</p>
       <p>Your cargo under Airway Bill (AWB) <b>${s.awb_number}</b> has completed all review stages, and has been successfully loaded onto the flight for dispatch.</p>
       <p>Thank you for choosing ORBEM Solutions. We appreciate your partnership.</p>`
    )
  }),
  CANCELLED: (s) => ({
    subject: `Shipment ${s.awb_number} Cancellation Notice`,
    html: wrapInOfficialTemplate(
      `Shipment Cancelled`,
      `<p>Dear Customer,</p>
       <p>Please be notified that your shipment under Airway Bill (AWB) <b>${s.awb_number}</b> has been officially cancelled in our system.</p>
       <p>If you believe this is in error, please contact our cargo operations helpdesk immediately.</p>`
    )
  }),
  PAYMENT_CONFIRMED: (s) => ({
    subject: `Payment Receipt Confirmation: Shipment ${s.awb_number}`,
    html: wrapInOfficialTemplate(
      `Payment Confirmation`,
      `<p>Dear Customer,</p>
       <p>We have successfully processed the payment for your shipment <b>${s.awb_number}</b>.</p>
       <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
         <tr style="border-bottom: 1px solid #f3f4f6;"><td style="padding: 6px 0; color: #6b7280;">AWB Number:</td><td style="padding: 6px 0; font-weight: 600; color: #111827;">${s.awb_number}</td></tr>
         <tr style="border-bottom: 1px solid #f3f4f6;"><td style="padding: 6px 0; color: #6b7280;">Payment Status:</td><td style="padding: 6px 0; font-weight: 600; color: #059669;">PAID</td></tr>
       </table>
       <p>Thank you for your payment. The processing of your cargo will proceed immediately.</p>`
    )
  }),
}

Deno.serve(async (req) => {
  try {
    const { shipment_id, event } = await req.json()

    const { data: shipment, error } = await supabase
      .from('shipments')
      .select('*, customers(name, email)')
      .eq('id', shipment_id)
      .single()
    if (error || !shipment) throw new Error('Shipment not found')

    let holdReason: string | null = null
    if (shipment.status === 'ON_HOLD') {
      const { data: rejected } = await supabase
        .from('shipment_documents')
        .select('document_type, rejection_reason')
        .eq('shipment_id', shipment_id)
        .eq('status', 'REJECTED')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      holdReason = rejected?.rejection_reason ?? null
    }

    const recipientEmail = shipment.client_email ?? shipment.customers?.email ?? null
    const buildTemplate = event === 'PAYMENT_CONFIRMED'
      ? TEMPLATES.PAYMENT_CONFIRMED
      : (TEMPLATES[shipment.status] ?? TEMPLATES.PENDING_DOCUMENTS)
    const { subject, html } = buildTemplate({
      ...shipment,
      customer_name: shipment.customers?.name ?? 'Customer',
      hold_reason: holdReason,
    })

    let sendStatus = 'SIMULATED'
    let errorMessage: string | null = null

    if (!recipientEmail) {
      sendStatus = 'SKIPPED_NO_EMAIL'
    } else if (RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'ORBEM Solutions <onboarding@resend.dev>',
          to: [recipientEmail],
          subject,
          html,
        }),
      })
      sendStatus = res.ok ? 'SENT' : 'FAILED'
      if (!res.ok) errorMessage = await res.text()
    }

    await supabase.from('notification_log').insert({
      shipment_id,
      channel: 'EMAIL',
      recipient_email: recipientEmail,
      subject,
      status_snapshot: shipment.status,
      send_status: sendStatus,
      error_message: errorMessage,
    })

    return new Response(JSON.stringify({ ok: true, sendStatus }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 })
  }
})
