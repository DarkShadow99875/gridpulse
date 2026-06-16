package com.gridpulse.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import com.warrenstrange.googleauth.GoogleAuthenticatorQRGenerator;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

@Service
public class MfaService {

    private final GoogleAuthenticator googleAuthenticator = new GoogleAuthenticator();

    /**
     * Generates a new TOTP credentials (secret + key object)
     */
    public GoogleAuthenticatorKey generateTotpCredentials() {
        return googleAuthenticator.createCredentials();
    }

    /**
     * Generates a QR code image (as Base64 PNG) for TOTP setup
     */
    public String generateQrCode(String email, GoogleAuthenticatorKey credentials, String issuer) 
            throws WriterException, IOException {
        
        String otpAuthUrl = GoogleAuthenticatorQRGenerator.getOtpAuthTotpURL(issuer, email, credentials);

        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix bitMatrix = writer.encode(otpAuthUrl, BarcodeFormat.QR_CODE, 300, 300);

        ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
        byte[] pngData = pngOutputStream.toByteArray();

        return Base64.getEncoder().encodeToString(pngData);
    }

    /**
     * Verifies a TOTP code against the user's secret
     */
    public boolean verifyCode(String secret, int code) {
        return googleAuthenticator.authorize(secret, code);
    }

    /**
     * Generates a 6-digit code for Email MFA (simple version)
     */
    public String generateEmailCode() {
        int code = (int) (Math.random() * 900000) + 100000;
        return String.valueOf(code);
    }
}
