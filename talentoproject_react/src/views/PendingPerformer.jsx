import React, { useEffect, useState } from "react";
import axiosClient from "../axiosClient";

export default function PerformerApplications() {
    const [applications, setApplications] = useState({
        pending: [],
        approved: [],
        rejected: []
    });

    const fetchApplications = async () => {
        try {
            const response = await axiosClient.get('/performer-applications');
            setApplications(response.data);
        } catch (error) {
            console.error('Error fetching applications:', error);
        }
    };

    useEffect(() => {
        // Fetch all applications once when component loads
        fetchApplications();
    }, []);

    const handleApprove = async (id) => {
        try {
            await axiosClient.put(`/performer-applications/${id}/approve`);
            // Refresh the applications after approving
            fetchApplications();
        } catch (error) {
            console.error('Error approving application:', error);
        }
    };

    const handleReject = async (id) => {
        try {
            await axiosClient.put(`/performer-applications/${id}/reject`);
            // Refresh the applications after rejecting
            fetchApplications();
        } catch (error) {
            console.error('Error rejecting application:', error);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Performer Applications</h1>

            {/* Pending Applications */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Pending Applications</h2>
                {applications.pending.length > 0 ? (
                    <div className="grid gap-4">
                        {applications.pending.map((app) => (
                            <div key={app.id} className="p-4 bg-white rounded shadow-md">
                                <h3 className="text-lg font-semibold">{app.name} {app.lastname}</h3>
                                <p><strong>Talent:</strong> {app.talent_name}</p>
                                <p><strong>Location:</strong> {app.location}</p>
                                <div className="mt-4">
                                    <button
                                        onClick={() => handleApprove(app.id)}
                                        className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(app.id)}
                                        className="bg-red-500 text-white px-4 py-2 rounded"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No pending applications at the moment.</p>
                )}
            </div>

            {/* Approved Applications */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Approved Applications</h2>
                {applications.approved.length > 0 ? (
                    <div className="grid gap-4">
                        {applications.approved.map((app) => (
                            <div key={app.id} className="p-4 bg-white rounded shadow-md">
                                <h3 className="text-lg font-semibold">{app.name} {app.lastname}</h3>
                                <p><strong>Talent:</strong> {app.talent_name}</p>
                                <p><strong>Location:</strong> {app.location}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No approved applications at the moment.</p>
                )}
            </div>

            {/* Rejected Applications */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">Rejected Applications</h2>
                {applications.rejected.length > 0 ? (
                    <div className="grid gap-4">
                        {applications.rejected.map((app) => (
                            <div key={app.id} className="p-4 bg-white rounded shadow-md">
                                <h3 className="text-lg font-semibold">{app.name} {app.lastname}</h3>
                                <p><strong>Talent:</strong> {app.talent_name}</p>
                                <p><strong>Location:</strong> {app.location}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No rejected applications at the moment.</p>
                )}
            </div>
        </div>
    );
}
