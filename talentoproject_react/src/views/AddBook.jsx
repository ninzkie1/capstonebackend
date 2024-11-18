import React, { useEffect, useState } from 'react';
import echo from "../echo";
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../axiosClient';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Card,
  CardContent,
  Rating,
  Modal,
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AddBook() {
  const location = useLocation();
  const navigate = useNavigate();
  const { performer, startDate, startTime, endTime, municipality, barangay } = location.state || {};

  const [events, setEvents] = useState([]);
  const [themes, setThemes] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [formData, setFormData] = useState({
    performerId: performer?.performer_portfolio.id || '',
    eventName: '',
    themeName: '',
    startDate: startDate || '',
    startTime: startTime || '',
    endTime: endTime || '',
    municipalityName: municipality || '',
    barangayName: barangay || '',
    customerNotes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Fetch events when the component loads
  useEffect(() => {
    axiosClient.get('/events')
      .then((response) => {
        setEvents(response.data);

        if (performer) {
          const portfolio = performer.performer_portfolio;
          if (portfolio) {
            setFormData((prevFormData) => ({
              ...prevFormData,
              eventName: portfolio.event_name,
              themeName: portfolio.theme_name,
            }));
          }
        }
      })
      .catch((error) => {
        console.error('Error fetching events:', error);
      });
  }, [performer]);

  // Fetch themes based on the selected event name
  useEffect(() => {
    if (formData.eventName) {
      const selectedEvent = events.find((event) => event.name === formData.eventName);
      if (selectedEvent) {
        axiosClient.get(`/events/${selectedEvent.id}/themes`)
          .then((response) => {
            setThemes(response.data);
          })
          .catch((error) => {
            console.error('Error fetching themes:', error);
          });
      }
    } else {
      setThemes([]);
    }
  }, [formData.eventName, events]);

  // Fetch municipalities when the component loads
  useEffect(() => {
    axiosClient.get('/municipalities')
      .then((response) => {
        setMunicipalities(response.data);
      })
      .catch((error) => {
        console.error('Error fetching municipalities:', error);
      });
  }, []);


  useEffect(() => {
    if (echo) {
        const channel = echo.channel("bookings"); // Correct channel name 'bookings'
        channel.listen(".BookingUpdated", (data) => { // Correct event name 'BookingUpdated'
            setBookings((prevBookings) => {
                // Handle state update for real-time changes.
                const bookingIndex = prevBookings.findIndex(
                    (booking) => booking.id === data.booking.id
                );
  
                if (bookingIndex !== -1) {
                    const updatedBookings = [...prevBookings];
                    updatedBookings[bookingIndex] = {
                        ...updatedBookings[bookingIndex],
                        ...data.booking,
                    };
                    return updatedBookings;
                }
  
                return [...prevBookings, data.booking];
            });
  
            toast.info(`Booking ${data.booking.status.toLowerCase()} successfully!`);
        });
  
        return () => {
            channel.stopListening(".BookingUpdated");
        };
    }
  }, [echo]);
  
  

  // Fetch barangays based on selected municipality
  useEffect(() => {
    if (formData.municipalityName) {
      const selectedMunicipality = municipalities.find((mun) => mun.name === formData.municipalityName);
      if (selectedMunicipality) {
        axiosClient.get(`/municipalities/${selectedMunicipality.id}/barangays`)
          .then((response) => {
            setBarangays(response.data);
          })
          .catch((error) => {
            console.error('Error fetching barangays:', error);
          });
      }
    } else {
      setBarangays([]);
    }
  }, [formData.municipalityName, municipalities]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleEventChange = (e) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      eventName: e.target.value,
      themeName: '', // Reset theme when a new event is selected
    }));
  };

  const handleThemeChange = (e) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      themeName: e.target.value,
    }));
  };

  const handleMunicipalityChange = (e) => {
    const municipalityName = e.target.value;
    setFormData((prevFormData) => ({
      ...prevFormData,
      municipalityName,
      barangayName: '', // Reset barangay when a new municipality is selected
    }));
  };

  const handleBarangayChange = (e) => {
    const barangayName = e.target.value;
    setFormData((prevFormData) => ({
      ...prevFormData,
      barangayName,
    }));
  };

  // Handle modal open
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Handle booking success modal close
  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    navigate('/customer');
  };

  // Handle confirmation from modal
  const handleConfirmBooking = async () => {
    setIsModalOpen(false); // Close the confirmation modal
    setIsSubmitting(true);

    try {
      // Submit the booking request
      const response = await axiosClient.post('/bookings', {
        performer_id: formData.performerId,
        event_name: formData.eventName,
        theme_name: formData.themeName,
        start_date: formData.startDate,
        start_time: formData.startTime,
        end_time: formData.endTime,
        municipality_name: formData.municipalityName,
        barangay_name: formData.barangayName,
        notes: formData.customerNotes,
      });

      setIsSuccessModalOpen(true); // Show success modal after booking
    } catch (error) {
      console.error('Error booking performer:', error);
      if (error.response) {
        if (error.response.status === 409 && error.response.data.error) {
          toast.error(`Booking Error: ${error.response.data.error}`);
        } else if (error.response.data.errors) {
          toast.error(Object.values(error.response.data.errors).flat().join(', '));
        } else {
          toast.error('There was an error booking the performer. Please check your data and try again.');
        }
      } else {
        toast.error('An unknown error occurred.');
      }
    } finally {
      setIsSubmitting(false); // Re-enable the button
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={
                performer?.image_profile
                  ? `http://192.168.208.120:8000/storage/${performer.image_profile}`
                  : ''
              }
              alt={performer?.name || ''}
              sx={{ width: 100, height: 100, mr: 3 }}
            />
            <Box>
              <Typography variant="h5">{performer?.name}</Typography>
              <Typography variant="body1">
                <strong>Talent:</strong> {performer?.performer_portfolio?.talent_name}
              </Typography>
              <Typography variant="body1">
                <strong>Rate:</strong> {performer?.performer_portfolio?.rate} TCoins
              </Typography>
              <Typography variant="body1">
                <strong>Location:</strong> {performer?.performer_portfolio?.location}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="body1" sx={{ mr: 1 }}>
                  <strong>Rating:</strong>
                </Typography>
                <Rating
                  value={Number(performer?.performer_portfolio?.average_rating) || 0}
                  precision={0.5}
                  readOnly
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <form onSubmit={(e) => {
          e.preventDefault();
          handleOpenModal();
        }}>
          {/* Event Name Select */}
          <div className="mb-4">
            <label htmlFor="event_name" className="block text-gray-700 font-semibold mb-2">
              Event Name
            </label>
            <select
              id="event_name"
              name="eventName"
              value={formData.eventName}
              onChange={handleEventChange}
              className="w-full border border-gray-300 px-3 py-2 rounded-md"
              required
            >
              <option value="">Select Event</option>
              {events.map((event) => (
                <option key={event.name} value={event.name}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Name Select */}
          <div className="mb-4">
            <label htmlFor="theme_name" className="block text-gray-700 font-semibold mb-2">
              Theme Name
            </label>
            <select
              id="theme_name"
              name="themeName"
              value={formData.themeName}
              onChange={handleThemeChange}
              className="w-full border border-gray-300 px-3 py-2 rounded-md"
              required
            >
              <option value="">Select Theme</option>
              {themes.map((theme) => (
                <option key={theme.name} value={theme.name}>
                  {theme.name}
                </option>
              ))}
            </select>
          </div>

          {/* Municipality and Barangay Select */}
          <div className="mb-4">
            <label className="block text-gray-700">Select Municipality</label>
            <select
              name="municipalityName"
              value={formData.municipalityName}
              onChange={handleMunicipalityChange}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">Select Municipality</option>
              {municipalities.map((municipality) => (
                <option key={municipality.name} value={municipality.name}>
                  {municipality.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Select Barangay</label>
            <select
              name="barangayName"
              value={formData.barangayName}
              onChange={handleBarangayChange}
              className="w-full px-3 py-2 border rounded"
              required
              disabled={!formData.municipalityName}
            >
              <option value="">Select Barangay</option>
              {barangays.map((barangay) => (
                <option key={barangay.name} value={barangay.name}>
                  {barangay.name}
                </option>
              ))}
            </select>
          </div>

          {/* Other Booking Information */}
          <label className="block text-gray-700">Start Date: <span className="text-red-500">*</span></label>
          <TextField
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            type="date"
          />
          <label className="block text-gray-700">Start Time: <span className="text-red-500">*</span></label>
          <TextField
            name="startTime"
            value={formData.startTime}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            type="time"
          />
          <label className="block text-gray-700">End Time: <span className="text-red-500">*</span></label>
          <TextField
            name="endTime"
            value={formData.endTime}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            type="time"
          />
          <label className="block text-gray-700">Customer Notes (Optional):</label>
          <TextField
            label="Customer Notes"
            name="customerNotes"
            value={formData.customerNotes}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            multiline
            rows={4}
          />
          <Box sx={{ textAlign: 'right', mt: 2 }}>
            <Button variant="contained" color="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </Box>
        </form>
      </Box>

      {/* Confirmation Modal */}
      <Modal open={isModalOpen} onClose={handleCloseModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6" component="h2">
            Confirm Booking
          </Typography>
          <Typography sx={{ mt: 2 }}>
            You are about to book <strong>{performer?.name}</strong> at the rate of{' '}
            <strong>{performer?.performer_portfolio?.rate} TCoins</strong>.
          </Typography>
          <Typography sx={{ mt: 2 }}>
            Are you sure you want to proceed?
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="contained" color="primary" onClick={handleConfirmBooking} disabled={isSubmitting}>
              {isSubmitting ? 'Booking...' : 'Book Now'}
            </Button>
            <Button variant="contained" color="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Success Modal */}
      <Modal open={isSuccessModalOpen} onClose={handleCloseSuccessModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6" component="h2">
            Booking Successful
          </Typography>
          <Typography sx={{ mt: 2 }}>
            Your booking for <strong>{performer?.name}</strong> has been successfully confirmed.
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button variant="contained" color="primary" onClick={handleCloseSuccessModal}>
              OK
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
