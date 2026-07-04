import { createClient } from 'jsr:@supabase/supabase-js@2'
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY')!;
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySignature(order_id: string, status_code: string, gross_amount: string, signature: string) {
  const data = `${order_id}${status_code}${gross_amount}${MIDTRANS_SERVER_KEY}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-512', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === signature;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const payload = await req.json();
    console.log('Received Webhook Payload:', payload);

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status
    } = payload;

    // 1. Verify Signature
    const isValidSignature = await verifySignature(order_id, status_code, gross_amount, signature_key);
    
    if (!isValidSignature) {
      console.error('Invalid signature!');
      return new Response('Invalid signature', { status: 401 });
    }

    // 2. Check payment status
    // Midtrans transaction status: capture, settlement, pending, deny, cancel, expire, failure
    let paymentSuccess = false;
    
    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        paymentSuccess = true;
      }
    } else if (transaction_status === 'settlement') {
      paymentSuccess = true;
    }

    // 3. Update database if success
    if (paymentSuccess) {
      // Extract user_id from order_id (Format: SE2026-<user_id>-<timestamp>)
      const parts = order_id.split('-');
      if (parts.length >= 2) {
        const userId = parts[1];
        
        console.log(`Payment successful for user ${userId}. Updating database...`);
        
        const { error } = await supabase
          .from('users')
          .update({ is_lifetime_paid: true })
          .eq('id', userId);
          
        if (error) {
          console.error('Error updating Supabase:', error);
          throw error;
        }
      }
    }

    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
