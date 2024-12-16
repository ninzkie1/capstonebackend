import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Fab,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../index.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosClient from "../axiosClient";
import { useStateContext } from "../context/contextprovider";

export default function Availability() {
  const { user } = useStateContext();
  const [performer, setPerformer] = useState(null);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [unavailableTimes, setUnavailableTimes] = useState([]);

  // Fetch performer profile
  useEffect(() => {
    const fetchPerformerProfile = async () => {
      try {
        const response = await axiosClient.get(`/performers/${user.id}/portfolio`);
        setPerformer(response.data.portfolio);
        console.log("Performer profile fetched:", response.data.portfolio);
      } catch (error) {
        console.error("Error fetching performer profile:", error);
        toast.error("Failed to load performer profile.");
      }
    };

    if (user && user.id) {
      fetchPerformerProfile();
    } else {
      toast.error("User not authenticated. Please log in.");
    }
  }, [user]);

  // Fetch unavailable dates
  useEffect(() => {
    const fetchUnavailableDates = async () => {
      if (performer && performer.id) {
        try {
          const response = await axiosClient.get(`/performers/${performer.id}/unavailable-dates`);
          setUnavailableDates(
            response.data.unavailableDates.map((date) => ({
              date: dayjs(date.unavailable_date).toDate(),
              start_time: date.start_time,
              end_time: date.end_time,
            }))
          );
          console.log("Unavailable dates fetched:", response.data.unavailableDates);
        } catch (error) {
          console.error("Error fetching unavailable dates:", error);
          toast.error("Failed to load unavailable dates.");
        }
      }
    };

    if (performer) {
      fetchUnavailableDates();
    }
  }, [performer]);

  const saveUnavailableDate = async (date) => {
    try {
      if (!performer || !performer.id) {
        throw new Error("Performer data is missing.");
      }
  
      const formattedDate = dayjs(date).format("YYYY-MM-DD");
      await axiosClient.post("/unavailable-dates", {
        performer_id: performer.id,
        unavailableDates: [{ date: formattedDate, start_time: startTime, end_time: endTime }],
      });
  
      setUnavailableDates((prev) => [
        ...prev,
        { date: dayjs(formattedDate).toDate(), start_time: startTime, end_time: endTime },
      ]);
      toast.success("Unavailable time saved successfully!");
      setStartTime("");
      setEndTime("");
    } catch (error) {
      if (error.response) {
        // Handle server error responses
        const { status, data } = error.response;
  
        if (status === 409) {
          toast.error(data.error || "This time range is already unavailable.");
        } else if (status === 422) {
          toast.error("Validation error: Please check your input and try again.");
        } else {
          toast.error(data.error || "An unexpected error occurred.");
        }
      } else {
        console.error("Error saving unavailable time:", error);
        toast.error("Cannot save unavailable time. Please try again.");
      }
    }
  };
  

  const handleConfirmUnavailableDate = () => {
    if (!performer || !performer.id) {
      toast.error("Cannot save unavailable time. Performer data is missing.");
      return;
    }

    if (selectedDate && startTime && endTime) {
      saveUnavailableDate(selectedDate);
    }
    setIsConfirmationOpen(false);
  };

  const handleDateClick = (date) => {
    setSelectedDate(dayjs(date).startOf("day"));
    const times = unavailableDates.filter((unav) =>
      dayjs(unav.date).isSame(dayjs(date), "day")
    );
    setUnavailableTimes(times);
  };

  const handleSetUnavailableClick = () => {
    setIsConfirmationOpen(true);
  };

  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const unavailable = unavailableDates.find((unav) =>
        dayjs(unav.date).isSame(dayjs(date), "day")
      );
      if (unavailable) {
        return (
          <div
            className="bg-red-500 w-full h-full"
            style={{
              borderRadius: "8px",
              width: "100%",
              height: "100%",
            }}
          ></div>
        );
      }
    }
    return null;
  };

  const format12HourTime = (time) => {
    if (!time) {
      return "Invalid time"; // Handle null or undefined time
    }
  
    const [hour, minute, second] = time.split(":");
    const date = new Date();
    date.setHours(hour, minute, second);
  
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  };
  

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Manage Unavailable Dates</h1>
      <Calendar
        tileContent={tileContent}
        className="react-calendar"
        onClickDay={handleDateClick}
      />

{selectedDate && (
  <div className="mt-4 p-4 bg-white shadow-md rounded-lg">
    <h2 className="text-lg font-semibold">
      Unavailable Times for {selectedDate.format("MMMM DD, YYYY")}
    </h2>
    {unavailableTimes.length > 0 ? (
      <div
        style={{
          maxHeight: "200px", // Set the maximum height for the container
          overflowY: "auto", // Enable vertical scrolling
          border: "1px solid #ddd", // Optional: Add a border for clarity
          padding: "8px", // Optional: Add some padding
          borderRadius: "4px", // Optional: Rounded corners
        }}
      >
        <ul className="mt-2">
          {unavailableTimes.map((time, index) => (
            <li key={index} className="p-2 border-b">
              {format12HourTime(time.start_time)} - {format12HourTime(time.end_time)}
            </li>
          ))}
        </ul>
      </div>
    ) : (
      <p className="mt-2">No unavailable times for this date.</p>
    )}
  </div>
)}


      {/* Floating Button to Add Unavailable Time */}
      {selectedDate && (
        <Fab
          color="primary"
          aria-label="add"
          style={{
            position: "fixed",
            bottom: "16px",
            right: "16px",
          }}
          onClick={handleSetUnavailableClick}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmationOpen} onClose={() => setIsConfirmationOpen(false)}>
        <DialogTitle>Set Unavailable Time</DialogTitle>
        <DialogContent>
          <p>
            Set unavailable time on {selectedDate?.format("MMMM DD, YYYY")}
          </p>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-2 mb-2 p-2 border border-gray-300 rounded"
            style={{ display: "block", width: "100%" }}
          />
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mb-2 p-2 border border-gray-300 rounded"
            style={{ display: "block", width: "100%" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsConfirmationOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmUnavailableDate}
            color="primary"
            disabled={!startTime || !endTime || startTime >= endTime}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
