import React, { useEffect, useState } from 'react';
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
  Tooltip,
} from '@mui/material';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs to include timezone and UTC support
dayjs.extend(utc);
dayjs.extend(timezone);

// Set default timezone to Asia/Manila
dayjs.tz.setDefault('Asia/Manila');

export default function AddBook() {
  const location = useLocation();
  const navigate = useNavigate();
  const { performers = [], startDate, startTime, endTime, municipality, barangay } = location.state || {};

  const [events, setEvents] = useState([]);
  const [themes, setThemes] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [pendingDates, setPendingDates] = useState([]);
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    // Fetch events
    axiosClient.get('/events')
      .then((response) => {
        setEvents(response.data);
      })
      .catch((error) => {
        console.error('Error fetching events:', error);
      });
  }, []);

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

  // Fetch unavailable and pending dates for all selected performers
  useEffect(() => {
    const fetchUnavailableAndPendingDates = async () => {
        const unavailableDatesList = [];
        const pendingDatesList = [];

        for (const performer of performers) {
            try {
                // Fetch unavailable dates
                const unavailableResponse = await axiosClient.get(`/performers/${performer.performer_portfolio.id}/unavailable-dates`);
                if (unavailableResponse.data && unavailableResponse.data.unavailableDates) {
                    unavailableResponse.data.unavailableDates.forEach(date => {
                        unavailableDatesList.push({
                            performerName: `${performer.name} ${performer.lastname}`,
                            date: dayjs.tz(date, 'Asia/Manila').format('YYYY-MM-DD'),
                        });
                    });
                }

                // Fetch pending booking dates
                const pendingResponse = await axiosClient.get(`/performers/${performer.performer_portfolio.id}/performerPendingDates`);
                if (pendingResponse.data && pendingResponse.data.pendingBookingDates) {
                    pendingResponse.data.pendingBookingDates.forEach(date => {
                        pendingDatesList.push({
                            performerName: `${performer.name} ${performer.lastname}`,
                            date: dayjs.tz(date, 'Asia/Manila').format('YYYY-MM-DD'),
                        });
                    });
                }

            } catch (error) {
                console.error(`Error fetching dates for performer ${performer.name}:`, error);
            }
        }

        setUnavailableDates(unavailableDatesList);
        setPendingDates(pendingDatesList);
    };

    if (performers.length > 0) {
        fetchUnavailableAndPendingDates();
    }
}, [performers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  // Handle modal open
  const handleOpenModal = () => {
    const cost = performers.reduce((acc, performer) => acc + (performer.performer_portfolio.rate || 0), 0);
    setTotalCost(cost);
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

  // Handle booking confirmation for multiple performers
  const handleConfirmBooking = async () => {
    setIsModalOpen(false);
    setIsSubmitting(true);

    try {
      // Create an array of performer IDs
      const performerIds = performers.map((performer) => performer.performer_portfolio.id);

      // Submit a single booking request with all performer IDs
      await axiosClient.post('/bookings', {
        performer_ids: performerIds,
        event_name: formData.eventName,
        theme_name: formData.themeName,
        start_date: formData.startDate,
        start_time: formData.startTime,
        end_time: formData.endTime,
        municipality_name: formData.municipalityName,
        barangay_name: formData.barangayName,
        notes: formData.customerNotes,
      });

      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error('Error booking performers:', error);
      if (error.response && error.response.data.error) {
        toast.error(
          Array.isArray(error.response.data.error)
            ? error.response.data.error.join(', ')
            : error.response.data.error
        );
      } else {
        toast.error('There was an error booking the performers. Please check your data and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calendar tile content to highlight unavailable dates and pending dates
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const formattedDate = dayjs.tz(date, 'Asia/Manila').format('YYYY-MM-DD');

      const unavailablePerformers = unavailableDates.filter(ud => ud.date === formattedDate);
      const pendingPerformers = pendingDates.filter(pd => pd.date === formattedDate);

      if (unavailablePerformers.length > 0) {
        return (
          <Tooltip title={unavailablePerformers.map(ud => ud.performerName).join(', ')}>
            <div style={{ backgroundColor: 'rgba(255, 0, 0, 0.5)', borderRadius: '50%', width: '100%', height: '100%' }} />
          </Tooltip>
        );
      } else if (pendingPerformers.length > 0) {
        return (
          <Tooltip title={pendingPerformers.map(pd => pd.performerName).join(', ')}>
            <div style={{ backgroundColor: 'rgba(0, 0, 255, 0.5)', borderRadius: '50%', width: '100%', height: '100%' }} />
          </Tooltip>
        );
      }
    }
    return null;
  };

  return (
    <div className="container mx-auto p-6">
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      {performers.length > 0 && performers.map((performer, index) => (
    <Card key={index} sx={{ mb: 4 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
                src={
                    performer?.image_profile
                        ? `http://192.168.254.107:8000/storage/${performer.image_profile}`
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
))}
      
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
              onChange={handleInputChange}
              className="w-full border border-gray-300 px-3 py-2 rounded-md"
              required
            >
              <option value="">Select Event</option>
              {events.map((event) => (
                <option key={event.id} value={event.name}>
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
              onChange={handleInputChange}
              className="w-full border border-gray-300 px-3 py-2 rounded-md"
              required
            >
              <option value="">Select Theme</option>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.name}>
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
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">Select Municipality</option>
              {municipalities.map((municipality) => (
                <option key={municipality.id} value={municipality.name}>
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
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded"
              required
              disabled={!formData.municipalityName}
            >
              <option value="">Select Barangay</option>
              {barangays.map((barangay) => (
                <option key={barangay.id} value={barangay.name}>
                  {barangay.name}
                </option>
              ))}
            </select>
          </div>

          {/* Calendar Display for Unavailable Dates and Pending Bookings */}
          <div className="mb-4">
            <Typography variant="h6">Unavailable Dates and Pending Bookings</Typography>
            <Calendar tileContent={tileContent} />
          </div>

          {/* Booking Information */}
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
            You are about to book {performers.length} performer(s) for a total cost of <strong>{totalCost} TCoins</strong>.
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
            Your booking has been successfully confirmed.
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
