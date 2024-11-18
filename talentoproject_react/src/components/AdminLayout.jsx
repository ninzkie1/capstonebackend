import React, { useState } from "react";
import Logo from "../assets/logotalentos.png";
import Notification from "../views/Notification";
import { Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  ListItemIcon,
  Toolbar,
  AppBar,
  Drawer,
  Avatar,
  useMediaQuery,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Logout as PowerIcon,
  BarChart as ChartBarIcon,
  Work as BriefcaseIcon,
  People as UserCircleIcon,
  Campaign as CampaignIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useStateContext } from "../context/contextprovider";

export default function AdminLayout() {
  const { user, token, setToken, setUser } = useStateContext();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  // Function to determine the page title based on the current route
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/ManagePost":
        return "Admin Post";
      case "/reports":
        return "Reports";
      case "/ManageBooking":
        return "Manage Bookings";
      case "/CoinRequest":
        return "Coin Requests";
      case "/Performers":
        return "Manage Feedback";
      case "/users":
        return "Users";
        case "/PendingPerformers":
        return "Manage Performer";
      default:
        return "Talento Admin Dashboard";
    }
  };

  // Toggle sidebar open/close
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle Logout
  const onLogout = (ev) => {
    ev.preventDefault();
    setToken(null);
    setUser(null);
    localStorage.removeItem("USER_DATA");
  };

  // Navigation functions for different sections
  const navigateTo = (route) => {
    navigate(route);
  };

  if (!token) {
    return <Navigate to="/login" />;
  }

  // Sidebar content extracted into a component for reusability
  const SidebarContent = () => (
    <>
      <Box sx={{ display: "flex", alignItems: "center", p: 1 }}>
        <Avatar
          src={Logo}
          alt="Talento Logo"
          sx={{
            width: 70,
            height: 70,
            marginRight: 1,
            border: "2px solid #fff",
          }}
        />
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{
            fontSize: "1.5rem",
            lineHeight: "2rem",
            flexGrow: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Welcome <br></br>{user ? user.role : ""} <br></br>{user ? user.name : "Guest"}!
        </Typography>
        {isSmallScreen && (
          <IconButton onClick={toggleSidebar} sx={{ color: "white", ml: "auto" }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      <List sx={{ p: 2 }}>
        {[
          { text: "Post", icon:<CampaignIcon />, route: "/ManagePost" },
          { text: "Reporting", icon: <ChartBarIcon />, route: "/reports" },
          { text: "Bookings", icon: <BriefcaseIcon />, route: "/ManageBooking" },
          { text: "TalentoCoins", icon: <BriefcaseIcon />, route: "/CoinRequest" },
          { text: "Feedback", icon: <UserCircleIcon />, route: "/Performers" },
          { text: "Users", icon: <UserCircleIcon />, route: "/users" },
          { text: "Performers", icon: <UserCircleIcon />, route: "/PendingPerformers" },
          { text: "Log Out", icon: <PowerIcon />, action: onLogout },
        ].map((item, index) => (
          <ListItem
            button
            key={index}
            onClick={item.route ? () => navigateTo(item.route) : item.action}
            sx={{
              paddingY: 1.5,  
              paddingX: 2.5,
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
              },
              borderRadius: "4px",
              marginBottom: "2px",
              transition: "background-color 0.3s ease",
            }}
          >
            <ListItemIcon
              sx={{
                color: "white",
                minWidth: "32px",  // Reduced icon container width
                "& > *": {
                  fontSize: "1.2rem", // Reduced icon size
                },
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontSize: "0.85rem",  // Reduced font size for more compactness
                fontWeight: "bold",
                color: "white",
              }}
            />
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* AppBar for top navigation with burger menu */}
      <AppBar position="fixed" sx={{ backgroundColor: theme.palette.primary.main }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <IconButton edge="start" color="inherit" onClick={toggleSidebar}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: "center" }}>
            {getPageTitle()}
          </Typography>
          {/* Notification Component */}
          <Notification />
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      {isSmallScreen ? (
        <Drawer
          anchor="left"
          open={isSidebarOpen}
          onClose={toggleSidebar}
          sx={{
            "& .MuiDrawer-paper": {
              backgroundColor: theme.palette.primary.main,
              color: "#fff",
              width: 250,
            },
          }}
        >
          <SidebarContent />
        </Drawer>
      ) : (
        <Box
          sx={{
            width: isSidebarOpen ? 250 : 0,
            transition: "width 0.3s ease",
            overflow: "hidden",
            backgroundColor: theme.palette.primary.main,
            color: "#fff",
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            paddingTop: "64px", // Height of the AppBar
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <SidebarContent />
        </Box>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginLeft: isSidebarOpen && !isSmallScreen ? "200px" : 0,
          transition: "margin-left 0.3s ease",
          padding: 3,
        }}
      >
        {/* Toolbar for spacing */}
        <Toolbar />
        {/* Outlet for Nested Routes */}
        <Outlet context={{ isSidebarOpen }} />
      </Box>
    </Box>
  );
}
