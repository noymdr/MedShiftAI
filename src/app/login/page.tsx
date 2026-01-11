"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkEmailWhitelist } from "@/app/actions";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [magicLinkSent, setMagicLinkSent] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    const handleAction = async (provider: 'google' | 'email') => {
        // 1. Google Login: Independent of email input
        if (provider === 'google') {
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                },
            });
            return;
        }

        // 2. Email Magic Link: Strict checks
        if (!email) {
            setErrorMessage("Please enter your email address first.");
            setStatus('invalid');
            return;
        }

        // Check Whitelist (Fast Feedback for Magic Link)
        setStatus('checking');
        setErrorMessage("");

        const { allowed, error } = await checkEmailWhitelist(email);

        if (!allowed) {
            setStatus('invalid');
            setErrorMessage(error || "Access Denied: Email not authorized.");
            return;
        }
        setStatus('valid');

        // Send OTP
        setIsSubmitting(true);
        const { error: otpError } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            },
        });

        if (otpError) {
            setErrorMessage(otpError.message);
            setStatus('invalid');
        } else {
            setMagicLinkSent(true);
        }
        setIsSubmitting(false);
    };

    if (magicLinkSent) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '24px', padding: '16px' }}>
                <div className="card" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px', padding: '32px', textAlign: 'center' }}>
                    <h2 style={{ color: 'var(--primary)' }}>Check your email</h2>
                    <p>We sent a magic link to <strong>{email}</strong>.</p>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setMagicLinkSent(false)}
                        style={{ marginTop: '16px' }}
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '24px', padding: '16px' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px', padding: '32px' }}>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ color: 'var(--primary)', marginBottom: '8px' }}>MedShift</h1>
                    <p className="text-secondary">Sign in to manage your availability</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Hospital Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (status === 'invalid') setStatus('idle');
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAction('email');
                            }}
                            placeholder="dr.smith@hospital.com"
                            required
                            style={{
                                width: '100%',
                                height: '48px',
                                padding: '0 16px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                fontSize: '1rem',
                                borderColor: status === 'invalid' ? 'var(--error)' : 'var(--border)'
                            }}
                        />
                        {status === 'invalid' && (
                            <div className="animate-enter" style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '8px', padding: '8px', background: 'var(--error-bg)', borderRadius: '8px' }}>
                                {errorMessage}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => handleAction('email')}
                        disabled={isSubmitting || status === 'checking'}
                        className="btn btn-primary" // Swapped to primary or similar consistent style? Used 'ghost' before. Let's make it primary/secondary consistent.
                        style={{
                            width: '100%',
                            justifyContent: 'center',
                            background: 'var(--primary)',
                            color: 'white',
                            height: '48px',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            opacity: (isSubmitting || status === 'checking') ? 0.7 : 1
                        }}
                    >
                        {isSubmitting ? 'Sending...' : 'Send Magic Link'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-muted)' }}>
                        <div style={{ height: '1px', flex: 1, background: 'var(--border)' }}></div>
                        <span style={{ fontSize: '0.875rem' }}>OR</span>
                        <div style={{ height: '1px', flex: 1, background: 'var(--border)' }}></div>
                    </div>

                    <button
                        onClick={() => handleAction('google')}
                        className="btn btn-secondary"
                        style={{ width: '100%', justifyContent: 'center', gap: '12px' }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.2 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 4.63c1.69 0 3.26.58 4.54 1.76l3.4-3.4C17.46.95 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>
                </div>
            </div>
        </div>
    );
}
