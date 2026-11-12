
const Equipment = require('../models/Equipment')

// @desc Add new equipment
// @route POST /api/equipment
const addEquipment = async (req, res) => {
  try {
    const { name, category, lab, condition, status } = req.body

    // Issued status must only be assigned through the issue workflow.
    if (status === 'Issued') {
      return res.status(400).json({
        success: false,
        message: 'Use the Issue Equipment workflow to issue equipment',
      })
    }

    const equipment = await Equipment.create({
      name,
      category,
      lab,
      condition,
      status: status || 'Available',
      issuedTo: '',
      issuedAt: null,
      expectedReturnDate: null,
    })

    res.status(201).json({
      success: true,
      message: 'Equipment added successfully',
      data: equipment,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
}

// @desc Get all equipment
// @route GET /api/equipment
const getEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.find().sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: equipment.length,
      data: equipment,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// @desc Get equipment by ID
// @route GET /api/equipment/:id
const getEquipmentById = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      })
    }

    res.status(200).json({
      success: true,
      data: equipment,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid equipment ID',
    })
  }
}

// @desc Update equipment details
// @route PUT /api/equipment/:id
const updateEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      })
    }

    const { name, category, lab, condition, status } = req.body

    // Prevent direct status changes into or out of Issued.
    if (
      status === 'Issued' &&
      equipment.status !== 'Issued'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Use the Issue Equipment workflow to issue equipment',
      })
    }

    if (
      equipment.status === 'Issued' &&
      status &&
      status !== 'Issued'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Return the equipment before changing its status',
      })
    }

    // Only allow editable inventory fields.
    // Allocation fields cannot be changed through this endpoint.
    if (name !== undefined) equipment.name = name
    if (category !== undefined) equipment.category = category
    if (lab !== undefined) equipment.lab = lab
    if (condition !== undefined) equipment.condition = condition

    if (status !== undefined) {
      equipment.status = status
    }

    await equipment.save()

    res.status(200).json({
      success: true,
      message: 'Equipment updated successfully',
      data: equipment,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
}

// @desc Delete equipment
// @route DELETE /api/equipment/:id
const deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      })
    }

    if (equipment.status === 'Issued') {
      return res.status(400).json({
        success: false,
        message: 'Return issued equipment before deleting it',
      })
    }

    await equipment.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Equipment deleted successfully',
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid equipment ID',
    })
  }
}

// @desc Issue equipment to a person
// @route POST /api/equipment/:id/issue
const issueEquipment = async (req, res) => {
  try {
    const { issuedTo, expectedReturnDate } = req.body

    if (!issuedTo || !issuedTo.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Borrower name is required',
      })
    }

    if (!expectedReturnDate) {
      return res.status(400).json({
        success: false,
        message: 'Expected return date is required',
      })
    }

    const returnDate = new Date(expectedReturnDate)

    if (Number.isNaN(returnDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expected return date',
      })
    }

    if (returnDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Expected return date must be in the future',
      })
    }

    const equipment = await Equipment.findById(req.params.id)

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      })
    }

    if (equipment.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: 'Only available equipment can be issued',
      })
    }

    if (equipment.condition !== 'Good') {
      return res.status(400).json({
        success: false,
        message: 'Equipment requiring repair cannot be issued',
      })
    }

    equipment.status = 'Issued'
    equipment.issuedTo = issuedTo.trim()
    equipment.issuedAt = new Date()
    equipment.expectedReturnDate = returnDate

    await equipment.save()

    res.status(200).json({
      success: true,
      message: 'Equipment issued successfully',
      data: equipment,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
}

// @desc Return issued equipment
// @route POST /api/equipment/:id/return
const returnEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      })
    }

    if (equipment.status !== 'Issued') {
      return res.status(400).json({
        success: false,
        message: 'This equipment is not currently issued',
      })
    }

    equipment.status = 'Available'
    equipment.issuedTo = ''
    equipment.issuedAt = null
    equipment.expectedReturnDate = null

    await equipment.save()

    res.status(200).json({
      success: true,
      message: 'Equipment returned successfully',
      data: equipment,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
}

module.exports = {
  addEquipment,
  getEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  issueEquipment,
  returnEquipment,
}
