import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { stripe } from "../_shared/stripe.ts";
import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planId, userId } = await req.json();

    // Vérifier que l'utilisateur existe et est vérifié
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('kyc_status')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;
    if (profile.kyc_status !== 'verified') {
      throw new Error('KYC verification required');
    }

    // Créer ou récupérer le client Stripe
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      const { data: user } = await supabase.auth.admin.getUserById(userId);
      if (!user.user) throw new Error('User not found');

      const customer = await stripe.customers.create({
        email: user.user.email,
        metadata: {
          userId,
        },
      });
      customerId = customer.id;
    }

    // Créer la session de paiement
    const priceId = planId === 'pro-monthly'
      ? Deno.env.get('STRIPE_PRICE_MONTHLY')
      : Deno.env.get('STRIPE_PRICE_YEARLY');

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/pro/dashboard?success=true`,
      cancel_url: `${req.headers.get('origin')}/pro/subscription?canceled=true`,
      subscription_data: {
        metadata: {
          userId,
        },
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
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