import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './views/Login';
import Register from './views/Register';
import PerformerLayout from './components/PerformerLayout';
import GuestLayout from './components/GuestLayout';
import AdminLayout from './components/AdminLayout';
import Customer from './views/Customer';
import Users from './views/Users';
import Reporting from './views/Reporting';
import Booking from './views/Booking';
import Messages from './views/Messages';
import Portfolio from './views/Portfolio';
import AddBook from './views/AddBook';
import CustomerLayout from './components/CustomerLayout';
import ManagePerformer from './views/ManagePerformer';
import HomePage from './views/HomePage'; 
import CustomerProfile from './views/CustomerProfile';
import ChatCustomer from './views/ChatCustomer';
import Payment from './views/Payment';


// Assume you get the role from the user's context or state
import { useStateContext } from './context/contextprovider';
import Post from './views/Post';
import ClientPost from './views/ClientPost';
import ForgotPassword from './views/ForgotPassword';
import AdminPost from './views/AdminPost';

import ManageBooking from './views/ManageBooking';
import Applicants from './views/Applicants';
import Walletclient from './views/Walletclient';
import Dashboard from './views/Dashboard';
import ViewPortfolio from './views/ViewPortfolio';
import AdminCoins from './views/AdminCoins';
import WalletPerformer from './views/WalletPerformer';
import Notification from './views/Notification';
import UserNotification from './views/UserNotification';
import Bookingdesign from './views/Bookingdesign';
import PendingPerformer from './views/PendingPerformer';
import NotFound from './views/NotFound';
import PasswordReset from './views/PasswordReset';
import AboutUs from './views/AboutUs';
import BookingClient from './views/BookingClient';
import ChatApplicants from './views/ChatApplicants';
import ChatClientPost from './views/ChatClientPost';


function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useStateContext();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return children;
}

// Role-based redirect component
function RoleBasedRedirect() {
  const { user } = useStateContext();

  if (!user) {
    // If no user, redirect to login
    return <Navigate to="/home" />;
  }

  // Redirect based on the user's role
  if (user.role === 'admin') {
    return <Navigate to="/reports" />;
  } else if (user.role === 'client') {
    return <Navigate to="/customer" />;
  } else if (user.role === 'performer') {
    return <Navigate to="/portfolio" />;
  } else {
    // If role is unknown, fallback to login
    return <Navigate to="/login" />;
  }
}

const router = createBrowserRouter([

  // Base route - handles role-based redirects
  {
    path: '/',
    element: <RoleBasedRedirect />, // Redirect based on role
  },

  // Performer routes role = performer
  {
    path: '/',
    element:  <ProtectedRoute allowedRoles={['performer']}><PerformerLayout /></ProtectedRoute>,
    children: [
      {
        path: 'portfolio',
        element: <Portfolio />
      },
      {
        path: 'chat',
        element: <Messages />
      },
      {
        path: 'ChatApplicants',
        element: <ChatApplicants/>

      },
      {
        path: 'post',
        element : <Post/>
      },
      {
        path: 'booking',
        element : <Booking/>
      },
      {
        path: 'bookingd',
        element : <Bookingdesign/>
      },
      {
        path: 'passwordchange',
        element : <ForgotPassword/>
      },
      {
        path: 'performer-wallet',
        element : <WalletPerformer/>
      }
    ]
  },

  // Customer routes role = client
  {
    path: '/',
    element: <ProtectedRoute allowedRoles={['client']}><CustomerLayout /></ProtectedRoute>,
    children: [
      {
        path: 'customer',
        element: <Customer />
      },
      {
        path: 'Dashboard',
        element: <Dashboard />
      },
      {
        path: 'addBook',
        element: <AddBook />
      },
      {
        path: 'portfolio/:portfolioId',
        element: <ViewPortfolio/>
      },
      {
        path:'Chats',
        element: <ChatCustomer/>
      },
      {
        path:'payment',
        element: <Payment/>
      },
      {
        path: 'applicants',
        element : <Applicants/>
      },
      {
        path: 'posts',
        element : <ClientPost/>
      },
      {
        path: 'password-change',
        element : <ForgotPassword/>
      },
      {
        path:'customer-profile',
        element: <CustomerProfile/>
      },
      {
        path: 'Wallet',
        element: <Walletclient/>
      },
      {
        path: 'BookingClient',
        element: <BookingClient/>
      },
      {
        path: 'ChatClientPost',
        element: <ChatClientPost/>
      }
    ]
  },

  // Admin routes role = admin
  {
    path: '',
    element: <ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>,
    children: [
      {
        path: 'reports',
        element: <Reporting />
      },
      {
        path: 'users',
        element: <Users />
      },
      {
        path: 'performers',
        element: <ManagePerformer />
      },
       {
        path: 'ManagePost',
        element : <AdminPost/>
      },
      {
        path: 'ManageBooking',
        element : <ManageBooking/>
      },
      
      {
        path: 'CoinRequest',
        element: <AdminCoins/>
      },
      {
        path: 'Notification',
        element: <Notification/>
      },
      {
        path: 'PendingPerformers',
        element: <PendingPerformer/>
      }
    ]
  },

  // Guest routes (Login/Register)
  {
    path: '/',
    element: <GuestLayout />,
    children: [
      {
        path: 'Home',
        element: <HomePage/>
      },
      {
        path: 'register',
        element: <Register />
      },
      {
        path: 'login',
        element: <Login />
      },
      {
        path: 'forgotpw',
        element : <ForgotPassword/>
      },
      {
        path: 'password-reset',
        element : <PasswordReset/>
      },
      {
        path: 'aboutus',
        element: <AboutUs/>
       },
     {
      path: 'Notify',
      element: <UserNotification/>
     }
    ]
  },
  {
    path: '*',
    element: <NotFound/>
  }
]);

export default router;
