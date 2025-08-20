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
  
  console.log('📞 Phone formatting:', {
    original: phone,
    cleaned: cleaned,
    length: cleaned.length
  })
  
  // Already has country code (55)
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    console.log('📞 Phone already has country code')
    return cleaned
  }
  
  // Brazilian mobile number (11 digits) - add country code
  if (cleaned.length === 11) {
    const formatted = `55${cleaned}`
    console.log('📞 Added country code to 11-digit number:', formatted)
    return formatted
  }
  
  // Brazilian landline (10 digits) - add country code
  if (cleaned.length === 10) {
    const formatted = `55${cleaned}`
    console.log('📞 Added country code to 10-digit number:', formatted)
    return formatted
  }
  
  // International format already
  if (cleaned.length > 13) {
    console.log('📞 Using number as-is (international format)')
    return cleaned
  }
  
  // Invalid format - log warning but try anyway
  console.warn('⚠️ Invalid phone number format:', {
    original: phone,
    cleaned: cleaned,
    length: cleaned.length
  })
  
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

  console.log('📱 Sending sms via Vonage to:', to.substring(0, 6) + '****')
  console.log('📤 Sending REAL SMS via Vonage...')

  const params = new URLSearchParams({
    api_key: VONAGE_API_KEY,
    api_secret: VONAGE_API_SECRET,
    to,
    from: VONAGE_FROM_NUMBER,
    text: message,
    type: 'unicode' // Support for emojis and special characters
  })
  
  console.log('🔧 SMS Parameters:', {
    to: to.substring(0, 6) + '****',
    from: VONAGE_FROM_NUMBER,
    messageLength: message.length,
    type: 'unicode',
    hasCredentials: !!(VONAGE_API_KEY && VONAGE_API_SECRET)
  })
  
  const res = await fetch('https://rest.nexmo.com/sms/json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
  })

  console.log('📨 Vonage API response status:', res.status)

  if (!res.ok) {
    const error = await res.text()
    console.error('❌ Vonage API error:', {
      status: res.status,
      statusText: res.statusText,
      response: error
    })
    throw new Error(`Vonage API error: ${res.status} - ${error}`)
  }

  const result = await res.json()
  console.log('📨 Vonage response received:', {
    success: true,
    messageId: result.messages?.[0]?.['message-id'],
    status: result.messages?.[0]?.status,
    errorText: result.messages?.[0]?.['error-text'],
    remainingBalance: result.messages?.[0]?.['remaining-balance'],
    messagePrice: result.messages?.[0]?.['message-price'],
    network: result.messages?.[0]?.network,
    error: undefined
  })
  
  // Check if SMS was sent successfully
  if (result.messages && result.messages[0]) {
    const messageData = result.messages[0]
    
    // Log detailed status information
    console.log('📊 SMS Status Details:', {
      messageId: messageData['message-id'],
      status: messageData.status,
      statusText: getStatusText(messageData.status),
      errorText: messageData['error-text'],
      remainingBalance: messageData['remaining-balance'],
      messagePrice: messageData['message-price'],
      network: messageData.network,
      to: to.substring(0, 6) + '****'
    })
    
    if (messageData.status !== '0') {
      const errorText = messageData['error-text'] || getStatusText(messageData.status) || 'Unknown error'
      console.error('❌ SMS failed with status:', messageData.status, '-', errorText)
      throw new Error(`SMS failed (status ${messageData.status}): ${errorText}`)
    }
    
    console.log('✅ SMS sent successfully to:', to.substring(0, 6) + '****')
    return { 
      success: true, 
      messageId: messageData['message-id'],
      status: messageData.status,
      remainingBalance: messageData['remaining-balance'],
      messagePrice: messageData['message-price']
    }
  }
  
  console.error('❌ Invalid response from Vonage API:', result)
  throw new Error('Invalid response from Vonage API')
}

// Helper function to get status text
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    '0': 'Success',
    '1': 'Throttled',
    '2': 'Missing params',
    '3': 'Invalid params',
    '4': 'Invalid credentials',
    '5': 'Internal error',
    '6': 'Invalid message',
    '7': 'Number barred',
    '8': 'Partner account barred',
    '9': 'Partner quota violation',
    '10': 'Account not enabled for REST',
    '11': 'Message too long',
    '12': 'Communication failed',
    '13': 'Invalid signature',
    '14': 'Invalid sender address',
    '15': 'Invalid TTL',
    '22': 'Invalid network code',
    '23': 'Invalid callback URL',
    '29': 'Non-Whitelisted Destination'
  }
  return statusMap[status] || `Unknown status: ${status}`
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

    const formattedPhone = formatPhoneNumber(recipientPhone)
    console.log('📞 Phone formatted and validated:', formattedPhone.substring(0, 6) + '****')

    let processedContent: string

    // Check if it's manual message mode (custom_message in templateData)
    if (templateData.custom_message && templateName === 'teste_manual') {
      console.log('📝 Manual message mode detected')
      processedContent = templateData.custom_message
      console.log('📝 Using custom message from templateData')
    } else {
      // Template mode - fetch from database
      if (!templateId && !templateName) {
        throw new Error('Either templateId or templateName must be provided')
      }

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

      processedContent = substituteVariables(template.content, templateData)
    }

    console.log('🔄 Content processed:', {
      processedLength: processedContent.length,
      testMode: testMode,
      preview: processedContent.substring(0, 50)
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