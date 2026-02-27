import { Resend } from 'resend';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { ProUpgradeEmail } from '@/emails/ProUpgradeEmail';
import { OTPEmail } from '@/emails/OTPEmail';

// Ensure RESEND_API_KEY is available
const resend = new Resend(process.env.RESEND_API_KEY);

// Use a verified domain email in production, otherwise emails might only go to your registered Resend email during testing
const FROM_EMAIL = 'Zukkoo.uz <onboarding@resend.dev>';

export const sendWelcomeEmail = async (email: string, name: string) => {
    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: "Zukkoo.uz elektron majmuasiga xush kelibsiz! 🎉",
            react: WelcomeEmail({ name }),
        });

        if (error) {
            console.error('Resend Welcome Email Error:', error);
        }
        return data;
    } catch (error) {
        console.error('Failed to send welcome email:', error);
    }
};

export const sendProUpgradeEmail = async (email: string, name: string) => {
    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: "Siz endi Zukkoo PRO a'zosisiz! 👑",
            react: ProUpgradeEmail({ name }),
        });

        if (error) {
            console.error('Resend PRO Upgrade Email Error:', error);
        }
        return data;
    } catch (error) {
        console.error('Failed to send PRO upgrade email:', error);
    }
};

export const sendOTPEmail = async (email: string, otp: string) => {
    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `Tasdiqlash kodi: ${otp}`,
            react: OTPEmail({ otp }),
        });

        if (error) {
            console.error('Resend OTP Email Error:', error);
            return { success: false, error };
        }
        return { success: true, data };
    } catch (error) {
        console.error('Failed to send OTP email:', error);
        return { success: false, error };
    }
};
