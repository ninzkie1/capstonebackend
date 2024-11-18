import React, { useState, useEffect } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import { useStateContext } from "../context/contextprovider";
import echo from "../echo";
import {
  Box,
  Drawer,
  Avatar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  AppBar,
  Toolbar,
  Button,
  TextField,
  useMediaQuery,
  Paper,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useTheme } from "@mui/material/styles";

export default function Messages() {
  const { isSidebarOpen } = useOutletContext();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const { user } = useStateContext();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://192.168.254.116:8000/api/users");
        const filteredUsers = response.data.filter(
          (u) => u.role !== "admin" && u.id !== user.id
        );
        setUsers(filteredUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [user.id]);

  useEffect(() => {
    if (selectedUser) {
      const fetchMessages = async () => {
        try {
          const response = await axios.get("http://192.168.254.116:8000/api/chats", {
            params: {
              user_id: user.id,
              contact_id: selectedUser.id,
            },
          });
          setMessages(response.data);

          echo.channel("chat-channel").listen(".message.sent", (e) => {
            const newMessage = e.chat;
            if (
              (newMessage.sender_id === user.id && newMessage.receiver_id === selectedUser.id) ||
              (newMessage.sender_id === selectedUser.id && newMessage.receiver_id === user.id)
            ) {
              setMessages((prevMessages) => {
                if (!prevMessages.some((msg) => msg.id === newMessage.id)) {
                  return [...prevMessages, newMessage];
                }
                return prevMessages;
              });
            }
          });

          return () => {
            echo.leaveChannel("chat-channel");
          };
        } catch (error) {
          console.error("Error fetching messages:", error);
        }
      };

      fetchMessages();
    }
  }, [selectedUser, user.id]);

  const handleSendMessage = async () => {
    if (message.trim() !== "" && selectedUser) {
      const newMessage = {
        sender_id: user.id,
        receiver_id: selectedUser.id,
        message,
      };

      setMessage("");

      try {
        await axios.post("http://192.168.254.116:8000/api/chats", newMessage);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setMessages([]);
    setDrawerOpen(false);
  };

  useEffect(() => {
    const chatArea = document.getElementById("chatArea");
    if (chatArea) {
      chatArea.scrollTop = chatArea.scrollHeight;
    }
  }, [messages]);

  return (
    <Box sx={{ display: "flex", height: "85vh", bgcolor: "background.default" }}>
      {/* AppBar for small screens */}
      <AppBar
        position="fixed"
        sx={{
          display: { md: "none" },
          backgroundImage: "linear-gradient(to right, #1976d2, #1565c0)",
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {selectedUser ? selectedUser.name : "Select a user"}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer for user list */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: "80%",
            backgroundColor: "#1976d2",
            color: "#fff",
          },
        }}
      >
        <Box sx={{ width: 240 }}>
          <Typography variant="h6" sx={{ p: 2, fontWeight: "bold", color: "#fff" }}>
            Active Conversations
          </Typography>
          <List>
            {users.map((user) => (
              <ListItem button key={user.id} onClick={() => handleUserClick(user)}>
                <ListItemAvatar>
                  <Avatar src={`https://i.pravatar.cc/40?img=${user.id}`} />
                </ListItemAvatar>
                <ListItemText primary={user.name} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Persistent Sidebar for desktop */}
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          width: isSidebarOpen ? 230 : 0,
          transition: "width 0.3s ease",
          overflow: "hidden",
          backgroundColor: "#1976d2",
          color: "#fff",
          paddingTop: "64px",
        }}
      >
        <Box sx={{ width: 240 }}>
          <Typography variant="h6" sx={{ p: 2, fontWeight: "bold", color: "#fff" }}>
            Active Conversations
          </Typography>
          <List>
            {users.map((user) => (
              <ListItem button key={user.id} onClick={() => handleUserClick(user)}>
                <ListItemAvatar>
                  <Avatar src={`https://i.pravatar.cc/40?img=${user.id}`} />
                </ListItemAvatar>
                <ListItemText primary={user.name} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>

      {/* Chat area */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          marginLeft: isSidebarOpen && !isSmallScreen ? "240px" : 0,
          transition: "margin-left 0.3s ease",
          height: "100%",
          bgcolor: "background.paper",
          borderRadius: 2,
        }}
      >
        {/* Chat Header */}
        <Toolbar
          sx={{
            display: { xs: "none", md: "flex" },
            borderBottom: "1px solid #ccc",
            paddingX: 2,
            bgcolor: "grey.200",
            minHeight: "64px",
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            {selectedUser ? selectedUser.name : "Select a user"}
          </Typography>
        </Toolbar>

        {/* Chat Messages */}
        <Box
          id="chatArea"
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 2,
            bgcolor: "grey.100",
            borderRadius: "8px",
            marginTop: 1,
            height: "calc(100vh - 220px)",
          }}
        >
          {messages.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              No messages yet.
            </Typography>
          ) : (
            messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: msg.sender_id === user.id ? "flex-end" : "flex-start",
                  mb: 1.5,
                }}
              >
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    maxWidth: "70%",
                    borderRadius: 2,
                    bgcolor: msg.sender_id === user.id ? "primary.main" : "background.paper",
                    color: msg.sender_id === user.id ? "#fff" : "text.primary",
                  }}
                >
                  <Typography variant="body1">{msg.message}</Typography>
                </Paper>
              </Box>
            ))
          )}
        </Box>

        {/* Message Input */}
        <Box
          sx={{
            display: "flex",
            p: 2,
            borderTop: "1px solid #ccc",
            alignItems: "center",
            bgcolor: "grey.200",
          }}
        >
          <TextField
            variant="outlined"
            placeholder="Type something here..."
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={{
              mr: 2,
              bgcolor: "white",
              borderRadius: 1,
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "grey.400",
                },
              },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSendMessage}
            sx={{ height: "100%", bgcolor: "primary.main" }}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
