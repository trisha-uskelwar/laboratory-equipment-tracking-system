
import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Get all equipment
export const getEquipment = async () => {
  const response = await API.get('/equipment')
  return response.data
}

// Add equipment
export const createEquipment = async (equipmentData) => {
  const response = await API.post('/equipment', equipmentData)
  return response.data
}

// Update equipment
export const updateEquipment = async (id, equipmentData) => {
  const response = await API.put(`/equipment/${id}`, equipmentData)
  return response.data
}

// Delete equipment
export const deleteEquipment = async (id) => {
  const response = await API.delete(`/equipment/${id}`)
  return response.data
}

// Issue equipment
export const issueEquipment = async (id, allocationData) => {
  const response = await API.post(
    `/equipment/${id}/issue`,
    allocationData
  )
  return response.data
}

// Return equipment
export const returnEquipment = async (id) => {
  const response = await API.post(`/equipment/${id}/return`)
  return response.data
}
