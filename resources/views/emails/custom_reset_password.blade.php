<!DOCTYPE html>
<html>
<head>
    <title>Reset Your Password</title>
</head>
<body>
    <h1>Hello, {{ $name }}</h1>
    <p>You are receiving this email because we received a password reset request for your account.</p>
    <p>
        <a href="{{ $url }}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Reset Password
        </a>
    </p>
    <p>This password reset link will expire in 60 minutes.</p>
    <p>If you did not request a password reset, no further action is required.</p>
    <p>Best Regards,</p>
    <p>The Talento Team</p>
</body>
</html>
