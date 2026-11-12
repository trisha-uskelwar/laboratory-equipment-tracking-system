
const mongoose = require('mongoose')

const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Equipment name is required'],
      trim: true,
    },

    category: {
      type: String,
      required: [true, 'Equipment category is required'],
      trim: true,
    },

    lab: {
      type: String,
      required: [true, 'Lab name is required'],
      trim: true,
    },

    condition: {
      type: String,
      enum: ['Good', 'Needs repair'],
      default: 'Good',
    },

    status: {
      type: String,
      enum: ['Available', 'Issued', 'Maintenance'],
      default: 'Available',
    },

    // Issue and return tracking
    issuedTo: {
      type: String,
      trim: true,
      default: '',
    },

    issuedAt: {
      type: Date,
      default: null,
    },

    expectedReturnDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

const Equipment = mongoose.model('Equipment', equipmentSchema)

module.exports = Equipment
