import React, { useRef, useState } from "react";
import { Modal, Button, Box, Link } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axiosClient from "../axiosClient";
import { useStateContext } from "../context/contextprovider";
import logo from "../assets/logotalentos.png";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Register() {
    const nameRef = useRef();
    const emailRef = useRef();
    const passwordRef = useRef();
    const confirmPasswordRef = useRef();
    const lastnameRef = useRef();
    const [role, setRole] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { setUser, setToken } = useStateContext();
    const navigate = useNavigate();
    const [isIdModalOpen, setIsIdModalOpen] = useState(false);
    const [idPicture, setIdPicture] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
    const [isTermsOpen, setIsTermsOpen] = useState(false);

    const handleSubmit = (ev) => {
        ev.preventDefault();

        if (passwordRef.current.value !== confirmPasswordRef.current.value) {
            setError("Passwords do not match.");
            return;
        }

        if (role === "performer") {
            setIsIdModalOpen(true);
        } else {
            registerUser();
        }
    };

    const registerUser = () => {
        const formData = new FormData();
        formData.append("name", nameRef.current.value);
        formData.append("lastname", lastnameRef.current.value);
        formData.append("email", emailRef.current.value);
        formData.append("password", passwordRef.current.value);
        formData.append("role", role);

        if (role === "performer") {
            if (idPicture) {
                formData.append("id_picture", idPicture);
            } else {
                setError("ID picture is required for performers.");
                return;
            }

            if (capturedImage) {
                formData.append("holding_id_picture", capturedImage);
            } else {
                setError("Picture of you holding the ID is required for performers.");
                return;
            }
        }

        setError(null);
        setIsLoading(true);

        axiosClient
            .post("/register", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
            .then(({ data }) => {
                setUser(data.user);
                setToken(data.token);

                if (role === "performer") {
                    toast.info(
                        "Registration successful! Please wait for admin approval. Check your email for updates.",
                        { autoClose: 5000 }
                    );
                }

                setTimeout(() => {
                    setIsLoading(false);
                    navigate(role === "performer" ? "/" : "/");
                }, 3000);
            })
            .catch((err) => {
                const response = err.response;
                if (response) {
                    setError(`Error: ${response.data.message}`);
                } else {
                    setError(`Error: ${err.message}`);
                }
                setIsLoading(false);
            });
    };

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        setIdPicture(file);
    };

    const openCamera = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.capture = "environment";
        input.onchange = (e) => {
            const file = e.target.files[0];
            setCapturedImage(file);
        };
        input.click();
    };

    const handleIdSubmit = () => {
        if (!idPicture || !capturedImage) {
            setError("Both ID picture and holding ID picture are required.");
            return;
        }
        setIsIdModalOpen(false);
        registerUser();
    };

    const openImagePreview = (image) => {
        setPreviewImage(image);
        setIsImagePreviewOpen(true);
    };

    return (
        <>
            {isLoading && (
                <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black bg-opacity-70">
                    <img
                        src={logo}
                        alt="Loading..."
                        className="w-16 h-16 animate-bounce"
                    />
                    <p className="text-orange-500 text-lg font-bold animate-pulse mt-4">
                        Processing your registration...
                    </p>
                </div>
            )}
            <ToastContainer />
            <div
                className="min-h-screen flex items-center justify-center bg-yellow-700 relative overflow-hidden"
                style={{
                    backgroundImage: "url('/confetti.png')",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                }}
            >
                <div className="absolute inset-0 bg-black opacity-50"></div>

                <main className="z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-4xl mx-auto">
                    <div className="w-full max-w-md space-y-8">
                        <div className="bg-yellow-600 py-8 px-10 shadow-2xl rounded-2xl relative">
                            <div className="flex items-center justify-center">
                                <img src={logo} alt="Logo" className="w-24 h-24 animate-bounce" />
                            </div>
                            <h2 className="text-center text-4xl font-extrabold text-white mt-4">
                                Create an Account
                            </h2>

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

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="first_name" className="block text-sm font-medium text-gray-200">
                                            First Name
                                        </label>
                                        <input
                                            ref={nameRef}
                                            id="first_name"
                                            name="first_name"
                                            type="text"
                                            required
                                            className="appearance-none rounded-md relative block w-full px-3 py-3 border border-transparent placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                                            placeholder="First Name"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="last_name" className="block text-sm font-medium text-gray-200">
                                            Last Name
                                        </label>
                                        <input
                                            ref={lastnameRef}
                                            id="last_name"
                                            name="last_name"
                                            type="text"
                                            required
                                            className="appearance-none rounded-md relative block w-full px-3 py-3 border border-transparent placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                                            placeholder="Last Name"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                                        Create Password
                                    </label>
                                    <input
                                        ref={passwordRef}
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        className="appearance-none rounded-md relative block w-full px-3 py-3 border border-transparent placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                                        placeholder="Password"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-200">
                                        Confirm Password
                                    </label>
                                    <input
                                        ref={confirmPasswordRef}
                                        id="confirm_password"
                                        name="confirm_password"
                                        type="password"
                                        required
                                        className="appearance-none rounded-md relative block w-full px-3 py-3 border border-transparent placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                                        placeholder="Confirm Password"
                                    />
                                </div>

                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        className={`flex-1 py-2 px-4 rounded-full ${role === "client" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-800"}`}
                                        onClick={() => setRole("client")}
                                    >
                                        Client
                                    </button>
                                    <button
                                        type="button"
                                        className={`flex-1 py-2 px-4 rounded-full ${role === "performer" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-800"}`}
                                        onClick={() => setRole("performer")}
                                    >
                                        Performer
                                    </button>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        id="terms"
                                        name="terms"
                                        type="checkbox"
                                        className="h-4 w-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400"
                                        required
                                    />
                                    <label htmlFor="terms" className="ml-2 block text-sm text-gray-300">
                                        I accept the <button type="button" onClick={() => setIsTermsOpen(true)} className="underline text-indigo-400 hover:text-indigo-300">Terms & Conditions</button>
                                    </label>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-gradient-to-r from-blue-500 to-blue-700 hover:from-yellow-600 hover:to-yellow-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-transform transform hover:scale-105"
                                    >
                                        Create Account
                                    </button>
                                </div>
                                <p className="mt-6 text-center text-sm text-gray-200">
                                Already have an account? {" "}
                                <a 
                                href="/login" 
                                className="login-link font-medium text-indigo-400 hover:text-indigo-300"
                                >
                                Log in now
                                </a>
                            </p>
                            </form>
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal for Terms & Conditions */}
            <Modal open={isTermsOpen} onClose={() => setIsTermsOpen(false)}>
                <Box
                    sx={{
                        maxWidth: 600,
                        mx: "auto",
                        p: 4,
                        backgroundColor: "white",
                        borderRadius: 2,
                        overflowY: "auto",
                    }}
                >
                    <h2 className="text-2xl font-bold mb-4">Terms & Conditions</h2>
                    <p className="text-gray-700 mb-4">
                        Welcome to our Online Talent Booking Platform. By creating an account, you agree to the following terms and conditions:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-gray-700">
                        <li>All users must provide accurate and complete information during registration.</li>
                        <li>Any fraudulent activities are strictly prohibited and will result in account termination.</li>
                        <li>Performers are responsible for managing their availability and bookings accurately.</li>
                        <li>Clients must respect the performers and abide by all terms set forth during booking agreements.</li>
                        <li>Payments are handled through our secure system, and disputes must be resolved through proper channels.</li>
                        <li>The platform reserves the right to modify these terms at any time.</li>
                    </ul>
                    <div className="flex justify-end mt-4">
                        <Button onClick={() => setIsTermsOpen(false)} variant="contained" color="primary">
                            Close
                        </Button>
                    </div>
                </Box>
            </Modal>

            {/* Modal for ID Upload */}
            <Modal open={isIdModalOpen} onClose={() => setIsIdModalOpen(false)}>
                <Box
                    sx={{
                        maxWidth: 600,
                        maxHeight: 600, 
                        mx: "auto",
                        p: 4,
                        backgroundColor: "white",
                        borderRadius: 2,
                        overflow: "auto", 
                    }}
                    
                >
                    <h2 className="text-2xl font-bold mb-4">ID Verification</h2>
                    <div>
                        <label className="block mb-2">Upload ID Picture:</label>
                        <input type="file" accept="image/*" onChange={handleFileInput} />
                        <Button
                            variant="contained"
                            className="mt-2"
                            onClick={() => openImagePreview(URL.createObjectURL(idPicture))}
                            disabled={!idPicture}
                        >
                            View Uploaded Image
                        </Button>
                    </div>
                    <div className="my-4">
                        <label className="block mb-2">Take Picture Holding Your ID:</label>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={openCamera}
                            className="mt-2"
                        >
                            Open Camera
                        </Button>
                        <Button
                            variant="contained"
                            className="mt-2 ml-4"
                            onClick={() => openImagePreview(URL.createObjectURL(capturedImage))}
                            disabled={!capturedImage}
                        >
                            View Captured Image
                        </Button>
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button onClick={handleIdSubmit} variant="contained" color="primary">
                            Submit
                        </Button>
                    </div>
                </Box>
            </Modal>

            {/* Image Preview Modal */}
            <Modal open={isImagePreviewOpen} onClose={() => setIsImagePreviewOpen(false)}>
                <Box
                    sx={{
                        maxWidth: 600,
                        maxHeight: 600, 
                        mx: "auto",
                        p: 4,
                        backgroundColor: "white",
                        borderRadius: 2,
                        overflow: "auto",
                    }}
                    
                >
                    {previewImage && (
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="w-full rounded-md border"
                        />
                    )}
                    <Button
                        variant="contained"
                        className="mt-4"
                        onClick={() => setIsImagePreviewOpen(false)}
                    >
                        Close
                    </Button>
                </Box>
            </Modal>
        </>
    );
}
