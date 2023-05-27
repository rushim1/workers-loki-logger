export interface LoggerReceiver {
    debug(...data: any[]): void;
    error(...data: any[]): void;
    info(...data: any[]): void;
    warn(...data: any[]): void;
}
type Fetch = (input: Request | string, init?: RequestInit) => Promise<Response>;
export interface LoggerConfig {
    lokiSecret?: string;
    stream: {
        [p: string]: string;
    };
    cloudflareContext?: {};
    lokiUrl?: string;
    fetch?: Fetch;
    mdc?: {
        [p: string]: string;
    };
    logReceiver?: LoggerReceiver;
    tenantId?: string;
    getTimeNanoSeconds?: (callCount: number) => number;
}
export declare class Logger {
    private messages;
    private mdcString;
    private getTimeNanoSecondsCallCount;
    private readonly mdc;
    private readonly stream;
    private readonly lokiSecret?;
    private readonly lokiUrl;
    private readonly fetch;
    private readonly tenantId?;
    private readonly cloudflareContext;
    private readonly loggerReceiver;
    private readonly _getTimeNanoSeconds;
    constructor(loggerConfig: LoggerConfig);
    private getTimeNanoSeconds;
    mdcSet(key: string, value: string): void;
    mdcDelete(key: string): void;
    mdcGet(key: string): string | undefined;
    flush(): Promise<void>;
    info(message: string): void;
    error(message: string, error?: any): void;
    fatal(message: string, error?: any): void;
    warn(message: string, error?: any): void;
    mdcFormatString(): string;
}
export {};
//# sourceMappingURL=logger.d.ts.map