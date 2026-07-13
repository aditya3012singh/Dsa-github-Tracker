
declare namespace Express {

    export interface UserPayload {
        id: string;
        rollNo: string;
    }

    export interface Request {

        requestId: string;

        traceId: string;

        startTime: number;

        user?: UserPayload;
    }
    
}