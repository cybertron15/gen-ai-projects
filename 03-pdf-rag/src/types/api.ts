export interface UploadResponse {
    success: boolean;
    urls: string[];
    error?: {
        message: string;
        detail: any;
    };
}