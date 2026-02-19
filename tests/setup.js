// Mock chrome.storage.local API for testing
const storageData = {};

const chromeStorageMock = {
    local: {
        get: jest.fn((keys, callback) => {
            if (typeof keys === 'string') {
                keys = [keys];
            }
            const result = {};
            if (Array.isArray(keys)) {
                keys.forEach((key) => {
                    if (storageData[key] !== undefined) {
                        result[key] = storageData[key];
                    }
                });
            } else if (typeof keys === 'object' && keys !== null) {
                Object.keys(keys).forEach((key) => {
                    result[key] = storageData[key] !== undefined ? storageData[key] : keys[key];
                });
            }
            if (callback) {
                callback(result);
            }
            return Promise.resolve(result);
        }),
        set: jest.fn((items, callback) => {
            Object.assign(storageData, items);
            if (callback) {
                callback();
            }
            return Promise.resolve();
        }),
        _data: storageData,
        _clear: () => {
            Object.keys(storageData).forEach((key) => delete storageData[key]);
        },
    },
};

global.chrome = {
    storage: chromeStorageMock,
};

// Helper to clear storage between tests
global.clearMockStorage = () => {
    chromeStorageMock.local._clear();
    chromeStorageMock.local.get.mockClear();
    chromeStorageMock.local.set.mockClear();
};

// Mock IntersectionObserver (not available in jsdom)
global.IntersectionObserver = class {
    constructor(callback) { this._cb = callback; }
    observe() { }
    unobserve() { }
    disconnect() { }
};
