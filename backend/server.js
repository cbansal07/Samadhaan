
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
mongoose.connect(uri);
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
})

const grievancesRouter = require('./routes/grievances');
app.use('/api/grievances', grievancesRouter);

const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
