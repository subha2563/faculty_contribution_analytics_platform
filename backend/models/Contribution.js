// backend/models/Contribution.js
const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, default: 'Pending' },
  documentPath: { type: String },
  // 👇 NEW: Link the paper to the specific Faculty member
  facultyName: { type: String, required: true },
  facultyEmail: { type: String, required: true },
  department: { type: String, required: true, default: 'CSE' },
  tier: { type: String, required: true, default: 'Tier 2' },
  pointsAwarded: { type: Number, default: 0 },
  
  // NBA Audit additions
  credentialId: { type: String, required: true },
  
  // Co-Author Dynamism
  primaryAuthorPercentage: { type: Number, default: 100 },
  coAuthors: { 
    type: [{
      name: String,
      email: String,
      percentage: Number
    }], 
    default: [] 
  },
  
  rejectionReason: { type: String, default: "" }
});

module.exports = mongoose.model('Contribution', contributionSchema);