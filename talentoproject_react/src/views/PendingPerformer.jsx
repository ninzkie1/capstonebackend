import React, { useEffect, useState } from "react";
import { Modal, Box, Button } from "@mui/material";
import axiosClient from "../axiosClient";

export default function PerformerApplications() {
    const [applications, setApplications] = useState({
        pending: [],
        approved: [],
        rejected: [],
    });
    const [imagePreview, setImagePreview] = useState(null); // To store the image URL for preview
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false); // To toggle the modal

    // Fetch applications from the server
    const fetchApplications = async () => {
        try {
            const response = await axiosClient.get("/performer-applications");
            setApplications(response.data);
        } catch (error) {
            console.error("Error fetching applications:", error);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    // Approve an application
    const handleApprove = async (id) => {
        try {
            await axiosClient.put(`/performer-applications/${id}/approve`);
            fetchApplications(); // Refresh the data
        } catch (error) {
            console.error("Error approving application:", error);
        }
    };

    // Reject an application
    const handleReject = async (id) => {
        try {
            await axiosClient.put(`/performer-applications/${id}/reject`);
            fetchApplications(); // Refresh the data
        } catch (error) {
            console.error("Error rejecting application:", error);
        }
    };

    // Open the image preview modal
    const handleViewImage = (imageUrl) => {
        setImagePreview(imageUrl);
        setIsImagePreviewOpen(true);
    };

    // Close the image preview modal
    const closeImagePreview = () => {
        setImagePreview(null);
        setIsImagePreviewOpen(false);
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-center">Performer Applications</h1>

            {/* Pending Applications */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-center sm:text-left">
                    Pending Applications
                </h2>
                {applications.pending.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {applications.pending.map((app) => (
                            <div key={app.id} className="p-4 bg-white rounded shadow-md">
                                <h3 className="text-lg font-semibold">
                                    {app.name} {app.lastname}
                                </h3>
                                
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Button
                                        variant="contained"
                                        className="mr-2"
                                        onClick={() => handleViewImage(app.id_picture_url)}
                                    >
                                        View ID
                                    </Button>
                                    <Button
                                        variant="contained"
                                        className="mr-2"
                                        onClick={() => handleViewImage(app.holding_id_picture_url)}
                                    >
                                        View Holding ID
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        className="mr-2"
                                        onClick={() => handleApprove(app.id)}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        onClick={() => handleReject(app.id)}
                                    >
                                        Reject
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center">No pending applications at the moment.</p>
                )}
            </div>

            {/* Approved Applications */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-center sm:text-left">
                    Approved Applications
                </h2>
                {applications.approved.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {applications.approved.map((app) => (
                            <div key={app.id} className="p-4 bg-white rounded shadow-md">
                                <h3 className="text-lg font-semibold">
                                    {app.name} {app.lastname}
                                </h3>
                               
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Button
                                        variant="contained"
                                        onClick={() => handleViewImage(app.id_picture_url)}
                                    >
                                        View ID
                                    </Button>
                                    <Button
                                        variant="contained"
                                        className="ml-2"
                                        onClick={() => handleViewImage(app.holding_id_picture_url)}
                                    >
                                        View Holding ID
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center">No approved applications at the moment.</p>
                )}
            </div>

            {/* Rejected Applications */}
            <div>
                <h2 className="text-2xl font-semibold mb-4 text-center sm:text-left">
                    Rejected Applications
                </h2>
                {applications.rejected.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {applications.rejected.map((app) => (
                            <div key={app.id} className="p-4 bg-white rounded shadow-md">
                                <h3 className="text-lg font-semibold">
                                    {app.name} {app.lastname}
                                </h3>
                               
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Button
                                        variant="contained"
                                        onClick={() => handleViewImage(app.id_picture_url)}
                                    >
                                        View ID
                                    </Button>
                                    <Button
                                        variant="contained"
                                        className="ml-2"
                                        onClick={() => handleViewImage(app.holding_id_picture_url)}
                                    >
                                        View Holding ID
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center">No rejected applications at the moment.</p>
                )}
            </div>

            {/* Image Preview Modal */}
            <Modal open={isImagePreviewOpen} onClose={closeImagePreview}>
                <Box
                    sx={{
                        maxWidth: 300, // Limit the width for a smaller display
                        mx: "auto",
                        p: 4,
                        backgroundColor: "white",
                        borderRadius: 2,
                        textAlign: "center",
                        marginTop: 8,
                    }}
                >
                    {imagePreview && (
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-100 h-100 rounded-md object-cover mx-auto" // Small size
                        />
                    )}
                    <Button
                        variant="contained"
                        className="mt-4"
                        onClick={closeImagePreview}
                    >
                        Close
                    </Button>
                </Box>
            </Modal>
        </div>
    );
}
