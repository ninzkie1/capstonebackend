import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import axiosClient from "../axiosClient";
import {
  Box,
  Button,
  Typography,
  Modal,
  TextField,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  maxWidth: 400,
  maxHeight: "90vh",
  overflowY: "auto",
  bgcolor: "background.paper",
  borderRadius: "8px",
  boxShadow: 24,
  p: 4,
};

export default function AdminCoins() {
  const [requests, setRequests] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [talentoCoin, setTalentoCoin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalType, setModalType] = useState("");
  const [walletInfo, setWalletInfo] = useState({
    account_name: "",
    account_number: "",
    qr_code_url: "",
    qr_image: null,
  });
  const [walletId, setWalletId] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isWalletInfoVisible, setIsWalletInfoVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Function to fetch initial data
  const fetchInitialData = async () => {
    try {
      const [depositRes, withdrawRes, historyRes, walletRes] = await Promise.all([
        axiosClient.get("/display-request"),
        axiosClient.get("/display-withdraw-request"),
        axiosClient.get("/request-history"),
        axiosClient.get("/wallet-info"),
      ]);

      if (depositRes.status === 200) setRequests(depositRes.data.data.reverse());
      if (withdrawRes.status === 200) setWithdrawRequests(withdrawRes.data.data.reverse());
      if (historyRes.status === 200) setHistory(historyRes.data.data.reverse());

      if (walletRes.status === 200 && walletRes.data.wallet) {
        setWalletInfo(walletRes.data.wallet);
        setWalletId(walletRes.data.wallet.id);
        setIsEditing(true); // Set isEditing to true if wallet data is present
      }
    } catch (error) {
      // toast.error("Failed to fetch initial data.");
    }
  };

  useEffect(() => {
    fetchInitialData();

    // Set up Laravel Echo with Pusher for real-time updates
    window.Pusher = Pusher;
    window.Echo = new Echo({
      broadcaster: "pusher",
      key: "e1070b4f8d56ec053cee",
      cluster: "us2",
      forceTLS: true,
    });

    window.Echo.channel("admin-notifications")
      .listen(".new-deposit-request", (event) => {
        setRequests((prevRequests) => [event.depositRequest, ...prevRequests]);
      })
      .listen(".new-withdraw-request", (event) => {
        setWithdrawRequests((prevWithdrawRequests) => [
          event.withdrawRequest,
          ...prevWithdrawRequests,
        ]);
      })
      .listen(".request-history-updated", (event) => {
        setHistory((prevHistory) => [event.requestHistory, ...prevHistory]);
      });

    return () => {
      window.Echo.leaveChannel("admin-notifications");
    };
  }, []);

 
const handleAccept = (request, type) => {
  setSelectedRequest(request);
  setModalType(type); 
  setShowModal(true);
};

   const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRequest(null); // Reset selected request to ensure no leftover state
    setModalType(""); // Reset modalType to ensure no leftover type
    setTalentoCoin(""); // Clear the input field
  };

  // Handle Decline Action
  const handleDecline = async (id, type) => {
    const confirmed = window.confirm("Are you sure you want to decline this request?");
    if (!confirmed) {
      return;
    }

    try {
      const endpoint =
        type === "withdraw" ? `/withdrawals/${id}/decline` : `/payments/${id}/decline`;
      const response = await axiosClient.post(endpoint);
      if (response.status === 200) {
        toast.success(`Request ID ${id} declined successfully.`);
        fetchInitialData(); // Refresh the data after declining
      } else {
        toast.error("Failed to decline request.");
      }
    } catch (error) {
      toast.error("Failed to decline request.");
    }
  };

  // Handle Input Change for TalentoCoin Amount
  const handleInputChange = (e) => {
    setTalentoCoin(e.target.value);
  };

  const handleApproveTalentoCoin = async () => {
    if (!talentoCoin) {
      toast.error("Please enter the amount of TalentoCoin.");
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint =
        modalType === "deposit"
          ? `/payments/${selectedRequest.id}/approve`
          : `/withdrawals/${selectedRequest.id}/approve`;

      const response = await axiosClient.post(endpoint, { amount: talentoCoin });

      if (response.status === 200) {
        toast.success(
          `Successfully ${modalType === "deposit" ? "added" : "deducted"} ${talentoCoin} TalentoCoins ${
            modalType === "deposit" ? "to" : "from"
          } ${selectedRequest.user.name}`
        );
        handleCloseModal(); // Close modal after success
        fetchInitialData();
      } else {
        toast.error("Failed to approve request.");
      }
    } catch (error) {
      toast.error("Failed to approve request.");
    } finally {
      setIsSubmitting(false);
    }
  };


  // Handle Input Change for Wallet Info
  const handleWalletInputChange = (e) => {
    const { name, value } = e.target;
    setWalletInfo((prev) => ({ ...prev, [name]: value }));
  };

  // Handle QR Code Change for Wallet Info
  const handleQRImageChange = (e) => {
    setWalletInfo((prev) => ({ ...prev, qr_image: e.target.files[0] }));
  };

 // Save wallet information (either create or update)
 const handleSaveWalletInfo = async () => {
  if (!walletInfo.account_name || !walletInfo.account_number) {
    toast.error("Account name and account number are required.");
    return;
  }

  setIsSubmitting(true);

  try {
    const formData = new FormData();
    formData.append("account_name", walletInfo.account_name);
    formData.append("account_number", walletInfo.account_number);
    if (walletInfo.qr_image) {
      formData.append("qr_image", walletInfo.qr_image);
    }

    let response;

    if (isEditing && walletId) {
      // Update existing wallet info
      response = await axiosClient.post(`/wallet-info/${walletId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } else {
      // Create new wallet info
      response = await axiosClient.post("/wallet-info", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    }

    if (response.status === 200 || response.status === 201) {
      toast.success("Wallet information saved successfully.");
      setShowWalletModal(false);
      fetchInitialData(); // Fetch updated wallet information
    } else {
      toast.error("Failed to save wallet information.");
    }
  } catch (error) {
    toast.error("Failed to save wallet information.");
  } finally {
    setIsSubmitting(false);
  }
};
  return (
    <div className="container mx-auto p-6">
      <div className="container mx-auto p-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Admin Wallet Information</h1>
        <div className="mb-6">
          <Typography variant="body1">
            <strong>Account Name:</strong> {walletInfo.account_name || "Not Available"}
          </Typography>
          <Typography variant="body1">
            <strong>Account Number:</strong> {walletInfo.account_number || "Not Available"}
          </Typography>
          {walletInfo.qr_code_url && (
            <div className="mt-2">
              <img src={walletInfo.qr_code_url} alt="QR Code" className="h-32 w-32" />
            </div>
          )}
          <Button
            variant="contained"
            color="primary"
            className="mt-4"
            onClick={() => {
              setShowWalletModal(true);
              setIsEditing(true); // Set isEditing to true to update wallet info
            }}
          >
            {walletId ? "Update Wallet Info" : "Add Wallet Info"}
          </Button>
        </div>

        {/* Modal for Adding/Updating Wallet Info */}
        <Modal open={showWalletModal} onClose={() => setShowWalletModal(false)}>
          <Box sx={modalStyle}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" component="h2">
                {isEditing ? "Update Admin Wallet Information" : "Add Admin Wallet Information"}
              </Typography>
              <IconButton onClick={() => setShowWalletModal(false)}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Box mb={3}>
              <TextField
                fullWidth
                label="Account Name"
                name="account_name"
                value={walletInfo.account_name}
                onChange={handleWalletInputChange}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Account Number"
                name="account_number"
                value={walletInfo.account_number}
                onChange={handleWalletInputChange}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <input type="file" accept="image/*" onChange={handleQRImageChange} />
            </Box>
            <Box display="flex" justifyContent="flex-end">
              <Button
                onClick={handleSaveWalletInfo}
                variant="contained"
                color="success"
                sx={{ mr: 2 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : isEditing ? "Update" : "Save"}
              </Button>
              <Button onClick={() => setShowWalletModal(false)} variant="outlined">
                Cancel
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Pending Deposit Requests */}
       {/* Pending Deposit Requests */}
<h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Pending Deposit Requests</h1>
<div className="overflow-x-auto overflow-y-auto max-h-96 mb-6">
  <table className="min-w-full bg-white shadow-md rounded-lg">
    <thead className="bg-gray-200 sticky top-0">
      <tr>
        <th className="sticky top-0 px-2 md:px-4 py-2 text-left">User Name</th>
        <th className="sticky top-0 px-2 md:px-4 py-2 text-left">Date</th>
        <th className="sticky top-0 px-2 md:px-4 py-2 text-left">Amount</th>
        <th className="sticky top-0 px-2 md:px-4 py-2 text-left">Reference No.</th>
        <th className="sticky top-0 px-2 md:px-4 py-2 text-left">Receipt</th>
        <th className="sticky top-0 px-2 md:px-4 py-2 text-left">Status</th>
        <th className="sticky top-0 px-2 md:px-4 py-2 text-left">Actions</th>
      </tr>
    </thead>
    <tbody>
      {requests.map((request) => (
        <tr key={request.id} className="border-b text-xs md:text-base">
          <td className="border px-2 md:px-4 py-2">{request.user?.name}</td>
          <td className="border px-2 md:px-4 py-2">
            {new Date(request.created_at).toLocaleDateString()}
          </td>
          <td className="border px-2 md:px-4 py-2">{request.amount}</td>
          <td className="border px-2 md:px-4 py-2">{request.reference_number}</td>
          <td className="border px-2 md:px-4 py-2">
            <a
              href={`http://localhost:8000/storage/${request.receipt_path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              View Receipt
            </a>
          </td>
          <td className="border px-2 md:px-4 py-2">
            <span
              className={`${
                request.status === "PENDING" ? "bg-yellow-400" : "bg-green-500"
              } text-white py-1 px-3 rounded-full text-xs`}
            >
              {request.status}
            </span>
          </td>
          <td className="border px-4 py-2">
            {request.status === "PENDING" && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAccept(request, "deposit")} // Pass 'deposit' here to set the modal type correctly
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDecline(request.id, "deposit")} // Pass 'deposit' for decline
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                >
                  Decline
                </button>
              </div>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

{/* Pending Withdraw Requests */}
<h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Pending Withdraw Requests</h1>
<div className="overflow-x-auto overflow-y-auto max-h-96 mb-6">
  <table className="min-w-full bg-white shadow-md rounded-lg">
    <thead className="bg-gray-200 sticky top-0">
      <tr>
        <th className="sticky top-0 px-2 md:px-4 py-2 text-left">User Name</th>
        <th className="sticky top-0 px-2 md:px-4 py-2 text-left">Date</th>
        <th className="sticky top-0 px-2 md:px-4 py-2 text-left">Balance</th>
        <th className="sticky top-0 px-2 md:px-4 py-2 text-left">Amount</th>
        <th className="sticky top-0 px-2 md:px-4 py-2 text-left">Account No.</th>
        <th className="sticky top-0 px-2 md:px-4 py-2 text-left">QR Code</th>
        <th className="sticky top-0 px-2 md:px-4 py-2 text-left">Status</th>
        <th className="sticky top-0 px-2 md:px-4 py-2 text-left">Actions</th>
      </tr>
    </thead>
    <tbody>
      {withdrawRequests.map((request) => (
        <tr key={request.id} className="border-b text-xs md:text-base">
          <td className="border px-2 md:px-4 py-2">{request.user?.name}</td>
          <td className="border px-2 md:px-4 py-2">
            {new Date(request.created_at).toLocaleDateString()}
          </td>
          <td className="border px-2 md:px-4 py-2">{request.user?.talento_coin_balance}</td>
          <td className="border px-2 md:px-4 py-2">{request.amount}</td>
          <td className="border px-2 md:px-4 py-2">{request.account_number}</td>
          <td className="border px-2 md:px-4 py-2">
            <a
              href={`http://localhost:8000/storage/${request.qr_code_path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              View QR Code
            </a>
          </td>
          <td className="border px-2 md:px-4 py-2">
            <span
              className={`${
                request.status === "PENDING" ? "bg-yellow-400" : "bg-green-500"
              } text-white py-1 px-3 rounded-full text-xs`}
            >
              {request.status}
            </span>
          </td>
          <td className="border px-4 py-2">
            {request.status === "PENDING" && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAccept(request, "withdraw")} // Pass 'withdraw' here to set the modal type correctly
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDecline(request.id, "withdraw")} // Pass 'withdraw' for decline
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                >
                  Decline
                </button>
              </div>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Request History</h1>
        <div className="overflow-x-auto overflow-y-auto max-h-96 mb-6">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead className="bg-gray-200 sticky top-0">
              <tr>
                <th className="sticky top-0 px-2 md:px-4 py-2 text-left">User Name</th>
                <th className="sticky top-0 px-2 md:px-4 py-2 text-left">Date</th>
                <th className="sticky top-0 px-2 md:px-4 py-2 text-left">Balance Before</th>
                <th className="sticky top-0 px-2 md:px-4 py-2 text-left">Balance After</th>
                <th className="sticky top-0 px-2 md:px-4 py-2 text-left">Amount</th>
                <th className="sticky top-0 px-2 md:px-4 py-2 text-left">Reference No.</th>
                <th className="sticky top-0 px-2 md:px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id} className="border-b text-xs md:text-base">
                  <td className="border px-2 md:px-4 py-2">{entry.user?.name}</td>
                  <td className="border px-2 md:px-4 py-2">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                  <td className="border px-2 md:px-4 py-2">{entry.balance_before}</td>
                  <td className="border px-2 md:px-4 py-2">{entry.balance_after}</td>
                  <td className="border px-2 md:px-4 py-2">{entry.amount}</td>
                  <td className="border px-2 md:px-4 py-2">{entry.reference_number}</td>
                  <td className="border px-2 md:px-4 py-2">
                    <span
                      className={`${
                        entry.status === "APPROVED"
                          ? "bg-green-500"
                          : entry.status === "REJECTED"
                          ? "bg-red-500"
                          : "bg-yellow-400"
                      } text-white py-1 px-3 rounded-full text-xs`}
                    >
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal for Adding/Deducting TalentoCoin */}
        <Modal
        open={showModal}
        onClose={handleCloseModal}
        aria-labelledby="add-talentocoin-modal-title"
      >
        <Box sx={modalStyle}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography id="add-talentocoin-modal-title" variant="h6" component="h2">
              {modalType === "deposit"
                ? `Add TalentoCoin to ${selectedRequest?.user?.name}`
                : `Deduct TalentoCoin from ${selectedRequest?.user?.name}`}
            </Typography>
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box mb={3}>
            <TextField
              fullWidth
              label="Amount of TalentoCoin"
              value={talentoCoin}
              onChange={handleInputChange}
              variant="outlined"
              type="number"
              sx={{ mb: 2 }}
            />
          </Box>

          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button
              onClick={handleApproveTalentoCoin}
              variant="contained"
              color="success"
              sx={{ mr: 2 }}
              disabled={isSubmitting}
              startIcon={isSubmitting && <CircularProgress size={20} />}
            >
              {isSubmitting
                ? "Processing..."
                : modalType === "deposit"
                ? "Add TalentoCoin"
                : "Deduct TalentoCoin"}
            </Button>
            <Button onClick={handleCloseModal} variant="outlined" color="inherit">
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

        <ToastContainer />
      </div>
    </div>
  );
}
