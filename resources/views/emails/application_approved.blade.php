<!DOCTYPE html>
<html>
<head>
    <title>Application Approved</title>
    <style>
        /* Button styling */
        .button {
            display: inline-block;
            padding: 10px 20px;
            margin-top: 20px;
            font-size: 16px;
            font-weight: bold;
            color: #ffffff;
            background-color: #007bff;
            text-decoration: none;
            border-radius: 5px;
            text-align: center;
        }

        .button:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <h1>Congratulations {{ $performer['name'] }}!</h1>
    <p>Your application to join our platform has been approved. You can now log in and start using your performer account.</p>

    <a href="http://192.168.254.116:5173/login" class="button">Go to Login</a>

    <p>Thank you,<br>TEAM WORK</p>
</body>
</html>
