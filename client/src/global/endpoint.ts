const devEndpoint = "http://localhost:8000/";
const prodEndpoint = "https://cs1951v-editablenodes.onrender.com/";

const isProduction = process.env.NODE_ENV === "production";
export const endpoint = isProduction ? prodEndpoint : devEndpoint;
