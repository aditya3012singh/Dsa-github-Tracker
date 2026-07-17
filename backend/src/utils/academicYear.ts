/**
 * Calculates the current academic year dynamically based on the current date.
 * Assuming the academic year rolls over in July (0-indexed month 6).
 * 
 * Example:
 * - If today is May 2026, returns 2026 (The 2026 batch is still active).
 * - If today is August 2026, returns 2027 (The 2027 batch are now the 4th years).
 */
export const getCurrentAcademicYear = (): number => {
    const now = new Date();
    // 6 = July (0-indexed). If we are in July or later, the new academic year has started.
    if (now.getMonth() >= 6) {
        return now.getFullYear() + 1;
    }
    return now.getFullYear();
};
