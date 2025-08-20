/**
 * Send Email Edge Function
 * Sends emails using templates from database with variable substitution
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface EmailRequest {
  templateId?: string
  templateName?: string
  templateData: Record<string, string>
  recipientEmail: string
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

// Email sending function using Resend
async function sendEmail({
  to,
  subject,
  html,
  text
}: {
  to: string
  subject: string
  html: string
  text: string
}) {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured')
  }

  // Get verified domain from environment or use verified domain
  const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@enxergarsemfronteira.com.br'
  const RESEND_FROM_NAME = Deno.env.get('RESEND_FROM_NAME') || 'Enxergar sem Fronteiras'

  console.log('📧 Sending email via Resend:', {
    to: to.substring(0, 5) + '***', // Mask email for security
    subject,
    contentLength: html.length,
    from: RESEND_FROM_EMAIL
  })
  
  const emailPayload = {
    from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
    to: [to],
    subject,
    html,
    text
  }
  
  console.log('📤 Email payload prepared:', {
    from: emailPayload.from,
    to: emailPayload.to.length + ' recipients',
    hasHtml: !!emailPayload.html,
    hasText: !!emailPayload.text
  })
  
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(emailPayload),
  })

  console.log('📨 Resend response status:', res.status)

  if (!res.ok) {
    const errorText = await res.text()
    console.error('❌ Resend API error:', {
      status: res.status,
      statusText: res.statusText,
      response: errorText
    })
    
    // Log specific error for domain verification
    if (res.status === 403 && errorText.includes('domain is not verified')) {
      console.error('❌ Error sending via Resend: Domain verification required')
      console.error('🔧 Action needed: Verify domain at https://resend.com/domains')
      console.error('🔧 Current from email:', RESEND_FROM_EMAIL)
    }
    
    throw new Error(`Resend API error: ${res.status} - ${errorText}`)
  }

  const result = await res.json()
  console.log('✅ Email sent via Resend:', {
    messageId: result.id,
    from: emailPayload.from
  })
  
  return { success: true, messageId: result.id }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📧 Send Email function started')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request body
    const {
      templateId,
      templateName,
      templateData,
      recipientEmail,
      recipientName,
      testMode = false
    }: EmailRequest = await req.json()
    
    console.log('📋 Email request details:', {
      templateId,
      templateName,
      recipientEmail,
      testMode
    })

    // Validate required fields
    if (!recipientEmail || !templateData) {
      throw new Error('Missing required fields: recipientEmail and templateData')
    }

    if (!templateId && !templateName) {
      throw new Error('Either templateId or templateName must be provided')
    }

    // Fetch template from database
    let templateQuery = supabase
      .from('notification_templates')
      .select('*')
      .eq('type', 'email')
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
      throw new Error('No active email template found')
    }

    console.log('✅ Template found:', template.name)

    // Validate template has required fields
    if (!template.subject || !template.content) {
      throw new Error('Template missing subject or content')
    }

    // Substitute variables in subject and content
    const processedSubject = substituteVariables(template.subject, templateData)
    const processedContent = substituteVariables(template.content, templateData)

    console.log('🔄 Template processed:', {
      originalSubject: template.subject,
      processedSubject,
      contentLength: processedContent.length
    })

    // Convert content to HTML (basic formatting)
    const htmlContent = processedContent
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/📅|⏰|📍|🏠|⚠️|✅|❓|🔗/g, (emoji) => `<span style="font-size: 16px;">${emoji}</span>`) // Emoji styling

    // Create full HTML email
    const fullHtmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${processedSubject}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #2563eb;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            border: 1px solid #e5e7eb;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding: 20px;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
          }
          .highlight {
            background: #dbeafe;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 4px solid #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>👁️ Enxergar sem Fronteiras</h1>
        </div>
        <div class="content">
          ${htmlContent}
        </div>
        <div class="footer">
          <p>Este é um email automático do sistema Enxergar sem Fronteiras.</p>
          <p>Por favor, não responda a este email.</p>
        </div>
      </body>
      </html>
    `

    // Send email
    if (!testMode) {
      const emailResult = await sendEmail({
        to: recipientEmail,
        subject: processedSubject,
        html: fullHtmlContent,
        text: processedContent
      })

      console.log('✅ Email sent successfully:', emailResult)

      // Log the email sending activity
      await supabase
        .from('system_settings')
        .upsert({
          key: 'last_email_sent',
          value: {
            timestamp: new Date().toISOString(),
            recipient: recipientEmail,
            template: template.name,
            success: true
          },
          description: 'Last email sent timestamp and details'
        })

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email sent successfully',
          messageId: emailResult.messageId,
          template: template.name,
          recipient: recipientEmail
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      console.log('🧪 Test mode: Email not actually sent')
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Test mode: Email processed but not sent',
          template: template.name,
          recipient: recipientEmail,
          processedSubject,
          processedContent: processedContent.substring(0, 200) + '...',
          testMode: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

  } catch (error) {
    console.error('❌ Send email error:', error)
    
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