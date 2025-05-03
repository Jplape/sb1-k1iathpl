import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { stripe } from "../_shared/stripe.ts";
import { createClient } from 'npm:@supabase/supabase-js';

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No signature provided');
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    );

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { adId, options } = session.metadata;
      const parsedOptions = JSON.parse(options);

      const { error } = await supabase
        .from('products')
        .update({
          featured: parsedOptions.spotlight || false,
          urgent: parsedOptions.urgent || false,
          premium_photos: parsedOptions.extraPhotos || false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', adId);

      if (error) throw error;

      // Log the payment
      await supabase.from('payments').insert({
        product_id: adId,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency,
        status: 'completed',
        stripe_session_id: session.id,
        options: parsedOptions,
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});