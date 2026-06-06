export function log(
    requestId: string, 
    level: 'INFO' | 'WARN' | 'ERROR', 
    message: string, 
    context?: Record<string, any>
) {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId,
        level,
        message,
        ...context
    }));
}