const devEndpoint = "http://localhost:8000/";
const prodEndpoint = "// TODO: Change this to your production endpoint!";

const isProduction = process.env.NODE_ENV === "production";
export const endpoint = isProduction ? prodEndpoint : devEndpoint;
