import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../axiosClient";
import { useStateContext } from "../context/contextprovider";
import logo from "../assets/logotalentos.png";

export default function Login() {
    const emailRef = useRef();
    const passwordRef = useRef();
    const { setUser, setToken } = useStateContext();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null); 

    const handleSubmit = (ev) => {
        ev.preventDefault();

        const payload = {
            email: emailRef.current.value,
            password: passwordRef.current.value,
        };

        axiosClient.post("/login", payload)
            .then(({ data }) => {
                setUser(data.user);
                setToken(data.token);
                console.log("Login success");

                // Reset success message when login is successful
                setSuccessMessage(null);

                if (data.user.role === 'admin') {
                    navigate('/managepost');
                } else if (data.user.role === 'client') {
                    navigate('/customer');
                } else if (data.user.role === 'performer') {
                    navigate('/post');
                }
            })
            .catch(err => {
                const response = err.response;
                if (response) {
                    setError(`Error: ${response.data.message}`);
                } else {
                    setError(`Error: ${err.message}`);
                }
            });
    };
    const handlePasswordResetSuccess = () => {
        setSuccessMessage("Password has been reset successfully!");
    };

    return (
        <>
            <div className="min-h-screen flex items-center justify-center bg-yellow-700 relative overflow-hidden" 
                style={{ backgroundImage: "url('/confetti.png')", 
                backgroundRepeat: "no-repeat", 
                backgroundPosition: "center", 
                backgroundSize: "cover" }}>
                {/* Add overlay to create contrast */}
                <div className="absolute inset-0 bg-black opacity-50"></div>
                
                <main className="z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-4xl mx-auto">
                    <div className="w-full max-w-md space-y-8">
                        <div className="bg-yellow-600 py-8 px-10 shadow-2xl rounded-2xl relative">
                            {/* Logo Section */}
                            <div className="flex items-center justify-center">
                                <img src={logo} alt="Logo" className="w-24 h-24 animate-bounce" />
                            </div>
                            <h2 className="text-center text-4xl font-extrabold text-white mt-4">Welcome Back!</h2>

                            {/* Success Message */}
                            {successMessage && (
                                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4">
                                    <span className="block sm:inline">{successMessage}</span>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4">
                                    <span className="block sm:inline">{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-200">
                                        Email address
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            ref={emailRef}
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            className="appearance-none rounded-md relative block w-full px-3 py-3 border border-transparent placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                                            placeholder="Email address"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                                        Password
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            ref={passwordRef}
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="current-password"
                                            required
                                            className="appearance-none rounded-md relative block w-full px-3 py-3 border border-transparent placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                                            placeholder="Password"
                                        />
                                    </div>
                                    <div className="text-sm text-right mt-2">
                                        <Link to="/forgotpw" className="font-medium text-indigo-700 hover:text-indigo-300">
                                            Forgot Password?
                                        </Link>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input
                                            id="remember_me"
                                            name="remember_me"
                                            type="checkbox"
                                            className="h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded"
                                        />
                                        <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-300">
                                            Remember me
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-gradient-to-r from-blue-500 to-blue-700 hover:from-yellow-600 hover:to-yellow-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-transform transform hover:scale-105"
                                    >
                                        Log In
                                    </button>
                                </div>
                            </form>
                            <p className="mt-6 text-center text-sm text-gray-200">
                                Don’t have an account?{" "}
                                <Link to="/register" className="font-medium text-indigo-900 hover:text-indigo-300">
                                    Sign up now
                                </Link>
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}