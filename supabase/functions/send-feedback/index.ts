import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

type FeedbackCategory = 'bug' | 'idea' | 'other';

interface SendFeedbackPayload {
  message: string;
  category: FeedbackCategory;
  displayName?: string;
  appVersion: string;
  platform: 'ios' | 'android' | 'web';
  locale: string;
}

const VALID_CATEGORIES: FeedbackCategory[] = ['bug', 'idea', 'other'];
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 2000;

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'Bug',
  idea: 'Idee',
  other: 'Overig',
};

const PLATFORM_LABELS: Record<SendFeedbackPayload['platform'], string> = {
  ios: 'iOS',
  android: 'Android',
  web: 'Web',
};

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveDisplayName(
  payload: SendFeedbackPayload,
  profileFullName: string | null | undefined,
  userMetadataFullName: string | undefined,
): string {
  const candidates = [
    payload.displayName?.trim(),
    profileFullName?.trim(),
    userMetadataFullName?.trim(),
  ];

  for (const name of candidates) {
    if (name) return name;
  }

  return '—';
}

function metadataRow(label: string, valueHtml: string): string {
  return `
    <tr>
      <td style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #71717a; vertical-align: top; width: 120px;">
        ${escapeHtml(label)}
      </td>
      <td style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #171717; vertical-align: top;">
        ${valueHtml}
      </td>
    </tr>
  `;
}

function buildEmailHtml(
  payload: SendFeedbackPayload,
  userId: string,
  userEmail: string,
  displayName: string,
): string {
  const message = escapeHtml(payload.message.trim());
  const categoryLabel = CATEGORY_LABELS[payload.category];
  const platformLabel = PLATFORM_LABELS[payload.platform];
  const safeDisplayName = escapeHtml(displayName);
  const safeUserEmail = escapeHtml(userEmail);
  const mailtoLink = `<a href="mailto:${safeUserEmail}" style="color: #4d7c59; text-decoration: underline;">${safeUserEmail}</a>`;

  return `<!DOCTYPE html>
<html lang="nl" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <title>Feedback — Faith Generation</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .content-padding { padding-left: 24px !important; padding-right: 24px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <div style="display: none; font-size: 1px; color: #f4f4f5; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">
    Nieuwe feedback (${categoryLabel}) van ${safeDisplayName !== '—' ? safeDisplayName : safeUserEmail}
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; width: 100%;">

          <tr>
            <td style="background-color: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background-color: #4d7c59; height: 4px; font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>
                <tr>
                  <td class="content-padding" style="padding: 40px 48px 32px 48px;">

                    <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #4d7c59;">
                      ${escapeHtml(categoryLabel)}
                    </p>

                    <h1 style="margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 600; line-height: 1.3; color: #171717; letter-spacing: -0.02em;">
                      Nieuwe feedback
                    </h1>

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fafafa; border-radius: 12px; border: 1px solid #e4e4e7; margin-bottom: 28px;">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; line-height: 1.5; color: #171717;">
                            Bericht
                          </p>
                          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #52525b; white-space: pre-wrap;">${message}</p>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; line-height: 1.5; color: #171717;">
                      Van gebruiker
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 28px;">
                      ${metadataRow('Naam', safeDisplayName)}
                      ${metadataRow('E-mail', mailtoLink)}
                    </table>

                    <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; line-height: 1.5; color: #171717;">
                      Technisch
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      ${metadataRow('App-versie', escapeHtml(payload.appVersion))}
                      ${metadataRow('Platform', escapeHtml(platformLabel))}
                      ${metadataRow('Taal', escapeHtml(payload.locale))}
                      ${metadataRow('User ID', escapeHtml(userId))}
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" class="content-padding" style="padding: 32px 48px 0 48px;">
              <p style="margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #a1a1aa;">
                Faith Generation — Bijbelschool app
              </p>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #a1a1aa;">
                Antwoord op deze e-mail gaat rechtstreeks naar de gebruiker.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: { Authorization: authHeader },
      },
    },
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonResponse({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
  }

  const userEmail = user.email?.trim();
  if (!userEmail) {
    return jsonResponse(
      { error: 'Authenticated user has no email', code: 'VALIDATION_ERROR' },
      400,
    );
  }

  let payload: SendFeedbackPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(
      { error: 'Invalid request body', code: 'VALIDATION_ERROR' },
      400,
    );
  }

  const trimmedMessage = (payload.message ?? '').trim();
  if (
    trimmedMessage.length < MIN_MESSAGE_LENGTH ||
    trimmedMessage.length > MAX_MESSAGE_LENGTH
  ) {
    return jsonResponse(
      {
        error: 'Message must be between 10 and 2000 characters',
        code: 'VALIDATION_ERROR',
      },
      400,
    );
  }

  if (!VALID_CATEGORIES.includes(payload.category)) {
    return jsonResponse({ error: 'Invalid category', code: 'VALIDATION_ERROR' }, 400);
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const senderEmail = Deno.env.get('RESEND_SENDER_EMAIL');
  const feedbackToEmail = Deno.env.get('FEEDBACK_TO_EMAIL');

  if (!resendApiKey || !senderEmail || !feedbackToEmail) {
    return jsonResponse(
      { error: 'Email service not configured', code: 'RESEND_ERROR' },
      502,
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  const metadataFullName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : undefined;

  const displayName = resolveDisplayName(payload, profile?.full_name, metadataFullName);
  const categoryLabel = CATEGORY_LABELS[payload.category];
  const subject = `[Faith Generation Feedback] ${categoryLabel} — ${displayName !== '—' ? displayName : userEmail}`;
  const html = buildEmailHtml(payload, user.id, userEmail, displayName);

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: senderEmail,
      to: feedbackToEmail,
      reply_to: userEmail,
      subject,
      html,
    }),
  });

  if (!resendResponse.ok) {
    return jsonResponse(
      { error: 'Failed to send feedback email', code: 'RESEND_ERROR' },
      502,
    );
  }

  return jsonResponse({ ok: true }, 200);
});
