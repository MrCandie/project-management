import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/auth";

const fetchData = async (url, token, logout, useHeaders = true) => {
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  try {
    const { data } = await axios.get(url, useHeaders ? { headers } : {});
    return data;
  } catch (error) {
    const errMessage = error.response?.data?.message || "Something went wrong";

    // const messages = ["unauthenticated", "authentication failed"];

    // if (messages.includes(errMessage.toLowerCase())) logout();

    throw new Error(errMessage);
  }
};

const useGet = (url, queryKey, useHeaders = true, enabled = true) => {
  const { token, logout } = useAuth();

  return useQuery({
    queryKey: [queryKey],
    queryFn: () => fetchData(url, token, logout, useHeaders),
    onError: () => {
      // toast.error("An unexpected error occurred");
    },
    enabled,
  });
};

export default useGet;
