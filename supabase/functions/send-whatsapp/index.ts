/**
 * Send WhatsApp Edge Function
 * Sends WhatsApp messages using templates from database with variable substitution
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const WHATSAPP_API_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN')
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

interface WhatsAppRequest {
  templateId?: string
  templateName?: string
  templateData: Record<string, string>
  recipientPhone: string
  recipientName: string
  testMode?: boolean
}

// Variable substitution function
function substituteVariables(content: string, data: Record<string, string>): string {
  return content.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
    const key = variable.trim()
    return data[key] !== undefined ? data[key] : match
  })
}

// Phone number formatting function
function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Add country code if not present
  if (cleaned.length === 11 && cleaned.startsWith('11')) {
    return `55${cleaned}` // Brazil country code
  } else if (cleaned.length === 10) {
    return `5511${cleaned}` // Add Brazil code and São Paulo area code
  } else if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return cleaned // Already has country code
  }
  
  return cleaned
}

// WhatsApp sending function using Meta WhatsApp Business API
async function sendWhatsApp({
  to,
  message
}: {
  to: string
  message: string
}) {
  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error('WhatsApp API credentials not configured')
  }

  console.log('📱 Sending WhatsApp via Meta API:', {
    to,
    messageLength: message.length
  })
  
  const res = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        body: message
      }
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Failed to send WhatsApp: ${error}`)
  }

  const result = await res.json()
  return { success: true, messageId: result.messages?.[0]?.id || 'unknown' }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📱 Send WhatsApp function started')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request body
    const {
      templateId,
      templateName,
      templateData,
      recipientPhone,
      recipientName,
      testMode = false
    }: WhatsAppRequest = await req.json()
    
    console.log('📋 WhatsApp request details:', {
      templateId,
      templateName,
      recipientPhone,
      testMode
    })

    // Validate required fields
    if (!recipientPhone || !templateData) {
      throw new Error('Missing required fields: recipientPhone and templateData')
    }

    if (!templateId && !templateName) {
      throw new Error('Either templateId or templateName must be provided')
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(recipientPhone)
    console.log('📞 Phone formatted:', recipientPhone, '->', formattedPhone)

    // Fetch template from database
    let templateQuery = supabase
      .from('notification_templates')
      .select('*')
      .eq('type', 'whatsapp')
      .eq('is_active', true)

    if (templateId) {
      templateQuery = templateQuery.eq('id', templateId)
    } else if (templateName) {
      templateQuery = templateQuery.eq('name', templateName)
    }

    const { data: template, error: templateError } = await templateQuery.single()

    if (templateError) {
      console.error('❌ Template fetch error:', templateError)
      throw new Error(`Template not found: ${templateError.message}`)
    }

    if (!template) {
      throw new Error('No active WhatsApp template found')
    }

    console.log('✅ Template found:', template.name)

    // Validate template has content
    if (!template.content) {
      throw new Error('Template missing content')
    }

    // Substitute variables in content
    const processedContent = substituteVariables(template.content, templateData)

    console.log('🔄 Template processed:', {
      originalLength: template.content.length,
      processedLength: processedContent.length,
      templateName: template.name
    })

    // Validate message length (WhatsApp has limits)
    if (processedContent.length > 4096) {
      throw new Error('Message too long for WhatsApp (max 4096 characters)')
    }

    // Send WhatsApp message
    if (!testMode) {
      const whatsappResult = await sendWhatsApp({
        to: formattedPhone,
        message: processedContent
      })

      console.log('✅ WhatsApp sent successfully:', whatsappResult)

      // Log the WhatsApp sending activity
      await supabase
        .from('system_settings')
        .upsert({
          key: 'last_whatsapp_sent',
          value: {
            timestamp: new Date().toISOString(),
            recipient: formattedPhone,
            template: template.name,
            success: true
          },
          description: 'Last WhatsApp sent timestamp and details'
        })

      return new Response(
        JSON.stringify({
          success: true,
          message: 'WhatsApp sent successfully',
          messageId: whatsappResult.messageId,
          template: template.name,
          recipient: formattedPhone
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      console.log('🧪 Test mode: WhatsApp not actually sent')
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Test mode: WhatsApp processed but not sent',
          template: template.name,
          recipient: formattedPhone,
          processedContent: processedContent.substring(0, 200) + '...',
          messageLength: processedContent.length,
          testMode: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

  } catch (error) {
    console.error('❌ Send WhatsApp error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})