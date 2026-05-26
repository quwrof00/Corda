export const DEMO_CREDENTIALS = {
    email: "test@corda.com",
    password: "Test@123",
    name: "Corda Test User",
} as const;

export function isDemoCredentials(email: string, password: string) {
    return email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password;
}
