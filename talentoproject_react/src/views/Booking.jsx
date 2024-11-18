import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import axios from "../axiosClient";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../index.css";
import { useStateContext } from "../context/contextprovider";
import echo from "../echo";


dayjs.extend(utc);
dayjs.extend(timezone);

export default function Booking() {
  const { user } = useStateContext();
  const [performer, setPerformer] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const fetchPerformerProfile = async () => {
      if (user && user.id) {
        try {
          const response = await axios.get(`/performers/${user.id}/portfolio`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          const { portfolio } = response.data;
          setPerformer(portfolio);
        } catch (error) {
          console.error("Error fetching performer profile:", error);
          toast.error("Failed to load performer profile.");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        console.error("User is not logged in or performer profile not found.");
      }
    };

    fetchPerformerProfile();
  }, [user]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (performer && performer.id) {
        try {
          const response = await axios.get(`/performers/${performer.id}/bookings`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          setBookings(response.data);
        } catch (error) {
          console.error("Error fetching bookings:", error);
          toast.error("Failed to load bookings.");
        }
      }
    };

    const fetchUnavailableDates = async () => {
      if (performer && performer.id) {
        try {
          const response = await axios.get(`/performers/${performer.id}/unavailable-dates`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          setUnavailableDates(response.data.unavailableDates.map((date) => dayjs(date).toDate()));
        } catch (error) {
          console.error("Error fetching unavailable dates:", error);
          toast.error("Failed to load unavailable dates.");
        }
      }
    };

    if (performer) {
      fetchBookings();
      fetchUnavailableDates();
    }
  }, [performer]);

  useEffect(() => {
    if (echo) {
        const channel = echo.channel("bookings"); // Ensure the channel name matches
        channel.listen(".BookingUpdated", (data) => { // Ensure the event name matches
            console.log("Booking update received:", data);
           

            // Update booking list with the updated booking
            setBookings((prevBookings) => {
                const updatedBookings = prevBookings.map((booking) => 
                    booking.id === data.booking.id ? { ...booking, ...data.booking } : booking
                );
                
                // If the updated booking does not exist, add it
                if (!updatedBookings.some((booking) => booking.id === data.booking.id)) {
                    updatedBookings.push(data.booking);
                }

                return updatedBookings;
            });
        });

        // Cleanup listener on unmount
        return () => {
            channel.stopListening(".BookingUpdated");
        };
    }
}, [echo]);

  


  if (loading) {
    return <div>Loading...</div>;
  }

  const updateBookingStatus = async (bookingId, status) => {
    try {
      const endpoint = status === "Accepted" ? `/bookings/${bookingId}/accept` : `/bookings/${bookingId}/decline`;

      await axios.put(endpoint, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === bookingId ? { ...booking, status } : booking
        )
      );

      toast.success(`Booking ${status} successfully!`);
    } catch (error) {
      console.error(`Error ${status === "Accepted" ? "accepting" : "declining"} booking:`, error);
      toast.error(`Failed to ${status.toLowerCase()} booking.`);
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };
  const handleCloseCalendar = () => {
    setIsCalendarOpen(false);
  };

  const formatTime12Hour = (time) => {
    if (!time) return "";

    const [hour, minute, second] = time.split(":");
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);
    date.setSeconds(second);

    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  };

  const saveUnavailableDate = async (date) => {
    try {
      const formattedDate = date.format("YYYY-MM-DD");
      await axios.post(
        "/unavailable-dates",
        {
          performer_id: performer.id,
          unavailableDates: [formattedDate],
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setUnavailableDates((prevDates) => [...prevDates, date.toDate()]);
      toast.success("Unavailable date saved successfully!");
    } catch (error) {
      console.error("Error saving unavailable date:", error);
      toast.error("Failed to save unavailable date.");
    }
  };

  const onDateClick = (date) => {
    const manilaDate = dayjs(date).tz("Asia/Manila").startOf("day");
    setSelectedDate(manilaDate);
    setIsConfirmationOpen(true);
  };

  const handleConfirmUnavailableDate = () => {
    if (selectedDate) {
      saveUnavailableDate(selectedDate);
    }
    setIsConfirmationOpen(false);
  };

  const handleCancelUnavailableDate = () => {
    setIsConfirmationOpen(false);
  };

  const isSameDay = (d1, d2) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const acceptedDates = bookings
    .filter((booking) => booking.status.toLowerCase() === "accepted")
    .map((booking) => new Date(booking.start_date));

  const tileContent = ({ date, view }) => {
    if (view === "month") {
      if (unavailableDates.some((unavailableDate) => isSameDay(unavailableDate, date))) {
        return (
          <div className="bg-red-500 w-full h-full text-white flex items-center justify-center rounded-md"></div>
        );
      }
      if (acceptedDates.some((acceptedDate) => isSameDay(acceptedDate, date))) {
        return (
          <div className="bg-green-500 w-full h-full text-white flex items-center justify-center rounded-md"></div>
        );
      }
    }
    return null;
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen lg:flex lg:flex-col lg:gap-6">
      <ToastContainer />

      {/* Button to Open Calendar Modal */}
      <div className="flex justify-end mb-4">
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsCalendarOpen(true)}
          className="px-3 py-1 text-sm"
        >
          View Calendar
        </Button>
      </div>

      <div className="flex-grow lg:w-full mb-6 lg:mb-0">
        <div className="mb-6">
          <header className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold mb-4">Booking Requests</h1>
          </header>

          {/* Booking Requests */}
          <section className="bg-white shadow-md rounded-lg p-4 lg:p-6 mb-6 overflow-x-auto">
            {bookings.filter((booking) => booking.status.toLowerCase() === "pending").length === 0 ? (
              <p>No Booking Requests Available</p>
            ) : (
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Client</th>
                    <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Event & Theme</th>
                    <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Date</th>
                    <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Time</th>
                    <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Location</th>
                    <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Status</th>
                    <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings
                    .filter((booking) => booking.status.toLowerCase() === "pending")
                    .map((booking) => (
                      <tr key={booking.id} className="border-b">
                        <td className="border px-2 py-1 lg:px-4 lg:py-2">
                          {booking.client?.name} {booking.client?.lastname}
                        </td>
                        <td className="border px-2 py-1 lg:px-4 lg:py-2">
                          {booking.event_name}, {booking.theme_name}
                        </td>
                        <td className="border px-2 py-1 lg:px-4 lg:py-2">{booking.start_date}</td>
                        <td className="border px-2 py-1 lg:px-4 lg:py-2">
                          {formatTime12Hour(booking.start_time)} to {formatTime12Hour(booking.end_time)}
                        </td>
                        <td className="border px-2 py-1 lg:px-4 lg:py-2">
                          {`${booking.municipality_name}, ${booking.barangay_name}`}
                        </td>
                        <td className="border px-2 py-1 lg:px-4 lg:py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-white text-sm ${
                              booking.status.toLowerCase() === "accepted"
                                ? "bg-green-500"
                                : booking.status.toLowerCase() === "rejected"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                            }`}
                          >
                            {booking.status}
                          </span>
                        </td>
                        <td className="border px-2 py-1 lg:px-4 lg:py-2 space-x-2 flex justify-center">
                          <Button variant="contained" color="info" onClick={() => handleViewDetails(booking)}>
                            View
                          </Button>
                          {booking.status.toLowerCase() === "pending" && (
                            <>
                              <Button
                                variant="contained"
                                color="success"
                                onClick={() => updateBookingStatus(booking.id, "Accepted")}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="contained"
                                color="error"
                                onClick={() => updateBookingStatus(booking.id, "Declined")}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Accepted Bookings */}
          <section className="bg-white shadow-md rounded-lg p-4 lg:p-6 mb-6 overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4">Accepted Bookings</h2>
            {bookings.filter((booking) => booking.status.toLowerCase() === "accepted").length === 0 ? (
              <p>No Accepted Bookings Available</p>
            ) : (
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Client</th>
                    <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Event & Theme</th>
                    <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Date</th>
                    <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Time</th>
                    <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Location</th>
                    <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings
                    .filter((booking) => booking.status.toLowerCase() === "accepted")
                    .map((booking) => (
                      <tr key={booking.id} className="border-b">
                        <td className="border px-2 py-1 lg:px-4 lg:py-2">
                          {booking.client?.name} {booking.client?.lastname}
                        </td>
                        <td className="border px-2 py-1 lg:px-4 lg:py-2">
                          {booking.event_name}, {booking.theme_name}
                        </td>
                        <td className="border px-2 py-1 lg:px-4 lg:py-2">{booking.start_date}</td>
                        <td className="border px-2 py-1 lg:px-4 lg:py-2">
                          {formatTime12Hour(booking.start_time)} to {formatTime12Hour(booking.end_time)}
                        </td>
                        <td className="border px-2 py-1 lg:px-4 lg:py-2">
                          {`${booking.municipality_name}, ${booking.barangay_name}`}
                        </td>
                        <td className={`border px-2 py-1 lg:px-4 lg:py-2 text-white ${
                          booking.status.toLowerCase() === "accepted" ? "bg-green-500" : ""
                        }`}>
                          {booking.status}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Declined Bookings */}
          <section className="bg-white shadow-md rounded-lg p-4 lg:p-6 overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4">Declined Bookings</h2>
            {bookings.filter((booking) => booking.status.toLowerCase() === "declined").length === 0 ? (
              <p>No Declined Bookings Available</p>
            ) : (
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Client</th>
                    <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Event & Theme</th>
                    <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Date</th>
                    <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Time</th>
                    <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Location</th>
                    <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings
                    .filter((booking) => booking.status.toLowerCase() === "declined")
                    .map((booking) => (
                      <tr key={booking.id} className="border-b">
                        <td className="border px-2 py-1 lg:px-4 lg:py-2">
                          {booking.client?.name} {booking.client?.lastname}
                        </td>
                        <td className="border px-2 py-1 lg:px-4 lg:py-2">
                          {booking.event_name}, {booking.theme_name}
                        </td>
                        <td className="border px-2 py-1 lg:px-4 lg:py-2">{booking.start_date}</td>
                        <td className="border px-2 py-1 lg:px-4 lg:py-2">
                          {formatTime12Hour(booking.start_time)} to {formatTime12Hour(booking.end_time)}
                        </td>
                        <td className="border px-2 py-1 lg:px-4 lg:py-2">
                          {`${booking.municipality_name}, ${booking.barangay_name}`}
                        </td>
                        <td className={`border px-2 py-1 lg:px-4 lg:py-2 text-white ${
                          booking.status.toLowerCase() === "declined" ? "bg-red-500" : ""
                        }`}>
                          {booking.status}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>

      {/* Calendar Modal */}
      <Dialog open={isCalendarOpen} onClose={handleCloseCalendar} maxWidth="sm" fullWidth>
        <DialogTitle>Booking Calendar</DialogTitle>
        <DialogContent>
          <Calendar
            tileContent={tileContent}
            className="react-calendar"
            onClickDay={onDateClick}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCalendar} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Unavailable Date */}
      <Dialog open={isConfirmationOpen} onClose={handleCancelUnavailableDate}>
        <DialogTitle>Confirm Unavailable Date</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Do you want to save {selectedDate?.format("MMMM DD, YYYY")} as unavailable?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelUnavailableDate} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmUnavailableDate} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Viewing Booking Details */}
      {selectedBooking && (
        <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
          <DialogTitle>{selectedBooking.event_name}</DialogTitle>
          <DialogContent>
            <p>
              <strong>Client: </strong> {selectedBooking.client?.name} {selectedBooking.client?.lastname}
            </p>
            <p>
              <strong>Performer: </strong> {selectedBooking.performer?.user?.name}{" "}
              {selectedBooking.performer?.user?.lastname}
            </p>
            <p>
              <strong>Date:</strong> {selectedBooking.start_date}
            </p>
            <p>
              <strong>Location:</strong> {`${selectedBooking.municipality_name}, ${selectedBooking.barangay_name}`}
            </p>
            <p>
              <strong>Notes:</strong> {selectedBooking.notes}
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
