import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, first_name, email } = await req.json()
    
    // Generate order ID
    const order_id = `SE2026-${user_id}-${Date.now()}`
    
    const payload = {
      transaction_details: {
        order_id: order_id,
        gross_amount: 25000
      },
      customer_details: {
        first_name: first_name || "Petugas Sensus",
        email: email
      },
      // Mengaktifkan metode pembayaran yang diinginkan (Opsional, bisa juga diatur di Midtrans Dashboard)
      enabled_payments: ["credit_card", "mandiri_clickpay", "cimb_clicks", "bca_klikbca", "bca_klikpay", "bri_epay", "echannel", "indosat_dompetku", "mandiri_ecash", "permata_va", "bca_va", "bni_va", "other_va", "gopay", "kioson", "indomaret", "gci", "danamon_online"]
    }

    // Call Midtrans Snap API
    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(MIDTRANS_SERVER_KEY + ':')}`
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error_messages ? data.error_messages.join(', ') : 'Failed to create transaction')
    }

    return new Response(JSON.stringify({ token: data.token, redirect_url: data.redirect_url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
