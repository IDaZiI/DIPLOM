import axios from 'axios'
import { getAccessToken } from '../utils/auth'
import { BASE_API_URL } from '../config/api'

const API_URL = `${BASE_API_URL}availabilities/`

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