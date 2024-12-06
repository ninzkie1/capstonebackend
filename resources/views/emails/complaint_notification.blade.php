<!DOCTYPE html>
<html>
<head>
    <title>Complaint Received</title>
</head>
<body>
    <h3>Dear {{ $complaint->user->name }},</h3>
    <p>We have received your complaint titled "{{ $complaint->title }}".</p>
    <p>Our support team will review your complaint and contact you via email as soon as possible.</p>
    <p>Thank you for your patience.</p>
    <br>
    <p>Regards,</p>
    <p>{{ config('app.name') }} Support Team</p>
</body>
</html>
