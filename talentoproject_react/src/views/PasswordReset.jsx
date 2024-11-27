import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { Button, TextField, CircularProgress, Typography, Box } from "@mui/material";

export default function PasswordReset() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Validate if the token and email are present
    useEffect(() => {
        if (!token || !email) {
            setError("Invalid or expired token. Please request a new reset link.");
        }
    }, [token, email]);

    // Handle password reset form submission
    const handleSubmit = (e) => {
        e.preventDefault();

        setIsLoading(true);
        setError(null); // Reset error message before attempting reset

        axios
            .post("http://192.168.1.23:8000/api/reset-password", {
                token,
                email,
                password,
                password_confirmation: passwordConfirmation,
            })
            .then((response) => {
                setMessage(response.data.message);
                setError(null);
                setIsLoading(false);
            })
            .catch((err) => {
                setError(err.response?.data?.message || "An error occurred.");
                setMessage(null);
                setIsLoading(false);
            });
    };

    return (
        <Box
            className="min-h-screen flex items-center justify-center bg-gradient-to-r from-yellow-400 to-orange-500"
            p={4}
        >
            <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
                <Typography
                    variant="h4"
                    gutterBottom
                    className="text-center font-semibold"
                >
                    Reset Your Password
                </Typography>
                <Typography
                 variant="h6"
                 gutterBottom
                 className="text-center font-semibold">
                Changing password for {email}!
                </Typography>

                {isLoading && (
                    <div className="flex justify-center mb-4">
                        <CircularProgress />
                    </div>
                )}

                {message && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-md">
                        <Typography>{message}</Typography>
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md">
                        <Typography>{error}</Typography>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Password fields */}
                    <div className="mb-4">
                        <TextField
                            label="New Password"
                            variant="outlined"
                            type="password"
                            fullWidth
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <TextField
                            label="Confirm Password"
                            variant="outlined"
                            type="password"
                            fullWidth
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                        disabled={isLoading}
                    >
                        Reset Password
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <Typography variant="body2" color="textSecondary">
                        Remembered your password?{" "}
                        <a href="/login" className="text-indigo-600 hover:text-indigo-800">
                            Login here
                        </a>
                    </Typography>
                </div>
            </div>
        </Box>
    );
}
