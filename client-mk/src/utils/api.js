import axios from 'axios';
import { errorToast } from './toast';

const API_URL = 'http://localhost:8080';

function bearerToken(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export async function fetchOverview(token) {
  try {
    const resp = await axios.get(`${API_URL}/analytics/overview`, bearerToken(token));
    return resp.data;
  } catch (error) {
    errorToast(error.message);
    console.error(error);
    return null;
  }
}

export async function fetchCustomerSegmentation(token) {
  try {
    const resp = await axios.get(`${API_URL}/analytics/customer-segmentation`, bearerToken(token));
    return resp.data;
  } catch (error) {
    errorToast(error.message);
    console.error(error);
    return null;
  }
}

export async function fetchCategoryBreakdown(token) {
  try {
    const resp = await axios.get(`${API_URL}/analytics/category-breakdown`, bearerToken(token));
    return resp.data;
  } catch (error) {
    errorToast(error.message);
    console.error(error);
    return null;
  }
}

export async function fetchMerchantPerformance(token) {
  try {
    const resp = await axios.get(`${API_URL}/analytics/merchant-performance`, bearerToken(token));
    return resp.data;
  } catch (error) {
    errorToast(error.message);
    console.error(error);
    return null;
  }
}

export async function login(data) {
  try {
    const resp = await axios.post(`${API_URL}/auth/login`, data);
    return resp.data;
  } catch (error) {
    if (error?.response?.data?.error) {
      errorToast(error.response.data.error);
    } else {
      errorToast(error.message);
    }
    console.error(error);
    return null;
  }
}

export async function signup(data) {
  try {
    const resp = await axios.post(`${API_URL}/auth/signup`, data);
    return resp.data;
  } catch (error) {
    if (error?.response?.data?.error) {
      errorToast(error.response.data.error);
    } else {
      errorToast(error.message);
    }
    console.error(error);
    return null;
  }
}

export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
