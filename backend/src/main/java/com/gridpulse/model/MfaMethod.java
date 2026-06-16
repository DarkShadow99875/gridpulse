package com.gridpulse.model;

public enum MfaMethod {
    NONE,
    TOTP,     // Authenticator app (Google, Microsoft, etc.)
    EMAIL     // Code sent via email (SMTP)
}
