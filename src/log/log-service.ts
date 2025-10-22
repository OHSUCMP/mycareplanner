import axios from 'axios';
import {getSessionId, sessionIdExistsInLocalForage, saveSessionId} from '../data-services/persistenceService';

const API_PATH = process.env.REACT_APP_LOG_ENDPOINT_URI;
const BEARER_TOKEN = process.env.REACT_APP_LOG_API_KEY;

export type LogRequest = {
    level?: 'error' | 'warn' | 'info' | 'debug';
    event?: string;
    page?: string;
    message: string;
    resourceCount?: number;
    sessionId?: string;
}

// Variable to store the session ID
let sessionId: string | null = null;

const generateSessionId = (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const initializeSession = (): string => {
    sessionId = generateSessionId();
    return sessionId;
}

export const clearSession = (): void => {
    sessionId = null;
}

const ensureSessionId = async (): Promise<void> => {
    if (await sessionIdExistsInLocalForage()) {
        const retrievedSessionId = await getSessionId();
        if (retrievedSessionId) {
            sessionId = retrievedSessionId;
        }
    } else {
        sessionId = initializeSession();
        await saveSessionId(sessionId);
    }
}

export const doLog = async (request: LogRequest): Promise<void> => {
    const isLoggingEnabled = process.env.REACT_APP_LOG_ENABLED === 'true';
    if (!isLoggingEnabled) {
        return;
    }

    await ensureSessionId();
    if (!sessionId) {
        console.error('Session ID is not initialized. Make sure to call initializeSession() on user login.');
        return;
    }

    const url = `${API_PATH}/log/do-log`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${BEARER_TOKEN}`
        }
    };

    const logRequest = {...request, sessionId};

    axios.post(url, logRequest, config)
        .then(response => {
            // do nothing
        }).catch(error => {
            console.error('Error logging event:', error);
        })
}
