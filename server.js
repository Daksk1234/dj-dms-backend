const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

app.use("/api/master", require("./routes/master"));
app.use("/api/super-admin", require("./routes/superAdmin"));
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/schallans", require("./routes/sChallanRoutes"));
app.use("/api/pchallans", require("./routes/pChallanRoutes"));
app.use("/api/receipts", require("./routes/receiptRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/ledger", require("./routes/ledgerRoutes"));
app.use("/api/units", require("./routes/unitRoutes"));
app.use("/api/cashbook", require("./routes/cashbookRoutes"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/production", require("./routes/productionRoutes"));
app.use("/api/employees", require("./routes/employeeRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/adjustments", require("./routes/adjustmentRoutes"));

app.get("/api/test", (req, res) => {
  res.json({ success: true });
});

app.listen(5000, () => console.log("Server running on port 5000"));
