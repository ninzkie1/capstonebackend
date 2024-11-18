import React, { useState, useEffect } from 'react';
import axiosClient from '../axiosClient'; 
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  Badge,
  IconButton,
  Popover,
  CircularProgress,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { toast } from 'react-toastify';
import notificationSound from '../assets/notification.wav';

// Notification Component
export default function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationIds, setNotificationIds] = useState(new Set());

  // Responsive utility
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Detect if the screen is mobile size

  // Create a new Audio object to handle notification sounds
  const notificationAudio = new Audio(notificationSound);

  // Function to play notification sound
  const playNotificationSound = () => {
    notificationAudio.play().catch((error) => {
      console.error("Error playing notification sound:", error);
    });
  };

  // Setup Laravel Echo listeners - useRef to track setup
  const echoListenersSetup = React.useRef(false);

  // Fetch all notifications on component mount
  useEffect(() => {
    fetchNotifications();
    if (!echoListenersSetup.current) {
      setupEchoListeners();
      echoListenersSetup.current = true;
    }

    // Cleanup function to leave the Pusher channel on component unmount
    return () => {
      if (window.Echo) {
        window.Echo.leaveChannel('admin-notifications');
      }
    };
  }, []);

  // Function to fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/notifications');
      if (response.status === 200 && response.data && Array.isArray(response.data.data)) {
        const fetchedNotifications = response.data.data;

        setNotifications(fetchedNotifications);
        setNotificationIds(new Set(fetchedNotifications.map((notif) => notif.id)));
        setUnreadCount(fetchedNotifications.length);
      } else {
        toast.error('Failed to fetch notifications. Unexpected response structure.');
      }
    } catch (error) {
      toast.error('Failed to fetch notifications.');
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Setup Laravel Echo listeners for real-time updates
  const setupEchoListeners = () => {
    try {
      window.Pusher = Pusher;

      window.Echo = new Echo({
        broadcaster: 'pusher',
        key: 'e1070b4f8d56ec053cee', // Replace with your actual Pusher key
        cluster: 'us2', // Update with your cluster
        forceTLS: true,
      });

      window.Echo.channel('admin-notifications')
        .listen('.new-deposit-request', (event) => {
          handleNewNotification(event, 'deposit');
        })
        .listen('.new-withdraw-request', (event) => {
          handleNewNotification(event, 'withdraw');
        });
    } catch (error) {
      console.error("Error setting up Laravel Echo:", error);
    }
  };

  // Handle new notification event
  const handleNewNotification = (event, type) => {
    const notification = type === 'deposit' ? event.depositRequest : event.withdrawRequest;

    if (notification && !notificationIds.has(notification.id)) {
      const newNotification = {
        id: notification.id,
        message: `${notification.user?.name || 'Unknown User'} requested a ${type} of ${notification.amount} TalentoCoins.`,
        created_at: new Date().toISOString(),
        user: notification.user,
      };
      
      // Add new notification to the beginning of the list
      setNotifications((prevNotifications) => [newNotification, ...prevNotifications]);
      setNotificationIds((prevIds) => {
        const updatedIds = new Set([...prevIds, newNotification.id]);
        return updatedIds;
      });
      setUnreadCount((prevCount) => prevCount + 1);
      playNotificationSound();
    }
  };

  // Delete a notification
  const deleteNotification = async (id) => {
    try {
      const response = await axiosClient.delete(`/delete-notifi/${id}`);
      
      if (response.status === 200) {
        setNotifications((prevNotifications) => prevNotifications.filter((notif) => notif.id !== id));
        setNotificationIds((prevIds) => {
          const updatedIds = new Set(prevIds);
          updatedIds.delete(id);
          return updatedIds;
        });
        toast.success('Notification deleted successfully.');
      } else {
        toast.error('Failed to delete notification. Server returned unexpected response.');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        toast.error('Notification not found or already deleted.');
      } else {
        toast.error('Failed to delete notification.');
      }
      console.error('Error deleting notification:', error);
    }
  };

  // Handle opening and closing of the popover
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setUnreadCount(0); // Reset unread count when notifications are opened
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notifications-popover' : undefined;

  return (
    <Box sx={{ maxWidth: isMobile ? '100%' : 600, margin: '0 auto', padding: 2 }}>
      {/* Notification Icon with Badge */}
      <IconButton aria-describedby={id} color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* Popover for Notifications */}
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        PaperProps={{
          style: {
            width: isMobile ? '90%' : '400px',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" gutterBottom>
              Notifications
            </Typography>
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          {loading ? (
            <CircularProgress />
          ) : (
            <Paper elevation={3} sx={{ padding: isMobile ? 1 : 2 }}>
              <List>
                {Array.isArray(notifications) && notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <ListItem key={notification.id} divider>
                      <ListItemText
                        primary={notification.message}
                        secondary={`${notification.user?.name || 'Unknown User'} — ${new Date(notification.created_at).toLocaleString()}`}
                      />
                      <IconButton edge="end" onClick={() => deleteNotification(notification.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No notifications available." />
                  </ListItem>
                )}
              </List>
            </Paper>
          )}
        </Box>
      </Popover>
    </Box>
  );
}
