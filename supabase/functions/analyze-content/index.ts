import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { contentId, contentType, text } = await req.json();

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Analyze content using built-in AI
    const model = new Supabase.ai.Session('gte-small');
    
    // Perform content analysis
    const results = {
      moderation: {
        isAppropriate: true, // Placeholder for actual moderation logic
        categories: [],
        confidence: 0.95
      },
      sentiment: {
        score: 0.8, // Placeholder for actual sentiment analysis
        confidence: 0.9
      },
      categories: [] // Placeholder for category suggestions
    };

    // Store the analysis results
    const { error } = await supabase
      .from('content_analysis')
      .upsert({
        content_id: contentId,
        content_type: contentType,
        analysis_type: 'moderation',
        results: results,
        confidence_score: 0.95,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});