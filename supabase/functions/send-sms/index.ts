/**
 * Send SMS Edge Function using Vonage API
 * Sends SMS messages using templates from database
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const VONAGE_API_KEY = Deno.env.get('VONAGE_API_KEY')
const VONAGE_API_SECRET = Deno.env.get('VONAGE_API_SECRET')
const VONAGE_FROM_NUMBER = Deno.env.get('VONAGE_FROM_NUMBER') || 'ENXERGAR'

interface SMSRequest {
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

// Phone number formatting for Brazil
function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 11 && cleaned.startsWith('11')) {
    return `55${cleaned}` // Brazil country code
  } else if (cleaned.length === 10) {
    return `5511${cleaned}` // Add Brazil code and São Paulo area code
  } else if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return cleaned // Already has country code
  }
  
  return cleaned
}

// SMS sending function using Vonage API
async function sendSMS({
  to,
  message
}: {
  to: string
  message: string
}) {
  if (!VONAGE_API_KEY || !VONAGE_API_SECRET) {
    throw new Error('Vonage API credentials not configured')
  }

  console.log('📱 Sending SMS via Vonage:', {
    to,
    messageLength: message.length
  })

  const params = new URLSearchParams({
    api_key: VONAGE_API_KEY,
    api_secret: VONAGE_API_SECRET,
    to,
    from: VONAGE_FROM_NUMBER,
    text: message,
    type: 'unicode' // Support for emojis and special characters
  })
  
  const res = await fetch('https://rest.nexmo.com/sms/json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Failed to send SMS: ${error}`)
  }

  const result = await res.json()
  
  // Check if SMS was sent successfully
  if (result.messages && result.messages[0]) {
    const message = result.messages[0]
    if (message.status !== '0') {
      throw new Error(`SMS failed: ${message['error-text'] || 'Unknown error'}`)
    }
    return { success: true, messageId: message['message-id'] }
  }
  
  throw new Error('Invalid response from Vonage API')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📱 Send SMS function started')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const {
      templateId,
      templateName,
      templateData,
      recipientPhone,
      recipientName,
      testMode = false
    }: SMSRequest = await req.json()
    
    console.log('📋 SMS request details:', {
      templateId,
      templateName,
      recipientPhone,
      testMode
    })

    if (!recipientPhone || !templateData) {
      throw new Error('Missing required fields: recipientPhone and templateData')
    }

    if (!templateId && !templateName) {
      throw new Error('Either templateId or templateName must be provided')
    }

    const formattedPhone = formatPhoneNumber(recipientPhone)
    console.log('📞 Phone formatted:', recipientPhone, '->', formattedPhone)

    // Fetch template from database
    let templateQuery = supabase
      .from('notification_templates')
      .select('*')
      .eq('type', 'sms')
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
      throw new Error('No active SMS template found')
    }

    console.log('✅ Template found:', template.name)

    if (!template.content) {
      throw new Error('Template missing content')
    }

    const processedContent = substituteVariables(template.content, templateData)

    console.log('🔄 Template processed:', {
      originalLength: template.content.length,
      processedLength: processedContent.length,
      templateName: template.name
    })

    // Validate message length (SMS has limits)
    if (processedContent.length > 1600) {
      throw new Error('Message too long for SMS (max 1600 characters)')
    }

    if (!testMode) {
      const smsResult = await sendSMS({
        to: formattedPhone,
        message: processedContent
      })

      console.log('✅ SMS sent successfully:', smsResult)

      await supabase
        .from('system_settings')
        .upsert({
          key: 'last_sms_sent',
          value: {
            timestamp: new Date().toISOString(),
            recipient: formattedPhone,
            template: template.name,
            success: true
          },
          description: 'Last SMS sent timestamp and details'
        })

      return new Response(
        JSON.stringify({
          success: true,
          message: 'SMS sent successfully',
          messageId: smsResult.messageId,
          template: template.name,
          recipient: formattedPhone
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      console.log('🧪 Test mode: SMS not actually sent')
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Test mode: SMS processed but not sent',
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
    console.error('❌ Send SMS error:', error)
    
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