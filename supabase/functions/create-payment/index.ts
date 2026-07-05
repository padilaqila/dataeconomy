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
    
    // Generate order ID (Midtrans limit: max 50 characters)
    // UUID (36 chars) + Date.now() (13 chars) + prefix (7 chars) = 56 chars (Terlalu panjang!)
    // Solusi: Ambil 8 karakter pertama dari UUID saja
    const shortUserId = user_id ? String(user_id).substring(0, 8) : 'guest';
    const order_id = `SE26-${shortUserId}-${Date.now()}`
    
    const payload = {
      transaction_details: {
        order_id: order_id,
        gross_amount: 20000
      },
      customer_details: {
        first_name: first_name || "Petugas Sensus",
        email: email
      },
      // Menggunakan custom_field1 untuk menyimpan full UUID
      custom_field1: user_id
    }

    // Call Midtrans Snap API
    const isProd = !MIDTRANS_SERVER_KEY.startsWith('SB-');
    const midtransUrl = isProd
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const response = await fetch(midtransUrl, {
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
      console.error('Midtrans API Error Response:', data);
      throw new Error(data.error_messages ? data.error_messages.join(', ') : 'Failed to create transaction')
    }

    console.log('Midtrans transaction created:', data.token);

    return new Response(JSON.stringify({ token: data.token, redirect_url: data.redirect_url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Edge Function Catch Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
