import React, { useEffect, useState } from "react";
import axios from "../axiosClient";
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
  useMediaQuery,
} from "@mui/material";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function BookingClient() {
  const [transactions, setTransactions] = useState([]);
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get("/client-trans", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const filteredTransactions = response.data.data.filter(
        (transaction) =>
          transaction.transaction_type === "Waiting for Approval" &&
          transaction.status === "PENDING"
      );
      setTransactions(filteredTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions.");
    }
  };

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
        fetchTransactions();
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
        fetchTransactions();
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

  return (
    <Box
      sx={{
        width: "100%",
        mt: 3,
        backgroundColor: "#f59e0b", // Match Dashboard style
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "30px",
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Typography
        variant="h6"
        align="center"
        sx={{
          fontWeight: 600,
          color: "white",
          mb: 2,
        }}
      >
        Transactions Waiting for Approval
      </Typography>
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: "10px",
          overflow: "auto",
          maxHeight: "400px",
        }}
      >
        {isMobile ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <Box
                  key={transaction.id}
                  sx={{
                    padding: 2,
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    backgroundColor: "#fff",
                  }}
                >
                  <Typography>
                    <strong>Performer:</strong>{" "}
                    {transaction.performer_name || "N/A"}
                  </Typography>
                  <Typography>
                    <strong>Amount:</strong> ₱
                    {parseFloat(transaction.amount).toFixed(2)}
                  </Typography>
                  <Typography>
                    <strong>Date:</strong>{" "}
                    {transaction.start_date
                      ? new Date(transaction.start_date).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "N/A"}
                  </Typography>
                  <Typography>
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        backgroundColor: "#FBBF24",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "8px",
                        fontSize: "0.8em",
                      }}
                    >
                      {transaction.status}
                    </span>
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 2,
                    }}
                  >
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => handleApprove(transaction.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => handleDecline(transaction.id)}
                    >
                      Decline
                    </Button>
                  </Box>
                </Box>
              ))
            ) : (
              <Typography align="center">No transactions found.</Typography>
            )}
          </Box>
        ) : (
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Performer</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Date of Booking</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {transaction.performer_name || "Performer Name"}
                    </TableCell>
                    <TableCell>
                      ₱{parseFloat(transaction.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {transaction.start_date
                        ? new Date(transaction.start_date).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <span
                        style={{
                          backgroundColor: "#FBBF24",
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
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => handleApprove(transaction.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => handleDecline(transaction.id)}
                        >
                          Decline
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
}
