import React, { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; // Import calendar styles
import '../index.css';
import { useOutletContext } from "react-router-dom";

// Mock data for booking requests
const mockBookings = [
  {
    id: 1,
    client: "John Tumulak",
    eventName: "Wedding Ceremony",
    eventDate: "2024-10-15",
    location: "New York, NY",
    description: "A beautiful wedding ceremony at Central Park.",
    status: "Pending",
  },
  {
    id: 2,
    client: "Kris Justin Oporto",
    eventName: "Corporate Gala",
    eventDate: "2024-11-05",
    location: "Los Angeles, CA",
    description: "A high-profile corporate gala in Los Angeles.",
    status: "Pending",
  },
  {
    id: 3,
    client: "James Garthcliff Albejos",
    eventName: "Charity Concert",
    eventDate: "2024-12-12",
    location: "Chicago, IL",
    description: "A charity concert to raise funds for local NGOs.",
    status: "Accepted",
  },
  {
    id: 4,
    client: "Ian Jeoffrey G. Casul",
    eventName: "Birthday",
    eventDate: "2024-08-10",
    location: "Cordova, Cebu",
    description: "ALAWABALU",
    status: "Done",
  },
  {
    id: 5,
    client: "Alex Johnson",
    eventName: "Anniversary Celebration",
    eventDate: "2024-09-25",
    location: "San Francisco, CA",
    description: "A lovely anniversary celebration.",
    status: "Rejected",
  },
];

export default function ManageBooking() {
  const [bookings, setBookings] = useState(mockBookings);
  const [selectedBooking, setSelectedBooking] = useState(null); // To track selected booking for details
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Dialog open state
  const { isSidebarOpen } = useOutletContext(); 

  // Open the dialog with full details of the selected booking
  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setIsDialogOpen(true);
  };

  // Close the dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  // Booking history (bookings marked as 'Done')
  const bookingHistory = bookings.filter(
    (booking) => booking.status === "Done"
  );

  // Rejected bookings
  const rejectedBookings = bookings.filter(
    (booking) => booking.status === "Rejected"
  );

  // Convert the accepted booking dates to Date objects for Calendar
  const acceptedDates = bookings
    .filter((booking) => booking.status === "Accepted")
    .map((booking) => new Date(booking.eventDate));

  // Highlight the dates in the calendar for accepted bookings
  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      // Check if the date matches an accepted booking
      if (acceptedDates.some((acceptedDate) => isSameDay(acceptedDate, date))) {
        return "accepted-booking"; // Mark red for accepted bookings
      }
    }
    return null; // Leave other dates unstyled
  };

  // Helper function to compare dates
  const isSameDay = (d1, d2) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  return (
    <div className="container mx-auto p-6">
      <ToastContainer />
      <div className="flex-grow mr-6">
        {/* Booking History Section */}
        <section className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Booking History</h2>
          {bookingHistory.length === 0 ? (
            <p>No booking history available.</p>
          ) : (
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left">Client</th>
                  <th className="px-4 py-2 text-left">Event</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Location</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookingHistory.map((booking) => (
                  <tr key={booking.id} className="border-b">
                    <td className="border px-4 py-2">{booking.client}</td>
                    <td className="border px-4 py-2">{booking.eventName}</td>
                    <td className="border px-4 py-2">{booking.eventDate}</td>
                    <td className="border px-4 py-2">{booking.location}</td>
                    <td className="border px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-white text-sm bg-green-500`}>
                        Done
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Rejected Bookings Section */}
        <section className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Rejected Bookings</h2>
          {rejectedBookings.length === 0 ? (
            <p>No rejected bookings available.</p>
          ) : (
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left">Client</th>
                  <th className="px-4 py-2 text-left">Event</th>
                  <th className="px-4 py-2 text-left">Location</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {rejectedBookings.map((booking) => (
                  <tr key={booking.id} className="border-b">
                    <td className="border px-4 py-2">{booking.client}</td>
                    <td className="border px-4 py-2">{booking.eventName}</td>
                    <td className="border px-4 py-2">{booking.location}</td>
                    <td className="border px-4 py-2">
                      <span className="px-2 py-1 rounded-full text-white text-sm bg-red-500">
                        Rejected
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {/* Booking History Section with Calendar */}
      <div className="mt-6 bg-white shadow-md rounded-lg p-6">
        {/* Calendar Section inside Booking History */}
        <section className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Booking Calendar</h2>
          <Calendar
            tileClassName={tileClassName}
            className="react-calendar" // Apply tailwind margin if necessary
          />
        </section>
      </div>

      {/* Dialog for viewing booking details */}
      {selectedBooking && (
        <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
          <DialogTitle>{selectedBooking.eventName}</DialogTitle>
          <DialogContent>
            <p>
              <strong>Client: </strong> {selectedBooking.client}
            </p>
            <p>
              <strong>Date:</strong> {selectedBooking.eventDate}
            </p>
            <p>
              <strong>Location:</strong> {selectedBooking.location}
            </p>
            <p>
              <strong>Description:</strong> {selectedBooking.description}
            </p>
            <p>
              <strong>Status:</strong> {selectedBooking.status}
            </p>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}
