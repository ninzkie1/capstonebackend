import React, { useState } from "react";

export default function PendingPayment() {
  // Mock Data for demonstration
  const [payments, setPayments] = useState([
    {
      id: 1,
      client: "Ian Jeoffrey G. Casul",
      event: "Birthday",
      theme: "Pastel",
      talent: "Dancer,Singer",
      date: "2024-08-10",
      duration: "4 hours",
      rate: "$300",
      location: "Cordova, Cebu",
      paymentStatus: "Pending",
    },
    {
      id: 2,
      client: "John Doe",
      event: "Wedding",
      theme: "Rustic",
      talent: "Dancer",
      date: "2024-09-15",
      duration: "8 hours",
      rate: "$1200",
      location: "New York, NY",
      paymentStatus: "Pending",
    },
  ]);

  // Function to handle accept and decline actions
  const handleAction = (id, action) => {
    // Update the status or trigger any API actions based on the 'accept' or 'decline' action
    console.log(`Action: ${action} for Payment ID: ${id}`);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Pending Applicants</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-left">Performer</th>
              <th className="px-4 py-2 text-left">Event</th>
              <th className="px-4 py-2 text-left">Theme</th>
              <th className="px-4 py-2 text-left">Talent</th>
              <th className="px-4 py-2 text-left">Requestsed on</th>
              <th className="px-4 py-2 text-left">Availability</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b">
                <td className="border px-4 py-2">{payment.client}</td>
                <td className="border px-4 py-2">{payment.event}</td>
                <td className="border px-4 py-2">{payment.theme}</td>
                <td className="border px-4 py-2">{payment.talent}</td>
                <td className="border px-4 py-2">{payment.date}</td>
               
                <td className="border px-4 py-2">
                  <span className="bg-yellow-400 text-white py-1 px-3 rounded-full text-xs">
                    {payment.paymentStatus}
                  </span>
                </td>
                <td className="border px-4 py-2 space-x-2">
                  <button
                    onClick={() => handleAction(payment.id, "accept")}
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleAction(payment.id, "decline")}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                  >
                    Decline
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}
