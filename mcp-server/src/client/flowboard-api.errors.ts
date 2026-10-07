export class FlowBoardApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public details: unknown,
    message: string
  ) {
    super(message);
    this.name = "FlowBoardApiError";
  }
}

export { FlowBoardApiError as ApiError };
