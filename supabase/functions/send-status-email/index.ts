import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const TEMPLATES: Record<string, (s: any) => { subject: string; html: string }> = {
  PENDING_DOCUMENTS: (s) => ({
    subject: `Shipment ${s.awb_number} Registered — Documents Pending`,
    html: `<p>Hi ${s.customer_name},</p><p>Your shipment <b>${s.awb_number}</b> (${s.origin_airport} → ${s.destination_airport}) has been registered with ORBEM Solutions. We are awaiting required documents before it can proceed.</p>`,
  }),
  READY_FOR_HANDOVER: (s) => ({
    subject: `Shipment ${s.awb_number} — Ready for Airline Handover`,
    html: `<p>Hi ${s.customer_name},</p><p>All documents for shipment <b>${s.awb_number}</b> have been verified and approved. Your cargo is ready for airline handover.</p>`,
  }),
  ON_HOLD: (s) => ({
    subject: `Action Needed: Shipment ${s.awb_number} On Hold`,
    html: `<p>Hi ${s.customer_name},</p><p>Shipment <b>${s.awb_number}</b> has been placed on hold. Reason: ${s.hold_reason ?? 'See document checklist for details'}. Please resubmit the corrected document.</p>`,
  }),
  COMPLETED: (s) => ({
    subject: `Shipment ${s.awb_number} Completed`,
    html: `<p>Hi ${s.customer_name},</p><p>Shipment <b>${s.awb_number}</b> has been marked completed. Thank you for shipping with ORBEM Solutions.</p>`,
  }),
  CANCELLED: (s) => ({
    subject: `Shipment ${s.awb_number} Cancelled`,
    html: `<p>Hi ${s.customer_name},</p><p>Shipment <b>${s.awb_number}</b> has been cancelled. Contact our operations team with any questions.</p>`,
  }),
}

Deno.serve(async (req) => {
  try {
    const { shipment_id } = await req.json()

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
    const buildTemplate = TEMPLATES[shipment.status] ?? TEMPLATES.PENDING_DOCUMENTS
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
