import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

// The authorized phone number that the bot is allowed to respond to
const AUTHORIZED_PHONE = process.env.AUTHORIZED_PHONE || '918309166629';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    const remoteJid = String(rawBody?.data?.key?.remoteJid || '');

    // 1. HARD RULE: Never reply to group chats
    if (remoteJid.endsWith('@g.us')) {
      return NextResponse.json({ status: 'ignored', reason: 'Group message ignored' });
    }

    // 2. HARD RULE: Prevent feedback loop if sent by bot/self
    if (rawBody?.data?.key?.fromMe === true) {
      return NextResponse.json({ status: 'ignored', reason: 'Outbound message from self' });
    }

    let senderPhone = '';
    let incomingText = '';

    if (remoteJid) {
      senderPhone = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
      incomingText = String(
        rawBody.data?.message?.conversation ||
        rawBody.data?.message?.extendedTextMessage?.text ||
        ''
      ).trim();
    } else if (rawBody?.From) {
      senderPhone = String(rawBody.From).replace('whatsapp:', '').replace(/\D/g, '');
      incomingText = String(rawBody.Body || '').trim();
    } else if (rawBody?.phone && rawBody?.message) {
      senderPhone = String(rawBody.phone).replace(/\D/g, '');
      incomingText = String(rawBody.message).trim();
    }

    // 3. HARD RULE: Only process messages from the authorized user
    const cleanAuthorized = AUTHORIZED_PHONE.replace(/\D/g, '');
    if (!senderPhone || (cleanAuthorized && senderPhone !== cleanAuthorized)) {
      return NextResponse.json({ status: 'ignored', reason: 'Sender not authorized' });
    }

    if (!incomingText) {
      return NextResponse.json({ status: 'ignored', reason: 'Empty text' });
    }

    const normalizedCmd = incomingText.toUpperCase().trim();
    let replyText = '';

    // 4. HARD RULE: ONLY reply if the message is an explicit known command.
    // If it's normal conversation (e.g. "hi", "ok", "call me"), DO NOT REPLY!
    if (normalizedCmd.startsWith('SAVE')) {
      replyText = `✅ *Saved to Radar!*\n\n📌 *Smart India Hackathon 2026 Internal Round*\n⏰ Reminders are active (7d, 3d, 1d & day-of alert).\n\n🔗 Apply: https://sih.gov.in`;
    } else if (normalizedCmd.startsWith('DONE')) {
      replyText = `🎉 *Congratulations! Marked as Applied!*\n\n📌 *Smart India Hackathon 2026*\nWe’ll ping you on the event morning at 8:00 AM IST!`;
    } else if (normalizedCmd.startsWith('UNSAVE') || normalizedCmd.startsWith('SKIP')) {
      replyText = `🗑 Removed event from your saved radar and cancelled upcoming alerts.`;
    } else if (normalizedCmd === 'STATUS' || normalizedCmd.startsWith('STATUS')) {
      replyText = `📋 *Your Radar Status*\n\n1. *Smart India Hackathon 2026* [⏳ 3 days left]\n2. *T-Hub AI Innovation Summit* [📅 Sep 15]\n\nNotifications: 🟢 Active (8:00 AM & 7:00 PM Briefings)`;
    } else if (normalizedCmd === 'PAUSE') {
      replyText = `⏸ *Notifications Paused*\n\nYou will not receive briefings or deadline alerts. Reply *RESUME* anytime to reactivate.`;
    } else if (normalizedCmd === 'RESUME') {
      replyText = `▶️ *Notifications Resumed!*\n\nYour morning (8:00 AM) & evening (7:00 PM) AI/PM briefings are back on.`;
    } else if (normalizedCmd.includes('SET HYDERABAD')) {
      replyText = `📍 *Preferences Updated:* Prioritizing Hyderabad campus & tech events (T-Hub, IIIT-H, MGIT).`;
    } else if (normalizedCmd.includes('SET PAN INDIA')) {
      replyText = `🇮🇳 *Preferences Updated:* Tracking India-wide hackathons and national competitions.`;
    } else if (normalizedCmd.includes('FREE ONLY')) {
      replyText = `🆓 *Preferences Updated:* Filtering only free opportunities & competitions.`;
    } else if (normalizedCmd === 'MORE' || normalizedCmd.startsWith('MORE')) {
      replyText = `✨ *More Upcoming Opportunities*\n\n1. *IIIT-H Research Open Day: NLP & Vision*\n→ Direct access to research labs for internships.\nApply: https://iiit.ac.in/events\n\n2. *Google Solution Challenge 2026*\n→ Global mentorship & Gemini API compute.\nApply: https://developers.google.com\n\nReply *SAVE 1* or *SAVE 2* to track.`;
    } else if (normalizedCmd === 'HELP' || normalizedCmd === 'COMMANDS') {
      replyText = `👋 *Basith’s Radar Commands*\n\n• *STATUS* — view your saved events & deadlines\n• *SAVE <num>* — save event from latest brief\n• *DONE <num>* — mark as applied\n• *MORE* — get more opportunities\n• *PAUSE* / *RESUME* — toggle alerts\n• *SET HYDERABAD* / *SET PAN INDIA*`;
    } else {
      // Normal conversation -> DO NOT RESPOND. Silently ignore.
      return NextResponse.json({ status: 'ignored', reason: 'Not a recognized command' });
    }

    // Send instant WhatsApp reply ONLY to the authorized user
    await sendWhatsAppMessage({
      to: senderPhone,
      body: replyText,
    });

    return NextResponse.json({ status: 'success', replied: true, replyText });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('WhatsApp Webhook error:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
