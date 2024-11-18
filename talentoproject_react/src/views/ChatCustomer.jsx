import React, { useState, useEffect } from "react";
import axiosClient from "../axiosClient";
import {
  Box,
  Avatar,
  Button,
  TextField,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useStateContext } from "../context/contextprovider";
import echo from '../echo'; 

export default function ChatCustomer() {
  const { user } = useStateContext(); // Get the logged-in user from context
  const [message, setMessage] = useState(""); // The current message input
  const [messages, setMessages] = useState([]); // All chat messages
  const [users, setUsers] = useState([]); // List of contacts (performers)
  const [selectedUser, setSelectedUser] = useState(null); // The selected contact
  const [isChatOpen, setIsChatOpen] = useState(false); // To toggle chat window
  const [isContactSelected, setIsContactSelected] = useState(false); // To toggle contact/chat view

  // Fetch users when the component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosClient.get("/users");
        const filteredUsers = response.data.filter(
          (u) => u.role === "performer" && u.id !== user.id // Only include performers, exclude the logged-in user
        );
        setUsers(filteredUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [user.id]);

  // Fetch messages for the selected user
  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedUser) {
        try {
          const response = await axiosClient.get("/chats", {
            params: {
              user_id: user.id,         // Logged-in user ID
              contact_id: selectedUser.id, // Selected contact ID
            },
          });
          setMessages(response.data); // Update messages for the selected user

          // Listen for new messages via Pusher
          echo.channel('chat-channel')
            .listen('.message.sent', (e) => {
              const newMessage = e.chat;

              // Prevent duplicate messages by checking the real message ID
              setMessages((prevMessages) => {
                if (!prevMessages.some((msg) => msg.id === newMessage.id)) {
                  return [...prevMessages, newMessage];
                }
                return prevMessages;
              });
            });

          return () => {
            echo.leaveChannel('chat-channel');
          };
        } catch (error) {
          console.error("Error fetching messages:", error);
        }
      }
    };

    fetchMessages();
  }, [selectedUser, user.id]); // Fetch messages whenever selectedUser changes

  // Function to handle sending a message
  const handleSendMessage = async () => {
    if (message.trim() !== "" && selectedUser) {
      try {
        // Send the message to the server
        await axiosClient.post("/chats", {
          sender_id: user.id,
          receiver_id: selectedUser.id,
          message,
        });

        // Clear the message input
        setMessage("");
        // NOTE: Do not add the message to the UI here because Pusher will handle it
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  // Function to handle user selection
  const handleUserClick = (user) => {
    setMessages([]); // Clear previous messages immediately
    setSelectedUser(user); // Set the new user
    setIsContactSelected(true); // Mark a contact as selected
  };

  // Function to handle going back to the contact list
  const handleBackToContacts = () => {
    setIsContactSelected(false); // Go back to the contacts list
  };

  // Scroll chat to bottom when new messages appear
  useEffect(() => {
    const chatArea = document.getElementById("chatArea");
    if (chatArea) {
      chatArea.scrollTop = chatArea.scrollHeight;
    }
  }, [messages]);

  return (
    <div>
      {/* Floating Button for Chat */}
      <IconButton
        onClick={() => setIsChatOpen((prev) => !prev)}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          bgcolor: "blue",
          color: "white",
          boxShadow: "0px 0px 10px rgba(0,0,0,0.3)",
          "&:hover": {
            bgcolor: "darkblue",
          },
        }}
      >
        <ChatIcon />
      </IconButton>

      {/* Chat Component Inside the Modal */}
      {isChatOpen && (
        <Box
          sx={{
            position: "fixed",
            bottom: 70,
            right: 16,
            width: isContactSelected ? "600px" : "300px",
            height: "500px",
            bgcolor: "white",
            boxShadow: 24,
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Chat Header */}
          <Box
            sx={{
              p: 2,
              bgcolor: "blue",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderRadius: "10px 10px 0 0",
            }}
          >
            {isContactSelected ? (
              <>
                <IconButton onClick={handleBackToContacts} sx={{ color: "white" }}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6">{selectedUser.name}</Typography>
              </>
            ) : (
              <Typography variant="h6">Contacts</Typography>
            )}
            <IconButton sx={{ color: "white" }} onClick={() => setIsChatOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Contact List or Chat */}
          <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
            {!isContactSelected ? (
              <List>
                {users.map((user) => (
                  <ListItem key={user.id} button onClick={() => handleUserClick(user)}>
                    <ListItemAvatar>
                      <Avatar>{user.name[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={user.name} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <div id="chatArea">
                {messages.length === 0 ? (
                  <Typography color="textSecondary">No messages yet.</Typography>
                ) : (
                  messages.map((msg, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 2,
                        justifyContent:
                          msg.sender_id === user.id ? "flex-end" : "flex-start", // Align based on who sent the message
                      }}
                    >
                      {msg.sender_id !== user.id && (
                        <Avatar sx={{ mr: 1 }}>
                          {selectedUser.name[0]} {/* Display receiver's avatar */}
                        </Avatar>
                      )}
                      <Box
                        sx={{
                          p: 3,
                          borderRadius: "8px",
                          maxWidth: "70%",
                          backgroundColor:
                            msg.sender_id === user.id ? "#e0f7fa" : "#f1f1f1", // Different colors for sent and received messages
                        }}
                      >
                        {/* Show selected user's name if they're the sender */}
                        {msg.sender_id !== user.id && (
                          <Typography variant="body2" fontWeight="bold">
                            {selectedUser.name}
                          </Typography>
                        )}
                        <Typography variant="body1">{msg.message}</Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </div>
            )}
          </Box>

          {/* Message Input */}
          {isContactSelected && (
            <Box
              sx={{
                borderTop: "1px solid #ccc",
                display: "flex",
                p: 2,
                bgcolor: "white",
              }}
            >
              <TextField
                variant="outlined"
                fullWidth
                placeholder="Type something here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                sx={{ flex: 1 }}
              />
              <Button
                onClick={handleSendMessage}
                variant="contained"
                color="primary"
                sx={{ ml: 1 }}
              >
                Send
              </Button>
            </Box>
          )}
        </Box>
      )}
    </div>
  );
}
