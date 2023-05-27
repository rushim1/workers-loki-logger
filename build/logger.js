import { formatErrorToString } from './error-formatter.js';
import { isNotNullOrUndefined } from './lib.js';
export class Logger {
    messages = [];
    mdcString = null;
    getTimeNanoSecondsCallCount = 0;
    mdc;
    stream;
    lokiSecret;
    lokiUrl;
    fetch;
    tenantId;
    cloudflareContext;
    loggerReceiver;
    _getTimeNanoSeconds;
    constructor(loggerConfig) {
        this.stream = loggerConfig.stream;
        this.lokiSecret = loggerConfig.lokiSecret;
        this.mdc = new Map(Object.entries(loggerConfig.mdc ?? {}));
        this.lokiUrl = loggerConfig.lokiUrl ?? 'https://logs-prod-eu-west-0.grafana.net';
        this.fetch = loggerConfig.fetch ?? ((input, init) => fetch(input, init));
        this.cloudflareContext = loggerConfig.cloudflareContext ?? {};
        this.loggerReceiver = loggerConfig.logReceiver ?? console;
        this.tenantId = loggerConfig.tenantId;
        this._getTimeNanoSeconds = loggerConfig.getTimeNanoSeconds ?? ((count) => Date.now() * 1000000 + count);
    }
    getTimeNanoSeconds() {
        return this._getTimeNanoSeconds(this.getTimeNanoSecondsCallCount++);
    }
    mdcSet(key, value) {
        this.mdcString = null;
        this.mdc.set(key, value);
    }
    mdcDelete(key) {
        this.mdcString = null;
        this.mdc.delete(key);
    }
    mdcGet(key) {
        return this.mdc.get(key);
    }
    async flush() {
        if (this.messages.length === 0) {
            this.loggerReceiver.debug('logger has no messages to flush');
            return;
        }
        const mdcString = this.mdcFormatString();
        const request = {
            streams: [
                {
                    stream: this.stream,
                    values: this.messages.map((messageEntry) => [
                        messageEntry.time.toString(),
                        mdcString + 'level=' + messageEntry.level + ' ' + messageEntry.message,
                    ]),
                },
            ],
        };
        let headers = {
            'Content-Type': 'application/json'
        };
        if (this.lokiSecret != null) {
            headers['Authorization'] = `Basic ${this.lokiSecret}`;
        }
        if (this.tenantId != null) {
            headers['X-Scope-OrgID'] = this.tenantId;
        }
        const saveLogsPromise = new Promise(async (resolve, reject) => {
            try {
                console.log(await this.fetch(`${this.lokiUrl}/loki/api/v1/push`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(request),
                }));
            }
            catch (e) {
                console.log(e.toString());
            }
            resolve("Success");
        });
        this.messages = [];
        if (isCloudflareContext(this.cloudflareContext)) {
            await this.cloudflareContext.waitUntil(saveLogsPromise);
        }
        else {
            await saveLogsPromise;
        }
    }
    info(message) {
        this.messages.push({
            time: this.getTimeNanoSeconds(),
            message,
            level: 'info',
        });
        this.loggerReceiver.info(this.mdcFormatString() + message);
    }
    error(message, error) {
        if (isNotNullOrUndefined(error)) {
            message += ' ' + formatErrorToString(error);
        }
        this.messages.push({
            time: this.getTimeNanoSeconds(),
            message,
            level: 'error',
        });
        this.loggerReceiver.error(this.mdcFormatString() + message, error);
    }
    fatal(message, error) {
        if (isNotNullOrUndefined(error)) {
            message += ' ' + formatErrorToString(error);
        }
        this.messages.push({
            time: this.getTimeNanoSeconds(),
            message,
            level: 'fatal',
        });
        this.loggerReceiver.error(this.mdcFormatString() + message, error);
    }
    warn(message, error) {
        if (isNotNullOrUndefined(error)) {
            message += ' ' + formatErrorToString(error);
        }
        this.messages.push({
            time: this.getTimeNanoSeconds(),
            message,
            level: 'warn',
        });
        this.loggerReceiver.warn(this.mdcFormatString() + message, error);
    }
    mdcFormatString() {
        if (isNotNullOrUndefined(this.mdcString)) {
            return this.mdcString;
        }
        let newMdcString = '';
        for (const entry of this.mdc.entries()) {
            newMdcString += entry[0] + '=' + entry[1] + ' ';
        }
        this.mdcString = newMdcString;
        return this.mdcString;
    }
}
function isCloudflareContext(context) {
    return isNotNullOrUndefined(context) && Object.getPrototypeOf(context).hasOwnProperty('waitUntil');
}
//# sourceMappingURL=logger.js.map