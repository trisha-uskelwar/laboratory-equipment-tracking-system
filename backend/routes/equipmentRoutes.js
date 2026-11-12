
const express = require('express')
const router = express.Router()

const {
  addEquipment,
  getEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  issueEquipment,
  returnEquipment,
} = require('../controllers/equipmentController')

// Existing CRUD routes
router.get('/', getEquipment)
router.post('/', addEquipment)
router.get('/:id', getEquipmentById)
router.put('/:id', updateEquipment)
router.delete('/:id', deleteEquipment)

// Issue and return routes
router.post('/:id/issue', issueEquipment)
router.post('/:id/return', returnEquipment)

module.exports = router
