import { vi } from 'vitest';
window.scrollTo = vi.fn(); window.alert = vi.fn(); window.confirm = vi.fn(() => true); window.prompt = vi.fn(() => 'reason');
URL.createObjectURL = vi.fn(() => 'blob:x');
