interface ISuccessfulServiceResponse<T> {
  message: "";
  payload: T;
  success: true;
}

interface IFailureServiceResponse {
  message: string;
  payload: null;
  success: false;
}

export type IServiceResponse<T> =
  | ISuccessfulServiceResponse<T>
  | IFailureServiceResponse;

export function successfulServiceResponse<T>(payload: T): IServiceResponse<T> {
  return {
    message: "",
    payload: payload,
    success: true,
  };
}

export function failureServiceResponse<T>(
  message: string
): IServiceResponse<T> {
  return {
    message: message,
    payload: null,
    success: false,
  };
}
