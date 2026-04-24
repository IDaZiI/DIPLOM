import axios from 'axios'
import { BASE_API_URL } from '../config/api'

const API_URL = `${BASE_API_URL}`

const getAuthConfig = () => {
  const token = localStorage.getItem('access')

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}

export const getAvailableTables = async (params) => {
  const response = await axios.get(`${API_URL}tables/available/`, {
    params,
  })
  return response.data
}

export const createReservation = async (data) => {
  const response = await axios.post(`${API_URL}reservations/`, data)
  return response.data
}

export const getTables = async () => {
  const response = await axios.get(`${API_URL}tables/`, getAuthConfig())
  return response.data
}

export const createTable = async (data) => {
  const response = await axios.post(`${API_URL}tables/`, data, getAuthConfig())
  return response.data
}

export const updateTable = async (id, data) => {
  const response = await axios.patch(
    `${API_URL}tables/${id}/`,
    data,
    getAuthConfig()
  )
  return response.data
}

export const deleteTable = async (id) => {
  const response = await axios.delete(`${API_URL}tables/${id}/`, getAuthConfig())
  return response.data
}

export const getTableFeatures = async () => {
  const response = await axios.get(`${API_URL}table-features/`)
  return response.data
}

export const createTableFeature = async (data) => {
  const response = await axios.post(`${API_URL}table-features/`, data, getAuthConfig())
  return response.data
}

export const updateTableFeature = async (id, data) => {
  const response = await axios.patch(
    `${API_URL}table-features/${id}/`,
    data,
    getAuthConfig()
  )
  return response.data
}

export const deleteTableFeature = async (id) => {
  const response = await axios.delete(`${API_URL}table-features/${id}/`, getAuthConfig())
  return response.data
}