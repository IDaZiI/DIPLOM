import axios from 'axios'

const API_URL = 'http://127.0.0.1:8000/api/availabilities/'

const getAuthHeader = () => {
  const token = localStorage.getItem('access')
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