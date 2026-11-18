import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/auth";
import { toast } from "react-toastify";

const patchData = async ({
  url,
  body,
  message,
  token,
  contentType = "application/json",
  showToast = true,
  logout,
}) => {
  const headers = {
    Accept: "application/json",
    "Content-Type": contentType,
    Authorization: `Bearer ${token}`,
  };

  try {
    const { data } = await axios.patch(url, body, { headers });
    message && toast.success(message);
    return data;
  } catch (error) {
    const statusCode = error.response?.status || 500; // Default to 500 if no status is available
    const errorBody = error.response?.data?.message || "Something went wrong";

    // const messages = ["unauthenticated", "authentication failed"];

    // if (messages.includes(errorBody.toLowerCase())) logout();

    let message;
    if (typeof errorBody !== "string") {
      message = "Something went wrong";
    } else {
      message = errorBody;
    }

    // Show an error toast
    showToast && toast.error(message);

    // Throw an error with both statusCode and message for external handling
    const customError = new Error(errorBody);
    customError.statusCode = statusCode; // Attach statusCode to the error object
    throw customError;
  }
};

export const usePatch = ({
  queryKey,
  url,
  title,
  onSuccess,
  contentType = "application/json",
  showToast = true,
}) => {
  const { token, logout } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body) =>
      patchData({ url, body, title, token, contentType, showToast, logout }), // Pass showToast to the mutation function
    onSuccess: (data, variables) => {
      onSuccess(data, variables);
      queryClient.invalidateQueries({ queryKey: [queryKey] }); // Invalidate related queries on success
    },
  });
};
