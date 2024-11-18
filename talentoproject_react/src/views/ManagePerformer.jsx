import { useOutletContext } from "react-router-dom";

export default function ManagePerformer() {
    const { isSidebarOpen } = useOutletContext();

    const complaints = [
        { id: 1, text: "Complaint 1: Issue with the performance." },
        { id: 2, text: "Complaint 2: Late arrival of the performer." },
        // Add more complaints as needed
    ];

    const feedbacks = [
        { id: 1, text: "Feedback 1: Great performance, very engaging!" },
        { id: 2, text: "Feedback 2: Excellent choice of songs." },
        // Add more feedbacks as needed
    ];

    return (
        <div className="container mx-auto p-6">
            <header className="bg-gray-800 shadow w-full">
                <div className="flex justify-center items-center px-4 py-6 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        MANAGE COMPLAINS AND FEEDBACK
                    </h1>
                </div>
            </header>
            <div className="flex-1 p-4 ml-10"> 
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Recent Complaints</h2>
                    <ul className="space-y-4">
                        {complaints.map((complaint) => (
                            <li key={complaint.id} className="bg-red-100 p-4 rounded-md">
                                {complaint.text}
                            </li>
                        ))}
                    </ul>
                </section>
                <section>
                    <h2 className="text-2xl font-semibold mb-4">Recent Feedbacks</h2>
                    <ul className="space-y-4">
                        {feedbacks.map((feedback) => (
                            <li key={feedback.id} className="bg-green-100 p-4 rounded-md">
                                {feedback.text}
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    );
}
