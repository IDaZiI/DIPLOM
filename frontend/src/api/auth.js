import axios from 'axios'
import { BASE_API_URL } from '../config/api'

export const loginUser = async (data) => {
  return axios.post(`${BASE_API_URL}token/`, data)
}