import axios from 'axios'
import { getAccessToken } from '../utils/auth'
import { BASE_API_URL } from '../config/api'

const API_URL = `${BASE_API_URL}availabilities/`

const ADMIN_WAITERS_URL = `${BASE_API_URL}admin/waiters/`

const getAuthHeader = () => {
  const token = getAccessToken()
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}

export const getAvailabilities = async () => {
  return axios.get(API_URL, getAuthHeader())
}

export const createAvailability = async (data) => {
  return axios.post(API_URL, data, getAuthHeader())
}

export const updateAvailability = async (id, data) => {
  return axios.patch(`${API_URL}${id}/`, data, getAuthHeader())
}

export const deleteAvailability = async (id) => {
  return axios.delete(`${API_URL}${id}/`, getAuthHeader())
}

export const getWaiters = async () => {
  return axios.get(ADMIN_WAITERS_URL, getAuthHeader())
}

export const createWaiter = async (data) => {
  return axios.post(ADMIN_WAITERS_URL, data, getAuthHeader())
}

export const updateWaiter = async (id, data) => {
  return axios.patch(`${ADMIN_WAITERS_URL}${id}/`, data, getAuthHeader())
}

export const getCurrentUser = async () => {
  const response = await axios.get(`${BASE_API_URL}me/`, getAuthHeader())
  return response.data
}

export const getMyConfirmedShifts = async () => {
  return axios.get(`${BASE_API_URL}confirmed-shifts/`, getAuthHeader())
}