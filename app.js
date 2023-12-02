const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });
const morgan = require('morgan');
const port = process.env.PORT || 4000;
app.use(express.json());
app.use(cors());
const { connect } = require("./config/connection");
connect();
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoute");
app.use(morgan('dev'));
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.listen(port, () => {
  console.log(`server is running at ${port}`);
});
