require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const serverless = require("serverless-http");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Create Express App
const app = express();
app.use(express.json()); // Middleware to parse JSON

// 2. Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;

// Middleware to check for MONGO_URI before any route handler
app.use((req, res, next) => {
    if (!MONGO_URI) {
        console.error("FATAL ERROR: MONGO_URI is not defined.");
        return res.status(500).json({ msg: "Server configuration error: Database URI is missing." });
    }
    next();
});

// Establish MongoDB connection once
mongoose.connect(MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// 3. Define Mongoose Schemas & Models
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
});
const User = mongoose.model('User', userSchema);

const grievanceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  submitterUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  location: { 
    address: String,
    lat: Number,
    lng: Number,
   },
  aiPriority: String,
  category: String,
  summary: String,
  upvotes: { type: Number, default: 0 },
  upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});
const Grievance = mongoose.model('Grievance', grievanceSchema);

// 4. API Routes
const router = express.Router();

// --- AUTH CHECKER --- 
const checkJwtSecret = (req, res, next) => {
    if (!process.env.JWT_SECRET) {
        console.error("FATAL ERROR: JWT_SECRET is not defined.");
        return res.status(500).json({ msg: "Server configuration error: JWT Secret is missing." });
    }
    next();
}

// --- AUTH ROUTES ---
router.post("/users/register", checkJwtSecret, async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    user = new User({ name, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
      if (err) throw err;
      res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    });
  } catch (err) {
    console.error("Register Error:", err.message);
    res.status(500).send('Server error');
  }
});

router.post("/users/login", checkJwtSecret, async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).send('Server error');
  }
});

// --- GRIEVANCE ROUTES ---
router.get("/grievances", async (req, res) => {
  try {
    const grievances = await Grievance.find().populate('submitterUserId', 'name').sort({ createdAt: -1 });
    res.json(grievances);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/grievances", async (req, res) => {
  try {
    const newGrievance = new Grievance({
        ...req.body
    });
    const savedGrievance = await newGrievance.save();
    res.status(201).json(savedGrievance);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/grievances/:id", async (req, res) => {
    try {
        const updatedGrievance = await Grievance.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedGrievance) {
            return res.status(404).json({ message: "Grievance not found" });
        }
        res.json(updatedGrievance);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete("/grievances/:id", async (req, res) => {
    try {
        const deletedGrievance = await Grievance.findByIdAndDelete(req.params.id);
        if (!deletedGrievance) {
            return res.status(404).json({ message: "Grievance not found" });
        }
        res.json({ message: "Grievance deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// 5. Mount the router and export for serverless
app.use('/api', router);
module.exports.handler = serverless(app);