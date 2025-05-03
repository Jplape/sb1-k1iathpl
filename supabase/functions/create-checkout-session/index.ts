import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { stripe } from "../_shared/stripe.ts";
import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { adId, options, price } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: ad, error } = await supabase
      .from('products')
      .select('title, seller_id')
      .eq('id', adId)
      .single();

    if (error || !ad) {
      throw new Error('Ad not found');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Options pour: ${ad.title}`,
              description: Object.entries(options)
                .filter(([_, value]) => value)
                .map(([key]) => {
                  switch (key) {
                    case 'spotlight': return 'Mise en avant';
                    case 'urgent': return 'Tag Urgent';
                    case 'extraPhotos': return 'Photos supplémentaires';
                    default: return '';
                  }
                })
                .join(', '),
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/ads/${adId}?success=true`,
      cancel_url: `${req.headers.get('origin')}/ads/${adId}/options?canceled=true`,
      metadata: {
        adId,
        options: JSON.stringify(options),
      },
    });

    return new Response(
      JSON.stringify({ id: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});