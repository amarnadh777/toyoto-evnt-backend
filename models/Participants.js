const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
{
  name: { type: String, required: true },

  email: { type: String, trim: true, lowercase: true },

  phone: { type: String, trim: true },

  // ⭐ list number (1, 2, 3...)
 listNumber: {
  type: Number,
  unique: true,
  sparse: true,   // ⭐ IMPORTANT FIX
  default: null
}
,

  checkedIn: {
    type: Boolean,
    default: false
  },

  checkedInAt: {
    type: Date,
    default: null
  },

  qrCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  }

},
{
  timestamps: true
}
);

const Participant = mongoose.model('Participant', participantSchema);

module.exports = Participant;
