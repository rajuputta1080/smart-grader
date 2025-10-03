import axios from 'axios';

const API_URL = "http://localhost:5000/api/evaluate";

export const evaluateSheet = async (formData) => {
  const res = await axios.post(API_URL, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};
