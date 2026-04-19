import axios from 'axios'

const API_URL = 'http://127.0.0.1:8000/api/'

export const loginUser = async (data) => {
  return axios.post(`${API_URL}token/`, data)
}

export const registerUser = async (data) => {
  return axios.post(`${API_URL}register/`, data)
}