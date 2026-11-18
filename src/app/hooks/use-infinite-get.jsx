import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/auth";
import { toast } from "react-toastify";

const fetchData = async (url, token, pageParam, useHeaders = true) => {
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fullUrl = `${url}${url.includes("?") ? "&" : "?"}page=${pageParam}`;

  try {
    const { data } = await axios.get(fullUrl, useHeaders ? { headers } : {});
    return data;
  } catch (error) {
    const errMessage = error.response?.data?.message || "Something went wrong";
    throw new Error(errMessage);
  }
};

const useInfiniteGet = (url, queryKey, enabled = true) => {
  const { token } = useAuth();

  return useInfiniteQuery({
    queryKey: [queryKey],
    queryFn: ({ pageParam = 1 }) => fetchData(url, token, pageParam),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.data.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled,
    onError: (error) => {
      toast.error(error.message, "error");
    },
  });
};

export default useInfiniteGet;
