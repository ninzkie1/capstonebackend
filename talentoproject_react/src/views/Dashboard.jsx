import React, { useEffect, useState } from "react";
import axios from "../axiosClient";
import dayjs from "dayjs";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get("/transactions", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setTransactions(response.data.data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Failed to load transactions.");
      }
    };

    fetchTransactions();
  }, []);



  const handleApprove = async (transactionId) => {
    try {
      const response = await axios.put(
        `/transactions/${transactionId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.status === 200) {
        toast.success("Transaction approved.");
        fetchTransactions();  // Re-fetch the transactions after approval
      } else {
        toast.error("Failed to approve transaction. Unexpected response.");
      }
    } catch (error) {
      console.error("Error approving transaction:", error.response || error);
      toast.error(
        error.response?.data?.error || "Failed to approve transaction."
      );
    }
  };

  const handleDecline = async (transactionId) => {
    try {
      const response = await axios.put(
        `/transactions/${transactionId}/decline`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.status === 200) {
        toast.success("Transaction declined.");
        fetchTransactions();  // Re-fetch the transactions after decline
      } else {
        toast.error("Failed to decline transaction. Unexpected response.");
      }
    } catch (error) {
      console.error("Error declining transaction:", error.response || error);
      toast.error(
        error.response?.data?.error || "Failed to decline transaction."
      );
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get("/transactions", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setTransactions(response.data.data);  // Update transactions with latest data
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions.");
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <ToastContainer />
      <Typography variant="h5" gutterBottom>
        Transaction History
      </Typography>
      <TableContainer component={Paper} sx={{ maxHeight: "500px", overflowY: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Performer</TableCell>
              <TableCell>Transaction Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Date of Booking</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.performer_name || "Performer Name"}</TableCell>
                  <TableCell>{transaction.transaction_type}</TableCell>
                  <TableCell>₱{parseFloat(transaction.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    {dayjs(transaction.start_date).isValid()
                      ? dayjs(transaction.start_date).format("MMMM D, YYYY")
                      : "Invalid Date"}
                  </TableCell>
                  <TableCell>
                    <span
                      style={{
                        backgroundColor:
                          transaction.status === "PENDING"
                            ? "#FBBF24"
                            : transaction.status === "APPROVED"
                            ? "#22C55E"
                            : transaction.status === "DECLINED"
                            ? "#EF4444"
                            : "#AAAAAA",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "8px",
                        fontSize: "0.8em",
                      }}
                    >
                      {transaction.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {transaction.transaction_type === "Booking Received" && transaction.status === "PENDING" ? (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Box
                          sx={{
                            backgroundColor: "#D1E7DD",
                            padding: "4px",
                            borderRadius: "8px",
                            display: "inline-flex",
                          }}
                        >
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleApprove(transaction.id)}
                            sx={{ backgroundColor: "transparent", color: "#155724" }}
                          >
                            Approve
                          </Button>
                        </Box>
                        <Box
                          sx={{
                            backgroundColor: "#F8D7DA",
                            padding: "4px",
                            borderRadius: "8px",
                            display: "inline-flex",
                          }}
                        >
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => handleDecline(transaction.id)}
                            sx={{ backgroundColor: "transparent", color: "#721C24" }}
                          >
                            Decline
                          </Button>
                        </Box>
                      </Box>
                    ) : transaction.status === "PENDING" ? (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ marginRight: 1 }}>
                          Processing
                        </Typography>
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      "Completed"
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
